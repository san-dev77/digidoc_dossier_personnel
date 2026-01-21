import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { requirePermission } from "@/lib/permissions/permissionMiddleware";

/**
 * GET /api/utilisateurs/[id]
 * Récupère un utilisateur spécifique
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requirePermission("utilisateurs.read")(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: parseInt(id) },
      include: {
        roles: true,
        utilisateur_permissions: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!utilisateur) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Retirer le mot de passe
    const { password, ...utilisateurSafe } = utilisateur;

    return NextResponse.json(utilisateurSafe);
  } catch (error) {
    console.error("Erreur récupération utilisateur:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/utilisateurs/[id]
 * Modifier un utilisateur
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requirePermission("utilisateurs.update")(req);
  if (authError) return authError;

  try {
    const { id: paramId } = await params;
    const body = await req.json();
    const {
      username,
      email,
      password,
      nom_complet,
      role_id,
      telephone,
      departement,
      avatar,
      statut,
    } = body;

    const userId = parseInt(paramId);

    // Vérifier si l'utilisateur existe
    const existing = await prisma.utilisateurs.findUnique({
      where: { id: userId },
    });

    if (!existing) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si username/email est déjà utilisé par un autre utilisateur
    if (username || email) {
      const conflict = await prisma.utilisateurs.findFirst({
        where: {
          OR: [
            username ? { username } : {},
            email ? { email } : {},
          ].filter((obj) => Object.keys(obj).length > 0),
          NOT: {
            id: userId,
          },
        },
      });

      if (conflict) {
        return NextResponse.json(
          {
            message:
              conflict.username === username
                ? "Nom d'utilisateur déjà utilisé"
                : "Email déjà utilisé",
          },
          { status: 409 }
        );
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      ...(username && { username }),
      ...(email && { email }),
      ...(nom_complet && { nom_complet }),
      ...(role_id && { role_id: parseInt(role_id) }),
      ...(telephone !== undefined && { telephone }),
      ...(departement !== undefined && { departement }),
      ...(avatar !== undefined && { avatar }),
      ...(statut && { statut }),
      updated_at: new Date(),
    };

    // Si un nouveau mot de passe est fourni, le hasher
    if (password) {
      updateData.password = await hashPassword(password);
    }

    // Mettre à jour l'utilisateur
    const utilisateur = await prisma.utilisateurs.update({
      where: { id: userId },
      data: updateData,
      include: {
        roles: true,
      },
    });

    // Retirer le mot de passe
    const { password: _, ...utilisateurSafe } = utilisateur;

    return NextResponse.json(utilisateurSafe);
  } catch (error) {
    console.error("Erreur mise à jour utilisateur:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/utilisateurs/[id]
 * Supprimer un utilisateur
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requirePermission("utilisateurs.delete")(req);
  if (authError) return authError;

  try {
    const { id } = await params;
    const userId = parseInt(id);

    // Vérifier si l'utilisateur existe
    const utilisateur = await prisma.utilisateurs.findUnique({
      where: { id: userId },
      include: { roles: true },
    });

    if (!utilisateur) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Empêcher la suppression du dernier super admin
    if (utilisateur.roles.is_system) {
      const superAdminCount = await prisma.utilisateurs.count({
        where: {
          roles: {
            is_system: true,
          },
          statut: "actif",
        },
      });

      if (superAdminCount <= 1) {
        return NextResponse.json(
          {
            message:
              "Impossible de supprimer le dernier Super Administrateur",
          },
          { status: 400 }
        );
      }
    }

    // Supprimer l'utilisateur
    await prisma.utilisateurs.delete({
      where: { id: userId },
    });

    return NextResponse.json({ message: "Utilisateur supprimé" });
  } catch (error) {
    console.error("Erreur suppression utilisateur:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

