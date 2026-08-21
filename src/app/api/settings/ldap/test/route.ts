import { NextRequest, NextResponse } from "next/server";
import { requireSuperAdmin } from "@/lib/permissions/permissionMiddleware";
import { testLdapConnection, type LdapConfig } from "@/lib/ldap/ldapClient";
import { withLogging } from "@/lib/apiLogger";
import { logger } from "@/lib/logger";

/**
 * POST /api/settings/ldap/test
 * Vérifie que le compte de service peut se connecter à l'annuaire, sans
 * rien enregistrer ni authentifier d'utilisateur. Utilisé par le bouton
 * « Tester la connexion » de l'écran de paramètres de sécurité.
 */
export const POST = withLogging("settings.ldap-test", async (req: NextRequest) => {
  const authError = await requireSuperAdmin()(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const config: LdapConfig = {
      server: body.server,
      port: Number(body.port) || 636,
      baseDn: body.baseDn,
      bindDn: body.bindDn,
      bindPassword: body.bindPassword,
      loginAttribute: body.loginAttribute || "sAMAccountName",
      useTls: body.useTls !== false,
    };

    if (!config.server || !config.baseDn || !config.bindDn) {
      return NextResponse.json(
        { ok: false, message: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const result = await testLdapConnection(config);

    if (result.ok) {
      logger.success("Test de connexion LDAP réussi", {
        context: "settings.ldap-test",
        meta: { server: config.server, port: config.port },
      });
    } else {
      logger.warning(`Test de connexion LDAP échoué : ${result.message}`, {
        context: "settings.ldap-test",
        meta: { server: config.server, port: config.port },
      });
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Erreur test de connexion LDAP:", error);
    return NextResponse.json(
      { ok: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
});
