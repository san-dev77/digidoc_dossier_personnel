import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import {
  requirePermission,
  getUserIdFromRequest,
} from "@/lib/permissions/permissionMiddleware";

/**
 * GET /api/utilisateurs
 * Liste tous les utilisateurs
 */
export async function GET(req: NextRequest) {
  const authError = await requirePermission("utilisateurs.read")(req);
  if (authError) return authError;

  try {
    const utilisateurs = await prisma.utilisateurs.findMany({
      include: {
        roles: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    // Retirer les mots de passe
    const utilisateursSafe = utilisateurs.map(({ password, ...user }) => user);

    return NextResponse.json(utilisateursSafe);
  } catch (error) {
    console.error("Erreur récupération utilisateurs:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/utilisateurs
 * Créer un nouvel utilisateur
 */
export async function POST(req: NextRequest) {
  const authError = await requirePermission("utilisateurs.create")(req);
  if (authError) return authError;

  try {
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
    } = body;

    // Validation
    if (!username || !email || !password || !nom_complet || !role_id) {
      return NextResponse.json(
        { message: "Champs requis manquants" },
        { status: 400 }
      );
    }

    // Vérifier si username ou email existe déjà
    const existing = await prisma.utilisateurs.findFirst({
      where: {
        OR: [{ username }, { email }],
      },
    });

    if (existing) {
      return NextResponse.json(
        {
          message:
            existing.username === username
              ? "Nom d'utilisateur déjà utilisé"
              : "Email déjà utilisé",
        },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const hashedPassword = await hashPassword(password);

    // Identifier l'auteur de la création (pour l'audit)
    const creatorId = await getUserIdFromRequest(req);

    // Créer l'utilisateur
    const utilisateur = await prisma.utilisateurs.create({
      data: {
        username,
        email,
        password: hashedPassword,
        nom_complet,
        role_id: parseInt(role_id),
        telephone: telephone || null,
        departement: departement || null,
        avatar: avatar || null,
        statut: "actif",
        created_by: creatorId,
      },
      include: {
        roles: true,
      },
    });

    // Retirer le mot de passe de la réponse
    const { password: _, ...utilisateurSafe } = utilisateur;

    return NextResponse.json(utilisateurSafe, { status: 201 });
  } catch (error) {
    console.error("Erreur création utilisateur:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

