import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { verifyOtpChallenge, getChallengeOwner } from "@/lib/mfa/otp";
import { issueSessionForUser } from "@/lib/auth/completeLogin";
import { registerFailedAttempt, resetFailedAttempts } from "@/lib/auth/lockout";
import { withLogging } from "@/lib/apiLogger";
import { logger } from "@/lib/logger";

const FAILURE_MESSAGES: Record<string, string> = {
  not_found: "Code de vérification introuvable",
  expired: "Le code a expiré, demandez-en un nouveau",
  already_used: "Ce code a déjà été utilisé",
  too_many_attempts: "Trop de tentatives, demandez un nouveau code",
  invalid_code: "Code incorrect",
};

/**
 * POST /api/auth/mfa/verify
 * Deuxième étape de connexion : valide le code OTP et, si correct, émet la
 * session (comme /api/auth/login-unified le ferait directement pour un
 * compte exempté de MFA).
 */
export const POST = withLogging("auth.mfa-verify", async (req: NextRequest) => {
  try {
    const { challengeId, code } = await req.json();
    if (!challengeId || !code) {
      return NextResponse.json(
        { message: "Champs requis manquants" },
        { status: 400 }
      );
    }

    const result = await verifyOtpChallenge(Number(challengeId), String(code));

    if (!result.ok) {
      logger.warning(`Échec de vérification MFA : ${FAILURE_MESSAGES[result.reason]}`, {
        context: "auth.mfa",
        meta: { challengeId, reason: result.reason },
      });

      // Un code incorrect compte aussi comme un échec de connexion, au même
      // titre qu'un mauvais mot de passe (cohérence avec le verrouillage).
      if (result.reason === "invalid_code") {
        const ownerId = await getChallengeOwner(Number(challengeId));
        if (ownerId) await registerFailedAttempt(ownerId);
      }

      return NextResponse.json(
        { message: FAILURE_MESSAGES[result.reason] },
        { status: 401 }
      );
    }

    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: result.utilisateurId },
      include: { roles: true, agents: true },
    });

    if (!utilisateur) {
      return NextResponse.json(
        { message: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    await resetFailedAttempts(utilisateur.id);

    const token = await issueSessionForUser(utilisateur, req);
    const { password: _password, ...utilisateurSafe } = utilisateur;

    logger.success(`Connexion réussie (MFA validé) : ${utilisateur.username}`, {
      context: "auth.mfa",
      meta: { userId: utilisateur.id },
    });

    return NextResponse.json({
      ...utilisateurSafe,
      token,
      accountType: "utilisateur",
      mustChangePassword: utilisateur.must_change_password,
    });
  } catch (error) {
    console.error("Erreur lors de la vérification MFA:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
});
