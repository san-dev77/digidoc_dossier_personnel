import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions/permissionMiddleware";

/**
 * GET /api/permissions
 * Liste toutes les permissions disponibles
 */
export async function GET(req: NextRequest) {
  const authError = await requirePermission("roles.read")(req);
  if (authError) return authError;

  try {
    const permissions = await (prisma as any).permissions.findMany({
      orderBy: [
        { categorie: "asc" },
        { code: "asc" },
      ],
    });

    return NextResponse.json(permissions);
  } catch (error) {
    console.error("Erreur récupération permissions:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

