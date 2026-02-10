import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";

// GET - Récupérer tous les agent_dossiers ou filtrer par agentId/sousDossierId
export async function GET(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const agentId = searchParams.get("agentId");
    const sousDossierId = searchParams.get("sousDossierId");
    const rubriqueId = searchParams.get("rubriqueId");

    let agentDossiers;

    if (agentId) {
      // Filtrer par agent
      agentDossiers = await prisma.agent_dossiers.findMany({
        where: { agent_id: parseInt(agentId) },
        include: {
          agents: true,
          rubriques: true,
          sous_dossiers: true,
        },
      });
    } else if (sousDossierId) {
      // Filtrer par sous-dossier
      agentDossiers = await prisma.agent_dossiers.findMany({
        where: { sous_dossier_id: parseInt(sousDossierId) },
        include: {
          agents: true,
          rubriques: true,
          sous_dossiers: true,
        },
      });
    } else if (rubriqueId) {
      // Filtrer par rubrique
      agentDossiers = await prisma.agent_dossiers.findMany({
        where: { rubrique_id: parseInt(rubriqueId) },
        include: {
          agents: true,
          rubriques: true,
          sous_dossiers: true,
        },
      });
    } else {
      // Récupérer tous
      agentDossiers = await prisma.agent_dossiers.findMany({
        include: {
          agents: true,
          rubriques: true,
          sous_dossiers: true,
        },
      });
    }

    return NextResponse.json(agentDossiers);
  } catch (error) {
    console.error("Erreur GET /api/agent-dossiers:", error);
    return NextResponse.json(
      { message: "Erreur lors de la récupération des agent_dossiers" },
      { status: 500 }
    );
  }
}

// POST - Créer un agent_dossier
export async function POST(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const body = await request.json();
    const { agent_id, rubrique_id, sous_dossier_id } = body;

    if (!agent_id || !rubrique_id || !sous_dossier_id) {
      return NextResponse.json(
        { message: "agent_id, rubrique_id et sous_dossier_id sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si l'entrée existe déjà (même agent + même rubrique + même sous-dossier)
    const existing = await prisma.agent_dossiers.findFirst({
      where: {
        agent_id: parseInt(agent_id),
        rubrique_id: parseInt(rubrique_id),
        sous_dossier_id: parseInt(sous_dossier_id),
      },
    });

    if (existing) {
      // Retourner l'existant sans erreur
      return NextResponse.json(existing, { status: 200 });
    }

    // Créer l'entrée
    const agentDossier = await prisma.agent_dossiers.create({
      data: {
        agent_id: parseInt(agent_id),
        rubrique_id: parseInt(rubrique_id),
        sous_dossier_id: parseInt(sous_dossier_id),
      },
      include: {
        agents: true,
        rubriques: true,
        sous_dossiers: true,
      },
    });

    return NextResponse.json(agentDossier, { status: 201 });
  } catch (error) {
    console.error("Erreur POST /api/agent-dossiers:", error);
    return NextResponse.json(
      { message: "Erreur lors de la création de l'agent_dossier" },
      { status: 500 }
    );
  }
}
