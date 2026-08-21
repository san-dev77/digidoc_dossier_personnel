import ldap, { type Client, type SearchEntry } from "ldapjs";
import { getSetting, getBooleanSetting } from "@/lib/settings";
import { decryptSecret } from "@/lib/crypto/settingsEncryption";
import { logger } from "@/lib/logger";

export interface LdapConfig {
  server: string;
  port: number;
  baseDn: string;
  bindDn: string;
  bindPassword: string;
  loginAttribute: string;
  useTls: boolean;
}

/**
 * Config LDAP directement via les variables d'environnement — un seul
 * fichier (.env) à éditer, prioritaire sur `app_settings` quand présent.
 * Pratique pour un déploiement dans un environnement où l'annuaire est
 * déjà connu (ex: poste déjà sur le réseau de la banque).
 */
function loadLdapConfigFromEnv(): LdapConfig | null {
  const server = process.env.LDAP_SERVER;
  const baseDn = process.env.LDAP_BASE_DN;
  const bindDn = process.env.LDAP_BIND_DN;

  if (!server || !baseDn || !bindDn) return null;
  if (process.env.LDAP_ENABLED === "false") return null;

  return {
    server,
    port: Number(process.env.LDAP_PORT) || 636,
    baseDn,
    bindDn,
    bindPassword: process.env.LDAP_BIND_PASSWORD || "",
    loginAttribute: process.env.LDAP_LOGIN_ATTRIBUTE || "sAMAccountName",
    useTls: process.env.LDAP_USE_TLS !== "false",
  };
}

/**
 * Charge la config LDAP : variables d'environnement en priorité (voir
 * `loadLdapConfigFromEnv`), sinon `app_settings` (réglable depuis l'écran
 * d'administration, activable/désactivable sans redéploiement). Renvoie
 * `null` si LDAP est désactivé ou si la configuration est incomplète —
 * l'appelant doit alors traiter la connexion LDAP comme indisponible.
 */
export async function loadLdapConfig(): Promise<LdapConfig | null> {
  const envConfig = loadLdapConfigFromEnv();
  if (envConfig) return envConfig;

  const enabled = await getBooleanSetting("ldap.enabled");
  if (!enabled) return null;

  const [server, port, baseDn, bindDn, bindPasswordEncrypted, loginAttribute, useTls] =
    await Promise.all([
      getSetting("ldap.server"),
      getSetting("ldap.port"),
      getSetting("ldap.baseDn"),
      getSetting("ldap.bindDn"),
      getSetting("ldap.bindPasswordEncrypted"),
      getSetting("ldap.loginAttribute"),
      getSetting("ldap.useTls"),
    ]);

  if (!server || !baseDn || !bindDn) return null;

  return {
    server,
    port: Number(port) || 636,
    baseDn,
    bindDn,
    bindPassword: bindPasswordEncrypted ? decryptSecret(bindPasswordEncrypted) : "",
    loginAttribute: loginAttribute || "sAMAccountName",
    useTls: useTls !== "false",
  };
}

function createClient(config: LdapConfig): Client {
  const scheme = config.useTls ? "ldaps" : "ldap";
  return ldap.createClient({
    url: `${scheme}://${config.server}:${config.port}`,
    timeout: 5000,
    connectTimeout: 5000,
    // En LDAPS avec un certificat d'annuaire de test/interne non reconnu,
    // il faudra assouplir ceci via une option dédiée le jour où c'est requis —
    // par défaut on garde la vérification stricte du certificat.
  });
}

function bindAsync(client: Client, dn: string, password: string): Promise<void> {
  return new Promise((resolve, reject) => {
    client.bind(dn, password, (err) => {
      if (err) reject(err);
      else resolve();
    });
  });
}

function getAttr(entry: SearchEntry, name: string): string | undefined {
  const attr = entry.pojo.attributes.find(
    (a) => a.type.toLowerCase() === name.toLowerCase()
  );
  return attr?.values[0];
}

function escapeLdapFilterValue(value: string): string {
  return value.replace(/[\\*()\0]/g, (c) => `\\${c.charCodeAt(0).toString(16).padStart(2, "0")}`);
}

export interface LdapUserAttributes {
  dn: string;
  displayName?: string;
  mail?: string;
  telephoneNumber?: string;
}

export type LdapAuthResult =
  | { ok: true; user: LdapUserAttributes }
  | {
      ok: false;
      reason:
        | "config_missing"
        | "service_bind_failed"
        | "user_not_found"
        | "invalid_credentials"
        | "connection_error";
    };

/**
 * Authentifie un utilisateur contre l'annuaire via le schéma standard
 * "search + bind" : connexion avec le compte de service pour localiser le
 * DN de l'utilisateur par son attribut de connexion configuré, puis
 * tentative de bind avec ce DN et le mot de passe fourni.
 */
export async function authenticateAgainstLdap(
  username: string,
  password: string,
  configOverride?: LdapConfig
): Promise<LdapAuthResult> {
  const config = configOverride ?? (await loadLdapConfig());
  if (!config) return { ok: false, reason: "config_missing" };

  const serviceClient = createClient(config);

  try {
    await bindAsync(serviceClient, config.bindDn, config.bindPassword);
  } catch (error) {
    logger.error("Échec du bind LDAP avec le compte de service", {
      context: "auth.ldap",
      meta: { server: config.server, error: String(error) },
    });
    serviceClient.destroy();
    return { ok: false, reason: "service_bind_failed" };
  }

  let found: LdapUserAttributes | null = null;

  try {
    found = await new Promise<LdapUserAttributes | null>((resolve, reject) => {
      serviceClient.search(
        config.baseDn,
        {
          filter: `(${config.loginAttribute}=${escapeLdapFilterValue(username)})`,
          scope: "sub",
          attributes: ["dn", "displayName", "mail", "telephoneNumber"],
        },
        (err, res) => {
          if (err) return reject(err);

          let result: LdapUserAttributes | null = null;
          res.on("searchEntry", (entry) => {
            result = {
              dn: entry.objectName || entry.dn,
              displayName: getAttr(entry, "displayName"),
              mail: getAttr(entry, "mail"),
              telephoneNumber: getAttr(entry, "telephoneNumber"),
            };
          });
          res.on("error", reject);
          res.on("end", () => resolve(result));
        }
      );
    });
  } catch (error) {
    logger.error("Erreur lors de la recherche LDAP de l'utilisateur", {
      context: "auth.ldap",
      meta: { username, error: String(error) },
    });
    serviceClient.unbind();
    return { ok: false, reason: "connection_error" };
  }

  serviceClient.unbind();

  if (!found) {
    return { ok: false, reason: "user_not_found" };
  }

  const userClient = createClient(config);
  try {
    await bindAsync(userClient, found.dn, password);
    userClient.unbind();
    return { ok: true, user: found };
  } catch {
    userClient.destroy();
    return { ok: false, reason: "invalid_credentials" };
  }
}

/**
 * Vérifie uniquement que le compte de service peut se connecter — utilisé
 * par le bouton « Tester la connexion » de l'écran d'administration, sans
 * authentifier un utilisateur particulier.
 */
export async function testLdapConnection(
  config: LdapConfig
): Promise<{ ok: true } | { ok: false; message: string }> {
  const client = createClient(config);
  try {
    await bindAsync(client, config.bindDn, config.bindPassword);
    client.unbind();
    return { ok: true };
  } catch (error) {
    client.destroy();
    return {
      ok: false,
      message: error instanceof Error ? error.message : "Connexion impossible",
    };
  }
}
