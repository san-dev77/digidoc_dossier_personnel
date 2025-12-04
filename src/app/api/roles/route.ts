import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions/permissionMiddleware";

/**
 * GET /api/roles
 * Liste tous les rôles
 */
export async function GET(req: NextRequest) {
  const authError = await requirePermission("utilisateurs.read")(req);
  if (authError) return authError;

  try {
    const roles = await prisma.roles.findMany({
      include: {
        _count: {
          select: {
            utilisateurs: true,
          },
        },
      },
      orderBy: {
        id: "asc",
      },
    });

    return NextResponse.json(roles);
  } catch (error) {
    console.error("Erreur récupération rôles:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

