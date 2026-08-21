import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { getNumberSetting } from "@/lib/settings";

export interface SessionMeta {
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Crée une session en base et renvoie son identifiant (jti), à embarquer
 * dans le JWT. Sert de source de vérité pour la durée max de session et le
 * délai d'inactivité — le JWT lui-même n'est qu'un porteur signé de ce jti.
 */
export async function createSession(
  utilisateurId: number,
  meta: SessionMeta = {}
): Promise<{ jti: string; expiresAt: Date }> {
  const sessionMaxHours = await getNumberSetting("security.sessionMaxHours");
  const jti = crypto.randomUUID();
  const expiresAt = new Date(Date.now() + sessionMaxHours * 60 * 60 * 1000);

  await prisma.auth_sessions.create({
    data: {
      utilisateur_id: utilisateurId,
      token_id: jti,
      ip_address: meta.ipAddress || null,
      user_agent: meta.userAgent || null,
      expires_at: expiresAt,
    },
  });

  return { jti, expiresAt };
}

export type TouchSessionResult =
  | { ok: true; utilisateurId: number }
  | { ok: false; reason: "not_found" | "revoked" | "max_duration" | "idle_timeout" };

/**
 * Valide une session existante (non révoquée, dans la durée max, pas
 * inactive au-delà du seuil configuré) et avance `last_activity_at`.
 * Utilisé par /api/auth/refresh à chaque rafraîchissement silencieux.
 */
export async function touchSession(jti: string): Promise<TouchSessionResult> {
  const session = await prisma.auth_sessions.findUnique({
    where: { token_id: jti },
  });

  if (!session) return { ok: false, reason: "not_found" };
  if (session.revoked_at) return { ok: false, reason: "revoked" };

  const now = Date.now();

  if (now > session.expires_at.getTime()) {
    return { ok: false, reason: "max_duration" };
  }

  const idleTimeoutMinutes = await getNumberSetting(
    "security.idleTimeoutMinutes"
  );
  const idleLimitMs = idleTimeoutMinutes * 60 * 1000;

  if (now - session.last_activity_at.getTime() > idleLimitMs) {
    return { ok: false, reason: "idle_timeout" };
  }

  await prisma.auth_sessions.update({
    where: { token_id: jti },
    data: { last_activity_at: new Date() },
  });

  return { ok: true, utilisateurId: session.utilisateur_id };
}

export async function revokeSession(jti: string): Promise<void> {
  await prisma.auth_sessions.updateMany({
    where: { token_id: jti, revoked_at: null },
    data: { revoked_at: new Date() },
  });
}

export async function revokeAllSessionsForUser(
  utilisateurId: number
): Promise<void> {
  await prisma.auth_sessions.updateMany({
    where: { utilisateur_id: utilisateurId, revoked_at: null },
    data: { revoked_at: new Date() },
  });
}

export async function listActiveSessions(utilisateurId: number) {
  return prisma.auth_sessions.findMany({
    where: {
      utilisateur_id: utilisateurId,
      revoked_at: null,
      expires_at: { gt: new Date() },
    },
    orderBy: { last_activity_at: "desc" },
  });
}
