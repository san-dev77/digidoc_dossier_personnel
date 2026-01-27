import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { comparePassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/jwt";

/**
 * POST /api/auth/login-unified
 * Connexion unifiée : détecte automatiquement si c'est un utilisateur ou un agent
 */
export async function POST(req: NextRequest) {
  console.log("[LOGIN-UNIFIED] 📥 Requête de connexion reçue");

  try {
    console.log("[LOGIN-UNIFIED] 📥 Lecture du corps de la requête...");
    const body = await req.json();
    const { identifier, password } = body;
    console.log("[LOGIN-UNIFIED] 🔍 Identifiant reçu:", identifier);
    console.log("[LOGIN-UNIFIED] 🔍 Password reçu (longueur):", password?.length || 0);

    if (!identifier || !password) {
      return NextResponse.json(
        { message: "Champs manquants" },
        { status: 400 }
      );
    }

    // ============================================
    // TENTATIVE 1 : Chercher dans UTILISATEURS
    // ============================================
    console.log("[LOGIN-UNIFIED] 🔎 Recherche utilisateur dans la DB...");
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
    console.log("[LOGIN-UNIFIED] 🔎 Recherche utilisateur terminée. Trouvé:", !!utilisateur);

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
      console.log("[LOGIN-UNIFIED] 🔐 Vérification du mot de passe...");
      const passwordValid = await comparePassword(password, utilisateur.password);
      console.log("[LOGIN-UNIFIED] 🔐 Résultat vérification password:", passwordValid);

      if (!passwordValid) {
        return NextResponse.json(
          { message: "Identifiants incorrects" },
          { status: 401 }
        );
      }

      // Mettre à jour la dernière connexion
      console.log("[LOGIN-UNIFIED] 🕒 Mise à jour de la dernière connexion...");
      await prisma.utilisateurs.update({
        where: { id: utilisateur.id },
        data: { derniere_connexion: new Date() },
      });
      console.log("[LOGIN-UNIFIED] ✅ Mise à jour terminée");

      // Générer le token
      console.log("[LOGIN-UNIFIED] 🎫 Génération du token JWT...");
      const token = generateToken({
        userId: utilisateur.id,
        agentId: utilisateur.agent_id || undefined,
        matricule: utilisateur.agents?.matricule || utilisateur.username,
        email: utilisateur.email,
        role: utilisateur.roles.code, // ✅ Utiliser le code, pas le nom
      });
      console.log("[LOGIN-UNIFIED] 🎫 Token généré avec succès");

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
    console.log("[LOGIN-UNIFIED] 🔎 Recherche AGENT (legacy) dans la DB...");
    const agent = await prisma.agents.findFirst({
      where: { matricule: identifier },
    });
    console.log("[LOGIN-UNIFIED] 🔎 Recherche AGENT terminée. Trouvé:", !!agent);

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

  } catch (e: any) {
    console.error("[LOGIN-UNIFIED] ❌ Erreur fatale:", e);
    return NextResponse.json(
      { 
        message: "Erreur serveur interne", 
        error: e?.message || "Erreur inconnue",
        stack: process.env.NODE_ENV === "development" ? e?.stack : undefined
      }, 
      { status: 500 }
    );
  }
}

