import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");
    const rubriqueId = searchParams.get("rubriqueId");

    const whereClause: Prisma.agent_rubriquesWhereInput = {};
    if (agentId) whereClause.agent_id = parseInt(agentId);
    if (rubriqueId) whereClause.rubrique_id = parseInt(rubriqueId);

    const relations = await prisma.agent_rubriques.findMany({
      where: whereClause,
      include: {
        agents: true,
        rubriques: true,
      },
      orderBy: { id: "desc" },
    });

    return NextResponse.json(relations);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des relations agent-rubrique:",
      error
    );
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { agent_id, rubrique_id } = body;

    if (!agent_id || !rubrique_id) {
      return NextResponse.json(
        { message: "agent_id et rubrique_id sont requis" },
        { status: 400 }
      );
    }

    // Vérifier si la relation existe déjà
    const existing = await prisma.agent_rubriques.findFirst({
      where: {
        agent_id: parseInt(agent_id),
        rubrique_id: parseInt(rubrique_id),
      },
    });

    if (existing) {
      return NextResponse.json(
        { message: "Cette affectation existe déjà" },
        { status: 409 }
      );
    }

    const relation = await prisma.agent_rubriques.create({
      data: {
        agent_id: parseInt(agent_id),
        rubrique_id: parseInt(rubrique_id),
      },
      include: {
        agents: true,
        rubriques: true,
      },
    });

    return NextResponse.json(relation, { status: 201 });
  } catch (error) {
    console.error(
      "Erreur lors de la création de la relation agent-rubrique:",
      error
    );
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agentId");
    const rubriqueId = searchParams.get("rubriqueId");

    if (!agentId || !rubriqueId) {
      return NextResponse.json(
        { message: "agentId et rubriqueId sont requis" },
        { status: 400 }
      );
    }

    await prisma.agent_rubriques.deleteMany({
      where: {
        agent_id: parseInt(agentId),
        rubrique_id: parseInt(rubriqueId),
      },
    });

    return NextResponse.json({ message: "Relation supprimée" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la relation:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
