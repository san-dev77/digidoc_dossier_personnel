import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";

export async function POST(req: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(req);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { piece_id, disponible, agent_id } = await req.json();

    console.log(
      "POST /api/pieces-check - piece_id:",
      piece_id,
      "disponible:",
      disponible,
      "agent_id:",
      agent_id
    );

    // Vérifier si une vérification existe déjà pour cette pièce et cet agent
    const existingCheck = await prisma.pieces_check.findFirst({
      where: {
        piece_id: parseInt(piece_id),
        agent_id: parseInt(agent_id),
      },
      orderBy: {
        date_check: "desc",
      },
    });

    let result;
    if (existingCheck) {
      // Mettre à jour la vérification existante
      result = await prisma.pieces_check.update({
        where: { id: existingCheck.id },
        data: {
          disponible,
          date_check: new Date(),
        },
      });
    } else {
      // Créer une nouvelle vérification
      result = await prisma.pieces_check.create({
        data: {
          piece_id: parseInt(piece_id),
          disponible,
          agent_id: parseInt(agent_id),
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        id: result.id.toString(),
        piece_id: result.piece_id.toString(),
        disponible: result.disponible,
        date_check: result.date_check?.toISOString() ?? null,
        agent_id: result.agent_id.toString(),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la disponibilité:", error);
    return NextResponse.json(
      { success: false, message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

export async function GET(req: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(req);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const agentId = searchParams.get("agent_id");
    const pieceId = searchParams.get("piece_id");

    interface WhereClause {
      agent_id?: number;
      piece_id?: number;
    }
    const whereClause: WhereClause = {};
    if (agentId) {
      whereClause.agent_id = parseInt(agentId);
    }
    if (pieceId) {
      whereClause.piece_id = parseInt(pieceId);
    }

    const checks = await prisma.pieces_check.findMany({
      where: whereClause,
      include: {
        pieces: true,
        agents: true,
      },
      orderBy: {
        date_check: "desc",
      },
    });

    const formattedChecks = checks.map((check) => ({
      id: check.id.toString(),
      piece_id: check.piece_id.toString(),
      disponible: check.disponible,
      date_check: check.date_check?.toISOString() ?? null,
      agent_id: check.agent_id.toString(),
      piece: {
        id: check.pieces.id.toString(),
        nom: check.pieces.nom,
      },
      agent: {
        id: check.agents.id.toString(),
        nom: check.agents.nom_complet,
      },
    }));

    return NextResponse.json({
      success: true,
      data: formattedChecks,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des vérifications:", error);

    // En cas d'erreur, retourner un tableau vide
    return NextResponse.json({
      success: true,
      data: [],
    });
  }
}
