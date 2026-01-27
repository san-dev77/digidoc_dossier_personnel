import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { comparePassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/jwt";

export async function POST(req: NextRequest) {
  console.log("[LOGIN] 📥 Requête de connexion reçue");

  try {
    const { matricule, password } = await req.json();
    console.log("[LOGIN] 🔍 Recherche de l'agent avec matricule:", matricule);
    if (!matricule || !password) {
      return NextResponse.json(
        { message: "Champs manquants" },
        { status: 400 }
      );
    }

    // Récupérer l'agent par matricule
    const { rows } = await query(
      `SELECT * FROM agents WHERE matricule = ? LIMIT 1`,
      [matricule]
    );

    if (!rows.length) {
      console.log("[LOGIN] ❌ Agent non trouvé pour matricule:", matricule);
      return NextResponse.json(
        { message: "Matricule ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    console.log("[LOGIN] ✅ Agent trouvé:", rows[0].matricule);

    const agent = rows[0] as {
      id: number;
      matricule: string;
      password: string | null;
      email?: string | null;
      role?: string | null;
      [key: string]: unknown;
    };

    // Vérifier le mot de passe (support ancien format en clair + nouveau format hashé)
    let passwordValid = false;
    
    // Si le mot de passe est hashé (commence par $2a$ ou $2b$), utiliser bcrypt
    if (agent.password && typeof agent.password === "string" && agent.password.startsWith("$2")) {
      passwordValid = await comparePassword(password, agent.password);
    } else if (agent.password && typeof agent.password === "string") {
      // Ancien format : comparaison en clair (pour migration progressive)
      passwordValid = agent.password === password;
    }

    if (!passwordValid) {
      console.log("[LOGIN] ❌ Mot de passe invalide pour matricule:", matricule);
      return NextResponse.json(
        { message: "Matricule ou mot de passe incorrect" },
        { status: 401 }
      );
    }

    console.log("[LOGIN] ✅ Mot de passe valide pour matricule:", matricule);

    // Générer un token JWT
    console.log("[LOGIN] 🔑 Génération du token JWT pour agent ID:", agent.id);
    const token = generateToken({
      agentId: agent.id,
      matricule: agent.matricule,
      email: agent.email ?? undefined, // Convertir null en undefined
      role: (agent.role ?? "user") as string, // Convertir null en "user" par défaut
    });
    console.log("[LOGIN] ✅ Token généré avec succès");

    // Retourner l'agent avec le token (sans le mot de passe)
    const { password: _, ...agentWithoutPassword } = agent;
    
    console.log("[LOGIN] ✅ Connexion réussie, réponse envoyée");
    return NextResponse.json(
      {
        ...agentWithoutPassword,
        token,
      },
      { status: 200 }
    );
  } catch (e) {
    console.error("[LOGIN] ❌ Erreur lors de la connexion:", e);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
