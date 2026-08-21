import { logger } from "@/lib/logger";

export interface SmsProvider {
  send(to: string, message: string): Promise<void>;
}

/**
 * Fournisseur par défaut tant qu'aucune passerelle SMS réelle n'est
 * choisie/configurée : le message est simplement journalisé (visible dans
 * /logs), ce qui permet de tester tout le parcours MFA sans dépendance
 * externe. À remplacer via `setSmsProvider(...)` une fois un fournisseur
 * réel choisi (Twilio, Orange SMS API, etc.).
 */
class StubSmsProvider implements SmsProvider {
  async send(to: string, message: string): Promise<void> {
    logger.info(`[SMS — non envoyé, fournisseur non configuré] vers ${to} : ${message}`, {
      context: "mfa.sms-stub",
      meta: { to },
    });
  }
}

let currentProvider: SmsProvider = new StubSmsProvider();

export function getSmsProvider(): SmsProvider {
  return currentProvider;
}

export function setSmsProvider(provider: SmsProvider): void {
  currentProvider = provider;
}

export async function sendSmsOtp(phone: string, code: string): Promise<void> {
  const message = `Votre code de vérification DigiDoc est : ${code}. Il expire dans 5 minutes.`;
  await getSmsProvider().send(phone, message);
}
