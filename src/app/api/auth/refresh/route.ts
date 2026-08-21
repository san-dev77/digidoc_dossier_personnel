import { NextRequest, NextResponse } from "next/server";
import { verifyTokenIgnoringExpiration, generateToken } from "@/lib/auth/jwt";
import { touchSession } from "@/lib/auth/sessions";
import { getNumberSetting } from "@/lib/settings";
import { withLogging } from "@/lib/apiLogger";
import { logger } from "@/lib/logger";

const REFUSAL_MESSAGES: Record<string, string> = {
  not_found: "Session introuvable",
  revoked: "Session révoquée",
  max_duration: "Session expirée (durée maximale atteinte)",
  idle_timeout: "Session expirée pour inactivité",
};

/**
 * POST /api/auth/refresh
 * Rafraîchissement silencieux de l'access token. Reçoit volontairement un
 * token déjà expiré (c'est son rôle) — la validité réelle vient de
 * `auth_sessions`, pas du champ `exp` du JWT. Route publique côté
 * middleware (voir src/lib/auth/middleware.ts), auth vérifiée ici.
 */
export const POST = withLogging("auth.refresh", async (req: NextRequest) => {
  try {
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.startsWith("Bearer ")
      ? authHeader.slice(7)
      : null;

    if (!token) {
      return NextResponse.json({ message: "Token manquant" }, { status: 401 });
    }

    const payload = verifyTokenIgnoringExpiration(token);
    if (!payload || !payload.jti || !payload.userId) {
      return NextResponse.json({ message: "Token invalide" }, { status: 401 });
    }

    const result = await touchSession(payload.jti);
    if (!result.ok) {
      logger.warning(
        `Rafraîchissement refusé : ${REFUSAL_MESSAGES[result.reason]}`,
        {
          context: "auth.refresh",
          meta: { userId: payload.userId, reason: result.reason },
        }
      );
      return NextResponse.json(
        { message: REFUSAL_MESSAGES[result.reason] },
        { status: 401 }
      );
    }

    const idleTimeoutMinutes = await getNumberSetting(
      "security.idleTimeoutMinutes"
    );
    const newToken = generateToken(
      {
        userId: payload.userId,
        agentId: payload.agentId,
        matricule: payload.matricule,
        email: payload.email,
        role: payload.role,
        jti: payload.jti,
      },
      `${idleTimeoutMinutes}m`
    );

    return NextResponse.json({ token: newToken });
  } catch (error) {
    console.error("Erreur lors du rafraîchissement de session:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
});
