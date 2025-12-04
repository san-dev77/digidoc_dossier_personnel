import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
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
    const existing = await query(
      `SELECT id FROM agents WHERE matricule = ? LIMIT 1`,
      [matricule]
    );
    console.log("[REGISTER] existing count:", existing.rows.length);
    if (existing.rows.length) {
      return NextResponse.json(
        { message: "Matricule déjà utilisé" },
        { status: 409 }
      );
    }

    try {
      const fields: string[] = [
        "matricule",
        "password",
        "email",
        "nom_complet",
        "fonction",
        "date_naissance",
        "lieu_naissance",
        "sexe",
        "situation_matrimoniale",
        "adresse",
        "telephone",
      ];

      // Hasher le mot de passe avant de l'enregistrer
      const hashedPassword = await hashPassword(password);

      const values = [
        matricule,
        hashedPassword, // Mot de passe hashé
        body.email ?? null,
        body.nom_complet ?? null,
        body.fonction ?? null,
        body.date_naissance
          ? new Date(body.date_naissance).toISOString()
          : null,
        body.lieu_naissance ?? null,
        body.sexe ?? null,
        body.situation_matrimoniale ?? null,
        body.adresse ?? null,
        body.telephone ?? null,
      ];

      const placeholders = values.map(() => `?`).join(",");
      console.log("[REGISTER] insert fields:", fields);
      console.log("[REGISTER] insert values:", values);

      const { rows } = await query(
        `INSERT INTO agents (${fields.join(
          ","
        )}) VALUES (${placeholders})`,
        values
      );
      
      // MySQL ne supporte pas RETURNING, récupérer le dernier ID inséré
      const { rows: insertedRows } = await query(
        `SELECT * FROM agents WHERE id = LAST_INSERT_ID()`
      );

      const createdAgent = insertedRows[0] as {
        id: number;
        matricule: string;
        password: string | null;
        email?: string | null;
        role?: string | null;
        [key: string]: unknown;
      };
      console.log("[REGISTER] created agent id:", createdAgent?.id);

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
