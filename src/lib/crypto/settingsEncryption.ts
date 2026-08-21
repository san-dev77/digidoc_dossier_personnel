import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";

/**
 * Dérive une clé de 32 octets à partir de LDAP_CONFIG_ENCRYPTION_KEY (peu
 * importe sa longueur d'origine). Utilisée pour chiffrer les secrets stockés
 * dans `app_settings` (ex: mot de passe du compte de service LDAP) — jamais
 * en clair en base.
 */
function getKey(): Buffer {
  const secret =
    process.env.LDAP_CONFIG_ENCRYPTION_KEY ||
    "changez-moi-en-production-urgence";
  return crypto.createHash("sha256").update(secret).digest();
}

export function encryptSecret(plainText: string): string {
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv(ALGORITHM, getKey(), iv);
  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const authTag = cipher.getAuthTag();
  return [
    iv.toString("base64"),
    authTag.toString("base64"),
    encrypted.toString("base64"),
  ].join(".");
}

export function decryptSecret(payload: string): string {
  if (!payload) return "";
  const [ivB64, tagB64, dataB64] = payload.split(".");
  if (!ivB64 || !tagB64 || !dataB64) return "";

  try {
    const iv = Buffer.from(ivB64, "base64");
    const authTag = Buffer.from(tagB64, "base64");
    const data = Buffer.from(dataB64, "base64");
    const decipher = crypto.createDecipheriv(ALGORITHM, getKey(), iv);
    decipher.setAuthTag(authTag);
    const decrypted = Buffer.concat([decipher.update(data), decipher.final()]);
    return decrypted.toString("utf8");
  } catch {
    return "";
  }
}
