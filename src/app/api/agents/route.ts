import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth/password";
import { createErrorResponse } from "@/lib/errors/safeError";
import { protectRoute } from "@/lib/auth/routeProtection";

export async function GET(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  const agents = await prisma.agents.findMany({
    orderBy: { created_at: "desc" },
  });
  return NextResponse.json(agents);
}

export async function POST(req: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(req);
  if (!authResult.authorized) {
    return authResult.response!;
  }

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
    interface AgentCreateData {
      matricule: string;
      nom_complet: string;
      email: string | null;
      fonction: string | null;
      lieu_naissance: string | null;
      sexe: string | null;
      situation_matrimoniale: string | null;
      adresse: string | null;
      telephone: string | null;
      password: string;
      date_naissance?: Date;
    }

    const dataToCreate: AgentCreateData = {
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

    // Hasher le mot de passe avant de l'enregistrer
    dataToCreate.password = await hashPassword(dataToCreate.password);

    console.log("[CREATE AGENT] Data to create:", dataToCreate);

    const created = await prisma.agents.create({
      data: dataToCreate,
    });

    // Ne pas retourner le mot de passe
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password: _, ...agentWithoutPassword } = created;

    console.log("[CREATE AGENT] Success:", created.id);
    return NextResponse.json(agentWithoutPassword, { status: 201 });
  } catch (error) {
    console.error("[CREATE AGENT] Erreur:", error);
    return createErrorResponse(
      error,
      "Erreur lors de la création de l'agent",
      500
    );
  }
}
