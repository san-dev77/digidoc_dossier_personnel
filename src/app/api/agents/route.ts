import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const agents = await prisma.agents.findMany({
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(agents);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const created = await prisma.agents.create({
    data: {
      matricule: body.matricule,
      nom_complet: body.nom_complet,
      email: body.email ?? null,
      fonction: body.fonction ?? null,
      date_naissance: body.date_naissance ?? null,
      lieu_naissance: body.lieu_naissance ?? null,
      sexe: body.sexe ?? null,
      situation_matrimoniale: body.situation_matrimoniale ?? null,
      adresse: body.adresse ?? null,
      telephone: body.telephone ?? null,
      password: body.password,
    },
  });
  return NextResponse.json(created, { status: 201 });
}
