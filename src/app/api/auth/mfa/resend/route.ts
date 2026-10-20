import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getChallengeOwner, createMfaChallenge, maskPhone, maskEmail } from "@/lib/mfa/otp";
import { sendSmsOtp } from "@/lib/mfa/smsProvider";
import { sendEmailOtp } from "@/lib/mfa/emailProvider";
import { withLogging } from "@/lib/apiLogger";
import { logger } from "@/lib/logger";

const RESEND_WINDOW_MINUTES = 10;
const MAX_RESENDS_IN_WINDOW = 3;

/**
 * POST /api/auth/mfa/resend
 * Renvoie un nouveau code, éventuellement sur un autre canal (ex: bascule
 * SMS -> e-mail si le téléphone ne reçoit rien).
 */
export const POST = withLogging("auth.mfa-resend", async (req: NextRequest) => {
  try {
    const { challengeId, channel } = await req.json();
    if (!challengeId) {
      return NextResponse.json(
        { message: "challengeId manquant" },
        { status: 400 }
      );
    }

    const utilisateurId = await getChallengeOwner(Number(challengeId));
    if (!utilisateurId) {
      return NextResponse.json(
        { message: "Code de vérification introuvable" },
        { status: 404 }
      );
    }

    const recentCount = await prisma.mfa_challenges.count({
      where: {
        utilisateur_id: utilisateurId,
        created_at: { gt: new Date(Date.now() - RESEND_WINDOW_MINUTES * 60_000) },
      },
    });
    if (recentCount >= MAX_RESENDS_IN_WINDOW) {
      logger.warning("Trop de renvois de code MFA demandés", {
        context: "auth.mfa",
        meta: { utilisateurId },
      });
      return NextResponse.json(
        { message: "Trop de renvois, réessayez dans quelques minutes." },
        { status: 429 }
      );
    }

    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: utilisateurId },
    });
    if (!utilisateur) {
      return NextResponse.json(
        { message: "Utilisateur introuvable" },
        { status: 404 }
      );
    }

    const useEmail = channel === "email";
    if (useEmail) {
      const masked = maskEmail(utilisateur.email);
      const { challengeId: newChallengeId, code } = await createMfaChallenge(
        utilisateur.id,
        "email",
        masked
      );
      await sendEmailOtp(utilisateur.email, code);
      logger.success(`Code MFA renvoyé par e-mail : ${utilisateur.username}`, {
        context: "auth.mfa",
        meta: { userId: utilisateur.id, challengeId: newChallengeId },
      });
      return NextResponse.json({
        challengeId: newChallengeId,
        maskedDestination: masked,
        channel: "email",
        smsDisponible: Boolean(utilisateur.telephone),
      });
    }

    if (!utilisateur.telephone) {
      return NextResponse.json(
        { message: "Aucun téléphone enregistré, utilisez le canal e-mail." },
        { status: 400 }
      );
    }

    const masked = maskPhone(utilisateur.telephone);
    const { challengeId: newChallengeId, code } = await createMfaChallenge(
      utilisateur.id,
      "sms",
      masked
    );
    await sendSmsOtp(utilisateur.telephone, code);
    logger.success(`Code MFA renvoyé par SMS : ${utilisateur.username}`, {
      context: "auth.mfa",
      meta: { userId: utilisateur.id, challengeId: newChallengeId },
    });
    return NextResponse.json({
      challengeId: newChallengeId,
      maskedDestination: masked,
      channel: "sms",
      smsDisponible: true,
    });
  } catch (error) {
    console.error("Erreur lors du renvoi du code MFA:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
});
