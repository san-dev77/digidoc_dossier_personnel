import { prisma } from "@/lib/prisma";
import { getNumberSetting } from "@/lib/settings";

export function isLocked(utilisateur: { locked_until: Date | null }): boolean {
  return (
    !!utilisateur.locked_until && utilisateur.locked_until.getTime() > Date.now()
  );
}

/**
 * Incrémente le compteur d'échecs et verrouille le compte si le seuil
 * configuré (`security.lockoutThreshold`) est atteint.
 */
export async function registerFailedAttempt(
  utilisateurId: number
): Promise<{ locked: boolean; attemptsRemaining: number }> {
  const threshold = await getNumberSetting("security.lockoutThreshold");
  const durationMinutes = await getNumberSetting(
    "security.lockoutDurationMinutes"
  );

  const updated = await prisma.utilisateurs.update({
    where: { id: utilisateurId },
    data: { failed_login_attempts: { increment: 1 } },
  });

  if (updated.failed_login_attempts >= threshold) {
    await prisma.utilisateurs.update({
      where: { id: utilisateurId },
      data: { locked_until: new Date(Date.now() + durationMinutes * 60_000) },
    });
    return { locked: true, attemptsRemaining: 0 };
  }

  return {
    locked: false,
    attemptsRemaining: threshold - updated.failed_login_attempts,
  };
}

export async function resetFailedAttempts(utilisateurId: number): Promise<void> {
  await prisma.utilisateurs.update({
    where: { id: utilisateurId },
    data: { failed_login_attempts: 0, locked_until: null },
  });
}
