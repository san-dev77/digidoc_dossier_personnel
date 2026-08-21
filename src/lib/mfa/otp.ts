import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashPassword, comparePassword } from "@/lib/auth/password";

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 5;
const MAX_ATTEMPTS = 5;

export type MfaChannel = "sms" | "email";

export function generateOtpCode(): string {
  const max = 10 ** OTP_LENGTH;
  const n = crypto.randomInt(0, max);
  return n.toString().padStart(OTP_LENGTH, "0");
}

export function maskPhone(phone: string): string {
  const digits = phone.replace(/\s+/g, "");
  if (digits.length < 4) return "••••";
  return `${"•".repeat(digits.length - 2)}${digits.slice(-2)}`;
}

export function maskEmail(email: string): string {
  const [user, domain] = email.split("@");
  if (!domain) return "•••@•••";
  const visible = user.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(user.length - visible.length, 2))}@${domain}`;
}

/**
 * Crée un défi MFA en base (code haché, jamais stocké en clair) et renvoie
 * le code en clair une seule fois, pour l'envoi immédiat par SMS/e-mail.
 */
export async function createMfaChallenge(
  utilisateurId: number,
  channel: MfaChannel,
  maskedDestination: string
): Promise<{ challengeId: number; code: string; expiresAt: Date }> {
  const code = generateOtpCode();
  const codeHash = await hashPassword(code);
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MINUTES * 60_000);

  const challenge = await prisma.mfa_challenges.create({
    data: {
      utilisateur_id: utilisateurId,
      code_hash: codeHash,
      channel,
      destination: maskedDestination,
      expires_at: expiresAt,
    },
  });

  return { challengeId: challenge.id, code, expiresAt };
}

export type VerifyOtpResult =
  | { ok: true; utilisateurId: number }
  | {
      ok: false;
      reason:
        | "not_found"
        | "expired"
        | "already_used"
        | "too_many_attempts"
        | "invalid_code";
    };

export async function verifyOtpChallenge(
  challengeId: number,
  code: string
): Promise<VerifyOtpResult> {
  const challenge = await prisma.mfa_challenges.findUnique({
    where: { id: challengeId },
  });

  if (!challenge) return { ok: false, reason: "not_found" };
  if (challenge.consumed_at) return { ok: false, reason: "already_used" };
  if (challenge.expires_at.getTime() < Date.now()) {
    return { ok: false, reason: "expired" };
  }
  if (challenge.attempts >= MAX_ATTEMPTS) {
    return { ok: false, reason: "too_many_attempts" };
  }

  const valid = await comparePassword(code, challenge.code_hash);
  if (!valid) {
    await prisma.mfa_challenges.update({
      where: { id: challengeId },
      data: { attempts: { increment: 1 } },
    });
    return { ok: false, reason: "invalid_code" };
  }

  await prisma.mfa_challenges.update({
    where: { id: challengeId },
    data: { consumed_at: new Date() },
  });

  return { ok: true, utilisateurId: challenge.utilisateur_id };
}

export async function getChallengeOwner(
  challengeId: number
): Promise<number | null> {
  const challenge = await prisma.mfa_challenges.findUnique({
    where: { id: challengeId },
    select: { utilisateur_id: true },
  });
  return challenge?.utilisateur_id ?? null;
}
