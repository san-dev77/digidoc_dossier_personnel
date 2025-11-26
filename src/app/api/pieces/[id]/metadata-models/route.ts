import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";

// GET /api/pieces/[id]/metadata-models - Récupérer les modèles de métadonnées d'une pièce
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
    const models = metadataModels.map((model) => ({
      id: model.id.toString(),
      libelle: model.libelle,
      type: model.type,
      obligatoire: model.obligatoire,
      description: model.description || "",
      piece_id: model.piece_id.toString(),
      created_at: model.created_at?.toISOString() || null,
      updated_at: model.updated_at?.toISOString() || null,
    }));

    return NextResponse.json(models);
  } catch (error) {
    console.error(
      "❌ Erreur lors de la récupération des modèles de métadonnées:",
      error
    );
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/pieces/[id]/metadata-models - Créer des modèles de métadonnées pour une pièce
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
    const { id: idParam } = await params;
    const pieceId = parseInt(idParam);

    if (isNaN(pieceId)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const body = await request.json();
    const { metadataModels } = body;

    if (!metadataModels || !Array.isArray(metadataModels)) {
      return NextResponse.json(
        { message: "metadataModels doit être un tableau" },
        { status: 400 }
      );
    }

    console.log(
      "📝 Création de modèles de métadonnées pour la pièce ID:",
      pieceId
    );
    console.log("📋 Nombre de modèles à créer:", metadataModels.length);

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

    // Créer tous les modèles de métadonnées
    const createdModels = [];

    for (const modelData of metadataModels) {
      const { libelle, type, obligatoire, description } = modelData;

      if (!libelle || !type) {
        console.warn(
          "⚠️ Modèle de métadonnée ignoré (nom ou type manquant):",
          modelData
        );
        continue;
      }

      const model = await prisma.metadata_model.create({
        data: {
          libelle: libelle,
          type: type,
          obligatoire: obligatoire || false,
          description: description || "",
          piece_id: pieceId,
        },
      });

      createdModels.push({
        id: model.id.toString(),
        libelle: model.libelle,
        type: model.type,
        obligatoire: model.obligatoire,
        description: model.description,
        piece_id: model.piece_id.toString(),
        created_at: model.created_at?.toISOString() || null,
        updated_at: model.updated_at?.toISOString() || null,
      });
    }

    // Mettre à jour le flag de la pièce pour indiquer qu'elle a des métadonnées
    await prisma.pieces.update({
      where: { id: pieceId },
      data: {
        has_meta: true,
        updated_at: new Date(),
      },
    });

    console.log("✅ Modèles de métadonnées créés:", createdModels.length);

    return NextResponse.json({
      message: `${createdModels.length} modèle(s) de métadonnées créé(s) avec succès`,
      models: createdModels,
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la création des modèles de métadonnées:",
      error
    );
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/pieces/[id]/metadata-models - Supprimer tous les modèles de métadonnées d'une pièce
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { id: idParam } = await params;
    const pieceId = parseInt(idParam);

    if (isNaN(pieceId)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    console.log(
      "🗑️ Suppression des modèles de métadonnées pour la pièce ID:",
      pieceId
    );

    // Supprimer tous les modèles de métadonnées de la pièce
    const deleteResult = await prisma.metadata_model.deleteMany({
      where: { piece_id: pieceId },
    });

    // Mettre à jour le flag de la pièce
    await prisma.pieces.update({
      where: { id: pieceId },
      data: {
        has_meta: false,
        updated_at: new Date(),
      },
    });

    console.log("✅ Modèles de métadonnées supprimés:", deleteResult.count);

    return NextResponse.json({
      message: `${deleteResult.count} modèle(s) de métadonnées supprimé(s) avec succès`,
      deletedCount: deleteResult.count,
    });
  } catch (error) {
    console.error(
      "❌ Erreur lors de la suppression des modèles de métadonnées:",
      error
    );
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
