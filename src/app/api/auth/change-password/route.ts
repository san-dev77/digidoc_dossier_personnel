import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword, hashPassword } from "@/lib/auth/password";
import {
  validatePasswordPolicy,
  recordPasswordHistory,
} from "@/lib/auth/passwordPolicy";
import { getUserIdFromRequest } from "@/lib/permissions/permissionMiddleware";
import { withLogging } from "@/lib/apiLogger";
import { logger } from "@/lib/logger";

/**
 * POST /api/auth/change-password
 * Changement de mot de passe par l'utilisateur connecté (nécessite le mot
 * de passe actuel). Utilisé aussi bien pour le changement volontaire que
 * pour le flux `must_change_password` obligatoire.
 */
export const POST = withLogging("auth.change-password", async (req: NextRequest) => {
  try {
    const userId = await getUserIdFromRequest(req);
    if (!userId) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json(
        { message: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: userId },
    });
    if (!utilisateur) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    const currentValid = await comparePassword(
      currentPassword,
      utilisateur.password
    );
    if (!currentValid) {
      logger.warning(
        "Changement de mot de passe refusé : mot de passe actuel incorrect",
        { context: "auth.change-password", meta: { userId } }
      );
      return NextResponse.json(
        { message: "Mot de passe actuel incorrect" },
        { status: 401 }
      );
    }

    const policy = await validatePasswordPolicy(newPassword, userId);
    if (!policy.valid) {
      return NextResponse.json(
        { message: "Mot de passe invalide", errors: policy.errors },
        { status: 400 }
      );
    }

    const hashed = await hashPassword(newPassword);
    await prisma.utilisateurs.update({
      where: { id: userId },
      data: {
        password: hashed,
        password_updated_at: new Date(),
        must_change_password: false,
      },
    });
    await recordPasswordHistory(userId, hashed);

    logger.success("Mot de passe changé avec succès", {
      context: "auth.change-password",
      meta: { userId },
    });

    return NextResponse.json({ message: "Mot de passe mis à jour" });
  } catch (error) {
    console.error("Erreur changement de mot de passe:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
});
