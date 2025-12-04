import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requirePermission } from "@/lib/permissions/permissionMiddleware";

/**
 * PUT /api/roles/[id]
 * Modifier un rôle
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requirePermission("roles.update")(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const { nom, description, couleur } = body;
    const { id } = await params;
    const roleId = parseInt(id);

    // Vérifier si le rôle existe
    const role = await prisma.roles.findUnique({
      where: { id: roleId },
    });

    if (!role) {
      return NextResponse.json(
        { message: "Rôle non trouvé" },
        { status: 404 }
      );
    }

    // Empêcher la modification des rôles système (sauf nom et description)
    if (role.is_system && body.code) {
      return NextResponse.json(
        { message: "Impossible de modifier le code d'un rôle système" },
        { status: 400 }
      );
    }

    // Mettre à jour
    const updated = await prisma.roles.update({
      where: { id: roleId },
      data: {
        ...(nom && { nom }),
        ...(description !== undefined && { description }),
        ...(couleur && { couleur }),
        updated_at: new Date(),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("Erreur mise à jour rôle:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

