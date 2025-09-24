import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/pieces/[id]/metadata
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

    console.log("📋 Récupération des métadonnées pour la pièce ID:", pieceId);

    // Récupérer les métadonnées de la pièce avec les modèles de métadonnées
    const metaValues = await (prisma as any).meta_values.findMany({
      where: {
        meta_model_id: pieceId,
      },
      include: {
        metadata_model: {
          select: {
            libelle: true,
            type: true,
            obligatoire: true,
          },
        },
      },
      orderBy: {
        created_at: "asc",
      },
    });

    console.log("✅ Métadonnées récupérées:", metaValues.length);

    // Transformer les données pour le frontend
    const metadata = metaValues.map((meta) => ({
      id: meta.id.toString(),
      meta_model_id: meta.meta_model_id.toString(),
      valeur: meta.valeur,
      created_at: meta.created_at.toISOString(),
      metadataModel: meta.metadata_model
        ? {
            libelle: meta.metadata_model.libelle,
            type: meta.metadata_model.type,
            obligatoire: meta.metadata_model.obligatoire,
          }
        : null,
    }));

    return NextResponse.json(metadata);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des métadonnées:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/pieces/[id]/metadata
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const pieceId = parseInt(idParam);

    if (isNaN(pieceId)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const body = await request.json();
    const { meta_model_id, valeur } = body;

    if (!meta_model_id || !valeur) {
      return NextResponse.json(
        { message: "meta_model_id et valeur sont requis" },
        { status: 400 }
      );
    }

    console.log("📝 Création d'une métadonnée pour la pièce ID:", pieceId);
    console.log("📋 Données:", { meta_model_id, valeur });

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

    // Créer la métadonnée
    const metaValue = await (prisma as any).meta_values.create({
      data: {
        meta_model_id: pieceId,
        valeur: valeur,
      },
      include: {
        metadata_model: {
          select: {
            libelle: true,
            type: true,
            obligatoire: true,
          },
        },
      },
    });

    console.log("✅ Métadonnée créée:", metaValue);

    // Mettre à jour le flag has_meta de la pièce
    await prisma.pieces.update({
      where: { id: pieceId },
      data: {
        has_meta: true,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: metaValue.id.toString(),
      meta_model_id: metaValue.meta_model_id.toString(),
      valeur: metaValue.valeur,
      created_at: metaValue.created_at.toISOString(),
      metadataModel: metaValue.metadata_model
        ? {
            libelle: metaValue.metadata_model.libelle,
            type: metaValue.metadata_model.type,
            obligatoire: metaValue.metadata_model.obligatoire,
          }
        : null,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création de la métadonnée:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/pieces/[id]/metadata
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const pieceId = parseInt(idParam);

    if (isNaN(pieceId)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const body = await request.json();
    const { meta_value_id, valeur } = body;

    if (!meta_value_id || !valeur) {
      return NextResponse.json(
        { message: "meta_value_id et valeur sont requis" },
        { status: 400 }
      );
    }

    console.log("🔧 Mise à jour de la métadonnée ID:", meta_value_id);

    // Mettre à jour la métadonnée
    const metaValue = await (prisma as any).meta_values.update({
      where: { id: parseInt(meta_value_id) },
      data: {
        valeur: valeur,
      },
      include: {
        metadata_model: {
          select: {
            libelle: true,
            type: true,
            obligatoire: true,
          },
        },
      },
    });

    console.log("✅ Métadonnée mise à jour:", metaValue);

    return NextResponse.json({
      id: metaValue.id.toString(),
      meta_model_id: metaValue.meta_model_id.toString(),
      valeur: metaValue.valeur,
      created_at: metaValue.created_at.toISOString(),
      metadataModel: metaValue.metadata_model
        ? {
            libelle: metaValue.metadata_model.libelle,
            type: metaValue.metadata_model.type,
            obligatoire: metaValue.metadata_model.obligatoire,
          }
        : null,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la métadonnée:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/pieces/[id]/metadata
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const pieceId = parseInt(idParam);

    if (isNaN(pieceId)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const metaValueId = searchParams.get("meta_value_id");

    if (!metaValueId) {
      return NextResponse.json(
        { message: "meta_value_id est requis" },
        { status: 400 }
      );
    }

    console.log("🗑️ Suppression de la métadonnée ID:", metaValueId);

    // Supprimer la métadonnée
    await (prisma as any).meta_values.delete({
      where: { id: parseInt(metaValueId) },
    });

    // Vérifier s'il reste des métadonnées pour cette pièce
    const remainingMetadata = await (prisma as any).meta_values.count({
      where: { meta_model_id: pieceId },
    });

    // Si plus de métadonnées, mettre à jour le flag de la pièce
    if (remainingMetadata === 0) {
      await prisma.pieces.update({
        where: { id: pieceId },
        data: {
          has_meta: false,
          updated_at: new Date(),
        },
      });
    }

    console.log(
      "✅ Métadonnée supprimée, métadonnées restantes:",
      remainingMetadata
    );

    return NextResponse.json({
      message: "Métadonnée supprimée avec succès",
      hasRemainingMetadata: remainingMetadata > 0,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression de la métadonnée:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
