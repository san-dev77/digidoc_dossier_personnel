import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/jwt";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

/**
 * POST /api/auth/login-unified
 * Connexion unifiée : détecte automatiquement si c'est un utilisateur ou un agent
 */
export async function POST(req: NextRequest) {
  console.log("[LOGIN-UNIFIED] 📥 Requête de connexion reçue");

  const rateLimitResult = checkRateLimit(req, rateLimitConfigs.login);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    const { identifier, password } = await req.json();
    console.log("[LOGIN-UNIFIED] 🔍 Identifiant:", identifier);

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Champs manquants" },
        { status: 400 }
      );
    }

    // ============================================
    // TENTATIVE 1 : Chercher dans UTILISATEURS
    // ============================================
    const utilisateur = await prisma.utilisateurs.findFirst({
      where: {
        OR: [
          { username: identifier },
          { email: identifier },
        ],
      },
      include: {
        roles: true,
        agents: true, // Inclure l'agent lié si existe
      },
    });

    if (utilisateur) {
      console.log("[LOGIN-UNIFIED] ✅ Trouvé en tant qu'UTILISATEUR");

      // Vérifier le statut
      if (utilisateur.statut !== "actif") {
        return NextResponse.json(
          { message: "Compte inactif ou suspendu" },
          { status: 403 }
        );
      }

      // Vérifier le mot de passe
      const passwordValid = await comparePassword(password, utilisateur.password);

      if (!passwordValid) {
        return NextResponse.json(
          { message: "Identifiants incorrects" },
          { status: 401 }
        );
      }

      // Mettre à jour la dernière connexion
      await prisma.utilisateurs.update({
        where: { id: utilisateur.id },
        data: { derniere_connexion: new Date() },
      });

      // Générer le token
      const token = generateToken({
        userId: utilisateur.id,
        agentId: utilisateur.agent_id || undefined,
        matricule: utilisateur.agents?.matricule || utilisateur.username,
        email: utilisateur.email,
        role: utilisateur.roles.code, // ✅ Utiliser le code, pas le nom
      });

      const { password: _, ...utilisateurSafe } = utilisateur;

      return NextResponse.json({
        ...utilisateurSafe,
        token,
        accountType: "utilisateur",
      });
    }

    // ============================================
    // TENTATIVE 2 : Chercher dans AGENTS (Legacy)
    // ============================================
    const agent = await prisma.agents.findFirst({
      where: { matricule: identifier },
    });

    if (agent) {
      console.log("[LOGIN-UNIFIED] ⚠️  Trouvé en tant qu'AGENT (legacy)");
      
      // Les agents n'ont plus de password dans le nouveau système
      return NextResponse.json(
        { 
          message: "Ce compte agent n'a pas accès à l'application. Contactez un administrateur pour créer un compte utilisateur.",
          hint: "Les agents doivent avoir un compte utilisateur pour se connecter"
        },
        { status: 403 }
      );
    }

    // ============================================
    // AUCUN COMPTE TROUVÉ
    // ============================================
    console.log("[LOGIN-UNIFIED] ❌ Aucun compte trouvé");
    return NextResponse.json(
      { message: "Identifiants incorrects" },
      { status: 401 }
    );

  } catch (e) {
    console.error("[LOGIN-UNIFIED] ❌ Erreur:", e);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

