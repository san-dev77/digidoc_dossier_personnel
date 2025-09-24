import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/pieces/[id]/metadata-models
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const pieceId = parseInt(idParam);

    if (isNaN(pieceId)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    console.log(
      "📋 Récupération des modèles de métadonnées pour la pièce ID:",
      pieceId
    );

    // Récupérer les modèles de métadonnées de la pièce
    const metadataModels = await prisma.metadata_model.findMany({
      where: {
        piece_id: pieceId,
      },
      orderBy: {
        created_at: "asc",
      },
    });

    console.log("✅ Modèles de métadonnées récupérés:", metadataModels.length);

    // Transformer les données pour le frontend
    const metadataModelsData = metadataModels.map((model) => ({
      id: model.id.toString(),
      piece_id: model.piece_id.toString(),
      libelle: model.libelle,
      type: model.type,
      obligatoire: model.obligatoire,
      description: model.description,
      created_at: model.created_at.toISOString(),
      updated_at: model.updated_at?.toISOString() || null,
    }));

    return NextResponse.json(metadataModelsData);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des modèles de métadonnées:",
      error
    );
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
