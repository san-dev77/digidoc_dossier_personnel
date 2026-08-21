import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/permissions/permissionMiddleware";
import { withLogging } from "@/lib/apiLogger";
import { logger } from "@/lib/logger";

/**
 * DELETE /api/sessions/[id]
 * Révoque une session (déconnexion forcée) — réservé aux
 * super-administrateurs. La prochaine tentative de rafraîchissement de
 * cette session (/api/auth/refresh) échouera, forçant une reconnexion.
 */
export const DELETE = withLogging(
  "sessions.revoke",
  async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
    const authError = await requireSuperAdmin()(req);
    if (authError) return authError;

    try {
      const { id } = await params;
      const session = await prisma.auth_sessions.update({
        where: { id: parseInt(id) },
        data: { revoked_at: new Date() },
        include: { utilisateurs: { select: { username: true } } },
      });

      logger.success(
        `Session révoquée manuellement (${session.utilisateurs.username})`,
        { context: "sessions.revoke", meta: { sessionId: id } }
      );

      return NextResponse.json({ message: "Session révoquée" });
    } catch (error) {
      console.error("Erreur lors de la révocation de la session:", error);
      return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
    }
  }
);
