import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/jwt";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

/**
 * POST /api/auth/login-user
 * Connexion pour les UTILISATEURS (pas les agents)
 */
export async function POST(req: NextRequest) {
  console.log("[LOGIN-USER] 📥 Requête de connexion utilisateur reçue");

  // Vérifier le rate limiting
  const rateLimitResult = checkRateLimit(req, rateLimitConfigs.login);
  if (!rateLimitResult.allowed) {
    console.log("[LOGIN-USER] ⚠️ Rate limit atteint");
    return rateLimitResult.response!;
  }

  try {
    const { username, password } = await req.json();
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
        OR: [{ username }, { email: username }],
      },
      include: {
        roles: true,
      },
    });

    if (!utilisateur) {
      console.log("[LOGIN-USER] ❌ Utilisateur non trouvé:", username);
      return NextResponse.json(
        { message: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    // Vérifier le statut
    if (utilisateur.statut !== "actif") {
      console.log("[LOGIN-USER] ❌ Utilisateur inactif:", username);
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
      return NextResponse.json(
        { message: "Identifiants incorrects" },
        { status: 401 }
      );
    }

    console.log("[LOGIN-USER] ✅ Mot de passe valide");

    // Mettre à jour la dernière connexion
    await prisma.utilisateurs.update({
      where: { id: utilisateur.id },
      data: { derniere_connexion: new Date() },
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

    const response = NextResponse.json(
      {
        ...utilisateurSafe,
        token,
      },
      { status: 200 }
    );

    // Headers de rate limit
    response.headers.set(
      "X-RateLimit-Limit",
      rateLimitConfigs.login.maxRequests.toString()
    );
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResult.remaining.toString()
    );
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(rateLimitResult.resetTime).toISOString()
    );

    console.log("[LOGIN-USER] ✅ Connexion réussie");
    return response;
  } catch (e) {
    console.error("[LOGIN-USER] ❌ Erreur:", e);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

