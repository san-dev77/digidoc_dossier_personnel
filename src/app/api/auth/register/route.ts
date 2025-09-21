import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
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
      `SELECT id FROM agents WHERE matricule = $1 LIMIT 1`,
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

      const values = [
        matricule,
        password,
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

      const placeholders = values.map((_, i) => `$${i + 1}`).join(",");
      console.log("[REGISTER] insert fields:", fields);
      console.log("[REGISTER] insert values:", values);

      const { rows } = await query(
        `INSERT INTO agents (${fields.join(
          ","
        )}) VALUES (${placeholders}) RETURNING *`,
        values
      );

      console.log("[REGISTER] created agent id:", rows[0]?.id);
      return NextResponse.json(rows[0], { status: 201 });
    } catch (sqlErr: any) {
      console.error("[REGISTER] SQL error:", sqlErr?.message || sqlErr);
      return NextResponse.json(
        { message: "Erreur serveur", detail: sqlErr?.message || "SQL error" },
        { status: 500 }
      );
    }
  } catch (e: any) {
    console.error("[REGISTER] error:", e?.message || e);
    return NextResponse.json(
      { message: "Erreur serveur", detail: e?.message || "Unknown" },
      { status: 500 }
    );
  }
}
