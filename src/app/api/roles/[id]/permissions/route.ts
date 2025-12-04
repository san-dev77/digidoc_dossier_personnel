import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions/permissionMiddleware";

/**
 * GET /api/roles/[id]/permissions
 * Récupère les permissions d'un rôle
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requirePermission("roles.read")(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const roleId = parseInt(id);

    const permissions = await (prisma as any).role_permissions.findMany({
      where: { role_id: roleId },
      include: {
        permissions: true,
      },
    });

    return NextResponse.json(permissions.map((rp: any) => rp.permissions));
  } catch (error) {
    console.error("Erreur récupération permissions:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/roles/[id]/permissions
 * Mettre à jour les permissions d'un rôle
 * Body: { permissionIds: number[] }
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requirePermission("roles.update")(req);
  if (authError) return authError;

  try {
    const { permissionIds } = await req.json();
    const { id } = await params;
    const roleId = parseInt(id);

    // Vérifier que le rôle existe
    const role = await prisma.roles.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        { message: "Rôle non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer toutes les anciennes permissions
    await (prisma as any).role_permissions.deleteMany({
      where: { role_id: roleId },
    });

    // Ajouter les nouvelles permissions
    if (permissionIds && permissionIds.length > 0) {
      await (prisma as any).role_permissions.createMany({
        data: permissionIds.map((permId: number) => ({
          role_id: roleId,
          permission_id: permId,
        })),
      });
    }

    return NextResponse.json({ message: "Permissions mises à jour" });
  } catch (error) {
    console.error("Erreur mise à jour permissions:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

