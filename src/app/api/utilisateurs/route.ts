import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import {
  validatePasswordPolicy,
  recordPasswordHistory,
} from "@/lib/auth/passwordPolicy";
import {
  requirePermission,
  getUserIdFromRequest,
} from "@/lib/permissions/permissionMiddleware";
import { withLogging } from "@/lib/apiLogger";
import { logger } from "@/lib/logger";

/**
 * GET /api/utilisateurs
 * Liste tous les utilisateurs
 */
export const GET = withLogging("utilisateurs.list", async (req: NextRequest) => {
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
});

/**
 * POST /api/utilisateurs
 * Créer un nouvel utilisateur
 */
export const POST = withLogging("utilisateurs.create", async (req: NextRequest) => {
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
      auth_source,
      mfa_exempt,
    } = body;

    const isLdapAccount = auth_source === "ldap";

    // Validation — le mot de passe n'est requis que pour un compte local
    // (un compte LDAP est authentifié par l'annuaire, pas par ce champ).
    if (
      !username ||
      !email ||
      !nom_complet ||
      !role_id ||
      (!isLdapAccount && !password)
    ) {
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

    let hashedPassword: string;
    if (isLdapAccount) {
      // Aucun mot de passe local exploitable : valeur aléatoire inutilisable,
      // uniquement pour satisfaire la colonne (non nulle) — jamais comparée,
      // le flux de connexion ignore le mot de passe local pour ces comptes.
      hashedPassword = await hashPassword(crypto.randomBytes(32).toString("hex"));
    } else {
      const policy = await validatePasswordPolicy(password);
      if (!policy.valid) {
        return NextResponse.json(
          { message: "Mot de passe invalide", errors: policy.errors },
          { status: 400 }
        );
      }
      hashedPassword = await hashPassword(password);
    }

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
        password_updated_at: new Date(),
        auth_source: isLdapAccount ? "ldap" : "local",
        mfa_exempt: !!mfa_exempt,
      },
      include: {
        roles: true,
      },
    });

    if (!isLdapAccount) {
      await recordPasswordHistory(utilisateur.id, hashedPassword);
    }

    // Retirer le mot de passe de la réponse
    const { password: _, ...utilisateurSafe } = utilisateur;

    logger.success(`Utilisateur créé : ${utilisateur.username}`, {
      context: "utilisateurs.create",
      meta: { userId: utilisateur.id, createdBy: creatorId },
    });

    return NextResponse.json(utilisateurSafe, { status: 201 });
  } catch (error) {
    console.error("Erreur création utilisateur:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
});

