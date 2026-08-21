import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/permissions/permissionMiddleware";
import { withLogging } from "@/lib/apiLogger";

/**
 * GET /api/sessions
 * Liste les sessions actives (non révoquées, non expirées) de tous les
 * comptes — réservé aux super-administrateurs.
 */
export const GET = withLogging("sessions.list", async (req: NextRequest) => {
  const authError = await requireSuperAdmin()(req);
  if (authError) return authError;

  try {
    const sessions = await prisma.auth_sessions.findMany({
      where: { revoked_at: null, expires_at: { gt: new Date() } },
      include: {
        utilisateurs: {
          select: { id: true, username: true, nom_complet: true },
        },
      },
      orderBy: { last_activity_at: "desc" },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("Erreur lecture des sessions actives:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
});
