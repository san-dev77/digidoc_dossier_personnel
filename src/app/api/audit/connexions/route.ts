import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions/permissionMiddleware";

/**
 * GET /api/audit/connexions
 * Historique des connexions (les plus récentes en premier)
 */
export async function GET(req: NextRequest) {
  const authError = await requirePermission("utilisateurs.read")(req);
  if (authError) return authError;

  try {
    const logs = await prisma.connexion_logs.findMany({
      include: {
        utilisateurs: {
          select: { id: true, nom_complet: true, username: true },
        },
      },
      orderBy: { connected_at: "desc" },
      take: 1000,
    });

    return NextResponse.json(
      logs.map((log) => ({
        id: log.id,
        connected_at: log.connected_at,
        utilisateur: log.utilisateurs,
      }))
    );
  } catch (error) {
    console.error("Erreur récupération historique des connexions:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
