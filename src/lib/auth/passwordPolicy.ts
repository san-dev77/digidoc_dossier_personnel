import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth/password";
import { getNumberSetting } from "@/lib/settings";

export interface PasswordPolicyResult {
  valid: boolean;
  errors: string[];
}

const HISTORY_LIMIT = 5;

/**
 * Vérifie la complexité du mot de passe et, si un utilisateur est fourni,
 * qu'il ne réutilise pas l'un de ses derniers mots de passe.
 */
export async function validatePasswordPolicy(
  password: string,
  utilisateurId?: number
): Promise<PasswordPolicyResult> {
  const errors: string[] = [];
  const minLength = await getNumberSetting("security.passwordMinLength");

  if (password.length < minLength) {
    errors.push(
      `Le mot de passe doit contenir au moins ${minLength} caractères`
    );
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une majuscule");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins une minuscule");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un chiffre");
  }
  if (!/[^A-Za-z0-9]/.test(password)) {
    errors.push("Le mot de passe doit contenir au moins un caractère spécial");
  }

  if (utilisateurId) {
    const history = await prisma.password_history.findMany({
      where: { utilisateur_id: utilisateurId },
      orderBy: { created_at: "desc" },
      take: HISTORY_LIMIT,
    });

    for (const entry of history) {
      if (await comparePassword(password, entry.password_hash)) {
        errors.push(
          `Le mot de passe ne doit pas être l'un des ${HISTORY_LIMIT} derniers utilisés`
        );
        break;
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Enregistre le hash dans l'historique et ne conserve que les
 * HISTORY_LIMIT entrées les plus récentes pour cet utilisateur.
 */
export async function recordPasswordHistory(
  utilisateurId: number,
  passwordHash: string
): Promise<void> {
  await prisma.password_history.create({
    data: { utilisateur_id: utilisateurId, password_hash: passwordHash },
  });

  const overflow = await prisma.password_history.findMany({
    where: { utilisateur_id: utilisateurId },
    orderBy: { created_at: "desc" },
    skip: HISTORY_LIMIT,
    select: { id: true },
  });

  if (overflow.length > 0) {
    await prisma.password_history.deleteMany({
      where: { id: { in: overflow.map((entry) => entry.id) } },
    });
  }
}
