import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";

// GET /api/pieces/[id]/metadata-models/[modelId] - Récupérer un modèle de métadonnée
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; modelId: string }> }
) {
  try {
    const { id: idParam, modelId } = await params;
    const pieceId = parseInt(idParam);
    const metadataModelId = parseInt(modelId);

    if (isNaN(pieceId) || isNaN(metadataModelId)) {
      return NextResponse.json({ message: "IDs invalides" }, { status: 400 });
    }

    const model = await prisma.metadata_model.findUnique({
      where: { id: metadataModelId },
    });

    if (!model || model.piece_id !== pieceId) {
      return NextResponse.json(
        { message: "Modèle de métadonnée non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: model.id.toString(),
      nom: model.libelle,
      type: model.type,
      obligatoire: model.obligatoire,
      description: model.description,
      piece_id: model.piece_id.toString(),
      created_at: model.created_at?.toISOString() ?? null,
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération du modèle de métadonnée:",
      error
    );
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/pieces/[id]/metadata-models/[modelId] - Mettre à jour un modèle de métadonnée
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; modelId: string }> }
) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { id: idParam, modelId } = await params;
    const pieceId = parseInt(idParam);
    const metadataModelId = parseInt(modelId);

    if (isNaN(pieceId) || isNaN(metadataModelId)) {
      return NextResponse.json({ message: "IDs invalides" }, { status: 400 });
    }

    const body = await request.json();
    const { nom, type, obligatoire, description } = body;

    if (!nom || !type) {
      return NextResponse.json(
        { message: "nom et type sont requis" },
        { status: 400 }
      );
    }

    // Vérifier que le modèle existe et appartient à la pièce
    const existingModel = await prisma.metadata_model.findUnique({
      where: { id: metadataModelId },
    });

    if (!existingModel || existingModel.piece_id !== pieceId) {
      return NextResponse.json(
        { message: "Modèle de métadonnée non trouvé" },
        { status: 404 }
      );
    }

    // Mettre à jour le modèle
    const updatedModel = await prisma.metadata_model.update({
      where: { id: metadataModelId },
      data: {
        libelle: nom,
        type: type,
        obligatoire: obligatoire || false,
        description: description || "",
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: updatedModel.id.toString(),
      nom: updatedModel.libelle,
      type: updatedModel.type,
      obligatoire: updatedModel.obligatoire,
      description: updatedModel.description,
      piece_id: updatedModel.piece_id.toString(),
      created_at: updatedModel.created_at?.toISOString() ?? null,
      updated_at: updatedModel.updated_at?.toISOString() ?? null,
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la mise à jour du modèle de métadonnée:",
      error
    );
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/pieces/[id]/metadata-models/[modelId] - Supprimer un modèle de métadonnée
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; modelId: string }> }
) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { id: idParam, modelId } = await params;
    const pieceId = parseInt(idParam);
    const metadataModelId = parseInt(modelId);

    if (isNaN(pieceId) || isNaN(metadataModelId)) {
      return NextResponse.json({ message: "IDs invalides" }, { status: 400 });
    }

    // Vérifier que le modèle existe et appartient à la pièce
    const existingModel = await prisma.metadata_model.findUnique({
      where: { id: metadataModelId },
    });

    if (!existingModel || existingModel.piece_id !== pieceId) {
      return NextResponse.json(
        { message: "Modèle de métadonnée non trouvé" },
        { status: 404 }
      );
    }

    // Supprimer le modèle
    await prisma.metadata_model.delete({
      where: { id: metadataModelId },
    });

    // Vérifier s'il reste des modèles pour cette pièce
    const remainingModels = await prisma.metadata_model.count({
      where: { piece_id: pieceId },
    });

    // Si plus de modèles, mettre à jour le flag de la pièce
    if (remainingModels === 0) {
      await prisma.pieces.update({
        where: { id: pieceId },
        data: {
          has_meta: false,
          updated_at: new Date(),
        },
      });
    }

    return NextResponse.json({
      message: "Modèle de métadonnée supprimé avec succès",
      hasRemainingModels: remainingModels > 0,
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la suppression du modèle de métadonnée:",
      error
    );
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
