import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const agents = await prisma.agents.findMany({
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(agents);
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log("[CREATE AGENT] Body received:", body);

    if (!body.matricule || !body.password) {
      console.error("[CREATE AGENT] Missing required fields");
      return NextResponse.json(
        { message: "Matricule et mot de passe requis" },
        { status: 400 }
      );
    }

    // Préparer les données
    const dataToCreate: any = {
      matricule: body.matricule,
      nom_complet: body.nom_complet,
      email: body.email ?? null,
      fonction: body.fonction ?? null,
      lieu_naissance: body.lieu_naissance ?? null,
      sexe: body.sexe ?? null,
      situation_matrimoniale: body.situation_matrimoniale ?? null,
      adresse: body.adresse ?? null,
      telephone: body.telephone ?? null,
      password: body.password,
    };

    // Convertir la date de naissance si elle existe
    if (body.date_naissance) {
      dataToCreate.date_naissance = new Date(body.date_naissance);
    }

    console.log("[CREATE AGENT] Data to create:", dataToCreate);

    const created = await prisma.agents.create({
      data: dataToCreate,
    });

    console.log("[CREATE AGENT] Success:", created.id);
    return NextResponse.json(created, { status: 201 });
  } catch (error: any) {
    console.error("[CREATE AGENT] Erreur:", error);
    console.error("[CREATE AGENT] Stack:", error.stack);
    return NextResponse.json(
      { message: "Erreur serveur", detail: error.message },
      { status: 500 }
    );
  }
}
