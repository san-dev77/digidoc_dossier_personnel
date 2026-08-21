import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { generateToken } from "@/lib/auth/jwt";
import { createErrorResponse } from "@/lib/errors/safeError";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

export async function POST(req: NextRequest) {
  // Vérifier le rate limiting AVANT de traiter la requête
  const rateLimitResult = checkRateLimit(req, rateLimitConfigs.register);
  if (!rateLimitResult.allowed) {
    return rateLimitResult.response!;
  }

  try {
    const body = await req.json();
    // Log des données reçues
    console.log("[REGISTER] payload:", body);

    const { matricule, password } = body || {};

    if (!matricule || !password) {
      return NextResponse.json(
        { message: "Champs manquants" },
        { status: 400 }
      );
    }

    // Vérifier existence
    const existing = await prisma.agents.findUnique({
      where: { matricule },
      select: { id: true },
    });
    console.log("[REGISTER] existing:", existing ? 1 : 0);
    if (existing) {
      return NextResponse.json(
        { message: "Matricule déjà utilisé" },
        { status: 409 }
      );
    }

    try {
      // Hasher le mot de passe avant de l'enregistrer
      const hashedPassword = await hashPassword(password);

      // `nom_complet` est obligatoire en base : on retombe sur le matricule
      // quand le formulaire ne le fournit pas.
      const createdAgent = await prisma.agents.create({
        data: {
          matricule,
          password: hashedPassword, // Mot de passe hashé
          email: body.email ?? null,
          nom_complet: body.nom_complet ?? matricule,
          fonction: body.fonction ?? null,
          date_naissance: body.date_naissance
            ? new Date(body.date_naissance)
            : null,
          lieu_naissance: body.lieu_naissance ?? null,
          sexe: body.sexe ?? null,
          situation_matrimoniale: body.situation_matrimoniale ?? null,
          adresse: body.adresse ?? null,
          telephone: body.telephone ?? null,
        },
      });
      console.log("[REGISTER] created agent id:", createdAgent.id);

      // Générer un token JWT
      const token = generateToken({
        agentId: createdAgent.id,
        matricule: createdAgent.matricule,
        email: createdAgent.email ?? undefined, // Convertir null en undefined
        role: (createdAgent.role ?? "user") as string, // Convertir null en "user" par défaut
      });

      // Retourner l'agent avec le token (sans le mot de passe)
      const { password: _, ...agentWithoutPassword } = createdAgent;
      
      const response = NextResponse.json(
        {
          ...agentWithoutPassword,
          token,
        },
        { status: 201 }
      );

      // Ajouter les headers de rate limit
      response.headers.set(
        "X-RateLimit-Limit",
        rateLimitConfigs.register.maxRequests.toString()
      );
      response.headers.set(
        "X-RateLimit-Remaining",
        rateLimitResult.remaining.toString()
      );
      response.headers.set(
        "X-RateLimit-Reset",
        new Date(rateLimitResult.resetTime).toISOString()
      );

      return response;
    } catch (sqlErr) {
      console.error("[REGISTER] SQL error:", sqlErr);
      return createErrorResponse(
        sqlErr,
        "Erreur lors de l'inscription",
        500
      );
    }
  } catch (e) {
    console.error("[REGISTER] error:", e);
    return createErrorResponse(e, "Erreur lors de l'inscription", 500);
  }
}
