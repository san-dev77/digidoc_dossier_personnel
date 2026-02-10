import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const resolvedParams = await params;
    const pieceId = parseInt(resolvedParams.id);

    if (isNaN(pieceId)) {
      return NextResponse.json(
        { message: "ID de pièce invalide" },
        { status: 400 }
      );
    }

    const { searchParams } = new URL(request.url);
    const agentDossierId = searchParams.get("agentDossierId");

    // Récupérer les fichiers de la pièce avec filtre par agent_dossier_id
    // Si agentDossierId n'est pas fourni, on retourne une erreur ou une liste vide
    // pour éviter la fuite de données entre agents
    if (!agentDossierId) {
      return NextResponse.json([]);
    }

    const files = await prisma.piece_file.findMany({
      where: { 
        id_piece: pieceId,
        agent_dossier_id: parseInt(agentDossierId)
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const formattedFiles = files.map((file: any) => ({
      id: file.id,
      id_piece: file.id_piece,
      filePath: file.file_path,
      file_path: file.file_path, // Backward comp
      mimeType: file.mime_type,
      mime_type: file.mime_type, // Backward comp
      createdAt: file.created_at,
      created_at: file.created_at, // Backward comp
    }));

    return NextResponse.json(formattedFiles);
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const resolvedParams = await params;
    const pieceId = parseInt(resolvedParams.id);

    if (isNaN(pieceId)) {
      return NextResponse.json(
        { message: "ID de pièce invalide" },
        { status: 400 }
      );
    }

    const body = await request.json();
    const { file_path, agent_dossier_id } = body;

    if (!file_path) {
      return NextResponse.json(
        { message: "Le chemin du fichier est requis" },
        { status: 400 }
      );
    }

    console.log("📁 Liaison d'un fichier à la pièce ID:", pieceId);
    console.log("📋 Données du fichier:", { file_path, agent_dossier_id });

    // Vérifier que la pièce existe
    const piece = await prisma.pieces.findUnique({
      where: { id: pieceId },
    });

    if (!piece) {
      return NextResponse.json(
        { message: "Pièce non trouvée" },
        { status: 404 }
      );
    }

    // Créer l'enregistrement de fichier avec agent_dossier_id
    interface PieceFileCreateData {
      id_piece: number;
      file_path: string;
      agent_dossier_id?: number;
    }

    const dataToCreate: PieceFileCreateData = {
      id_piece: pieceId,
      file_path: file_path,
    };

    if (agent_dossier_id) {
      dataToCreate.agent_dossier_id = parseInt(agent_dossier_id);
    }

    const pieceFile = await prisma.piece_file.create({
      data: dataToCreate,
    });

    console.log("✅ Fichier lié à la pièce avec succès:", pieceFile);

    return NextResponse.json({
      message: "Fichier lié à la pièce avec succès",
      file: pieceFile,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la liaison du fichier:", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
