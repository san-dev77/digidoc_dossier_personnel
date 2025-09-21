import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { matricule, password } = await req.json();
    if (!matricule || !password) {
      return NextResponse.json(
        { message: "Champs manquants" },
        { status: 400 }
      );
    }

    const { rows } = await query(
      `SELECT * FROM agents WHERE matricule = $1 AND password = $2 LIMIT 1`,
      [matricule, password]
    );

    if (!rows.length) {
      return NextResponse.json(
        { message: "Agent introuvable" },
        { status: 404 }
      );
    }

    const agent = rows[0];
    return NextResponse.json(agent, { status: 200 });
  } catch (e) {
    console.log(e);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
