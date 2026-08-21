import nodemailer, { type Transporter } from "nodemailer";
import { logger } from "@/lib/logger";

export interface EmailProvider {
  send(to: string, subject: string, body: string): Promise<void>;
}

/**
 * Utilisé tant que SMTP_HOST n'est pas configuré : le message est
 * simplement journalisé (visible dans /logs) au lieu d'être envoyé.
 */
class StubEmailProvider implements EmailProvider {
  async send(to: string, subject: string, body: string): Promise<void> {
    logger.info(`[E-MAIL — non envoyé, SMTP non configuré] à ${to} — ${subject} : ${body}`, {
      context: "mfa.email-stub",
      meta: { to, subject },
    });
  }
}

class SmtpEmailProvider implements EmailProvider {
  private transporter: Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === "true",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASSWORD }
        : undefined,
    });
  }

  async send(to: string, subject: string, body: string): Promise<void> {
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM || "no-reply@digidoc.local",
      to,
      subject,
      text: body,
    });
  }
}

function createDefaultProvider(): EmailProvider {
  return process.env.SMTP_HOST ? new SmtpEmailProvider() : new StubEmailProvider();
}

let currentProvider: EmailProvider = createDefaultProvider();

export function getEmailProvider(): EmailProvider {
  return currentProvider;
}

export function setEmailProvider(provider: EmailProvider): void {
  currentProvider = provider;
}

export async function sendEmailOtp(email: string, code: string): Promise<void> {
  await getEmailProvider().send(
    email,
    "Votre code de vérification DigiDoc",
    `Votre code de vérification est : ${code}. Il expire dans 5 minutes.`
  );
}
