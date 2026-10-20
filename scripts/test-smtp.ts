/**
 * Test direct de la configuration SMTP, sans passer par le parcours de
 * connexion. Lit les variables SMTP_* du fichier .env et tente un envoi.
 *
 *   npm run test:smtp -- destinataire@exemple.com
 *
 * Sans argument, l'e-mail est envoye a SMTP_USER (donc a vous-meme).
 */
import nodemailer from "nodemailer";

async function main() {
  const destinataire = process.argv[2] || process.env.SMTP_USER;

  if (!process.env.SMTP_HOST) {
    console.error("❌ SMTP_HOST n'est pas defini dans .env — rien a tester.");
    console.error("   Sans lui, les codes MFA restent dans les journaux.");
    process.exit(1);
  }
  if (!destinataire) {
    console.error("❌ Aucun destinataire : passez-le en argument ou definissez SMTP_USER.");
    process.exit(1);
  }

  const port = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === "true";

  console.log("Configuration lue :");
  console.log("  host     :", process.env.SMTP_HOST);
  console.log("  port     :", port);
  console.log("  secure   :", secure, secure ? "(TLS direct)" : "(STARTTLS)");
  console.log("  user     :", process.env.SMTP_USER || "(aucun — relais ouvert/par IP)");
  console.log("  password :", process.env.SMTP_PASSWORD ? "(defini)" : "(aucun)");
  console.log("  from     :", process.env.SMTP_FROM || "no-reply@digidoc.local");
  console.log("  vers     :", destinataire);

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
      : undefined,
  });

  console.log("\n1/2 Verification de la connexion au serveur...");
  await transporter.verify();
  console.log("    ✅ connexion et authentification acceptees");

  console.log("2/2 Envoi d'un message de test...");
  const info = await transporter.sendMail({
    from: process.env.SMTP_FROM || "no-reply@digidoc.local",
    to: destinataire,
    subject: "DigiDoc — test de configuration SMTP",
    text:
      "Si vous lisez ce message, l'envoi des codes MFA par e-mail fonctionne.\n\n" +
      "Ce message a ete envoye par scripts/test-smtp.ts.",
  });
  console.log("    ✅ accepte par le serveur, identifiant :", info.messageId);
  if (info.rejected?.length) {
    console.log("    ⚠️  destinataires rejetes :", info.rejected.join(", "));
  }
  console.log("\n>>> SMTP operationnel. Les codes MFA partiront reellement.");
}

main().catch((e) => {
  console.error("\n❌ Echec :", e?.message || e);
  const m = String(e?.message || "");
  if (m.includes("Invalid login") || m.includes("535") || m.includes("534")) {
    console.error("   Avec Gmail, c'est presque toujours le mot de passe : il faut un");
    console.error("   mot de passe d'application de 16 caracteres, pas celui du compte.");
    console.error("   https://myaccount.google.com/apppasswords");
  }
  if (m.includes("ETIMEDOUT") || m.includes("ECONNREFUSED")) {
    console.error("   Le serveur est injoignable : verifiez l'hote, le port, et qu'aucun");
    console.error("   pare-feu ne bloque la sortie (le 587 et le 465 sont souvent filtres).");
  }
  if (m.includes("self-signed") || m.includes("certificate")) {
    console.error("   Certificat refuse : fréquent sur un relais interne. Dites-le moi,");
    console.error("   il faudra assouplir la verification TLS pour ce relais precis.");
  }
  process.exit(1);
});
