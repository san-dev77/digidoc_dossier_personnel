import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/jwt";
import { withLogging } from "@/lib/apiLogger";
import { logger } from "@/lib/logger";

/**
 * POST /api/auth/login-user
 * Connexion pour les UTILISATEURS (pas les agents)
 */
export const POST = withLogging("auth.login-user", async (req: NextRequest) => {
  console.log("[LOGIN-USER] 📥 Requête de connexion utilisateur reçue");

  try {
    const { username: usernameBrut, password } = await req.json();
    // Meme normalisation que /api/auth/login-unified : PostgreSQL ne tolere pas
    // les espaces de fin la ou MySQL les ignorait.
    const username =
      typeof usernameBrut === "string" ? usernameBrut.trim() : usernameBrut;
    console.log("[LOGIN-USER] 🔍 Recherche de l'utilisateur:", username);

    if (!username || !password) {
      return NextResponse.json(
        { message: "Champs manquants" },
        { status: 400 }
      );
    }

    // Récupérer l'utilisateur (par username ou email)
    const utilisateur = await prisma.utilisateurs.findFirst({
      where: {
        OR: [
          { username: { equals: username, mode: "insensitive" } },
          { email: { equals: username, mode: "insensitive" } },
        ],
      },
      include: {
        roles: true,
      },
    });

    if (!utilisateur) {
      console.log("[LOGIN-USER] ❌ Utilisateur non trouvé:", username);
      logger.warning(`Tentative de connexion — utilisateur inconnu`, {
        context: "auth.login-user",
        meta: { username },
      });
      return NextResponse.json(
        { message: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    // Vérifier le statut
    if (utilisateur.statut !== "actif") {
      console.log("[LOGIN-USER] ❌ Utilisateur inactif:", username);
      logger.warning(`Tentative de connexion sur un compte ${utilisateur.statut}`, {
        context: "auth.login-user",
        meta: { username, statut: utilisateur.statut },
      });
      return NextResponse.json(
        { message: "Compte inactif ou suspendu" },
        { status: 403 }
      );
    }

    console.log("[LOGIN-USER] ✅ Utilisateur trouvé:", utilisateur.username);

    // Vérifier le mot de passe
    const passwordValid = await comparePassword(password, utilisateur.password);

    if (!passwordValid) {
      console.log("[LOGIN-USER] ❌ Mot de passe invalide");
      logger.warning("Mot de passe invalide", {
        context: "auth.login-user",
        meta: { username },
      });
      return NextResponse.json(
        { message: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    console.log("[LOGIN-USER] ✅ Mot de passe valide");

    // Mettre à jour la dernière connexion et le compteur de connexions
    await prisma.utilisateurs.update({
      where: { id: utilisateur.id },
      data: {
        derniere_connexion: new Date(),
        nombre_connexions: { increment: 1 },
      },
    });
    await prisma.connexion_logs.create({
      data: { utilisateur_id: utilisateur.id },
    });

    // Générer un token JWT
    const token = generateToken({
      agentId: utilisateur.id, // Compatibilité avec le système existant
      userId: utilisateur.id,
      matricule: utilisateur.username,
      email: utilisateur.email,
      role: utilisateur.roles.nom,
    });

    console.log("[LOGIN-USER] ✅ Token généré");

    // Retourner l'utilisateur avec le token (sans le mot de passe)
    const { password: _, ...utilisateurSafe } = utilisateur;

    console.log("[LOGIN-USER] ✅ Connexion réussie");
    logger.success(`Connexion réussie : ${utilisateur.username}`, {
      context: "auth.login-user",
      meta: { userId: utilisateur.id, username: utilisateur.username },
    });
    return NextResponse.json(
      {
        ...utilisateurSafe,
        token,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("[LOGIN-USER] ❌ Erreur:", e);
    logger.error(e instanceof Error ? e.message : "Erreur de connexion", {
      context: "auth.login-user",
      meta: { stack: e instanceof Error ? e.stack : undefined },
    });
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
});

