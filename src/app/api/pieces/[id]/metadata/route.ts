import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";

// GET /api/pieces/[id]/metadata
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
    const { id: idParam } = await params;
    const pieceId = parseInt(idParam);

    if (isNaN(pieceId)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const agentDossierId = searchParams.get("agentDossierId");

    console.log("📋 Récupération des métadonnées pour la pièce ID:", pieceId);

    // Construire le where clause avec filtre optionnel par agent_dossier_id
    interface WhereClause {
      metadata_model: {
        piece_id: number;
      };
      agent_dossier_id?: number;
    }

    const whereClause: WhereClause = {
      metadata_model: {
        piece_id: pieceId,
      },
    };

    if (agentDossierId) {
      whereClause.agent_dossier_id = parseInt(agentDossierId);
    }

    // Récupérer les métadonnées de la pièce avec les modèles de métadonnées
    const metaValues = await prisma.meta_values.findMany({
      where: whereClause,
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
    interface MetaValueWithModel {
      id: number | bigint;
      meta_model_id: number | bigint;
      valeur: string;
      created_at: Date;
      metadata_model: {
        libelle: string;
        type: string;
        obligatoire: boolean;
      } | null;
    }

    const metadata = (metaValues as MetaValueWithModel[]).map((meta) => ({
      id: meta.id.toString(),
      meta_model_id: meta.meta_model_id.toString(),
      valeur: meta.valeur,
      created_at: meta.created_at?.toISOString() ?? null,
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
    const { meta_model_id, valeur, agent_dossier_id } = body;

    if (!meta_model_id || !valeur) {
      return NextResponse.json(
        { message: "meta_model_id et valeur sont requis" },
        { status: 400 }
      );
    }

    console.log("📝 Création d'une métadonnée pour la pièce ID:", pieceId);
    console.log("📋 Données:", { meta_model_id, valeur, agent_dossier_id });
    console.log("🔍 meta_model_id parsé:", parseInt(meta_model_id));

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

    // Lister tous les modèles de métadonnées disponibles
    const allMetadataModels = await prisma.metadata_model.findMany({
      where: { piece_id: pieceId },
    });
    console.log(
      "📋 Tous les modèles de métadonnées pour cette pièce:",
      allMetadataModels
    );
    interface MetadataModel {
      id: number | bigint;
      libelle: string;
    }

    console.log(
      "🔍 IDs disponibles:",
      allMetadataModels.map((m: MetadataModel) => m.id)
    );

    // Vérifier que le modèle de métadonnée existe
    const metadataModel = await prisma.metadata_model.findUnique({
      where: { id: parseInt(meta_model_id) },
    });

    if (!metadataModel) {
      console.error("❌ Modèle de métadonnée non trouvé:", meta_model_id);
      interface MetadataModel {
        id: number | bigint;
        libelle: string;
      }

      console.error(
        "📋 Modèles disponibles:",
        allMetadataModels.map((m: MetadataModel) => ({
          id: m.id,
          libelle: m.libelle,
        }))
      );
      return NextResponse.json(
        { message: "Modèle de métadonnée non trouvé" },
        { status: 404 }
      );
    }

    console.log("✅ Modèle de métadonnée trouvé:", metadataModel);

    // Créer la métadonnée
    interface MetaValueCreateData {
      meta_model_id: number;
      valeur: string;
      agent_dossier_id?: number;
    }

    const dataToCreate: MetaValueCreateData = {
      meta_model_id: parseInt(meta_model_id),
      valeur: valeur,
    };

    // Ajouter agent_dossier_id si fourni
    if (agent_dossier_id) {
      dataToCreate.agent_dossier_id = parseInt(agent_dossier_id);
    }

    console.log("🔍 Données pour création meta_value:", dataToCreate);

    const metaValue = await prisma.meta_values.create({
      data: dataToCreate,
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

    return NextResponse.json({
      id: metaValue.id.toString(),
      meta_model_id: metaValue.meta_model_id.toString(),
      valeur: metaValue.valeur,
      created_at: metaValue.created_at?.toISOString() ?? null,
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
    const { meta_value_id, valeur } = body;

    if (!meta_value_id || !valeur) {
      return NextResponse.json(
        { message: "meta_value_id et valeur sont requis" },
        { status: 400 }
      );
    }

    console.log("🔧 Mise à jour de la métadonnée ID:", meta_value_id);

    // Mettre à jour la métadonnée
    const metaValue = await prisma.meta_values.update({
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
      created_at: metaValue.created_at?.toISOString() ?? null,
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
    await prisma.meta_values.delete({
      where: { id: parseInt(metaValueId) },
    });

    // Vérifier s'il reste des métadonnées pour cette pièce
    const remainingMetadata = await prisma.meta_values.count({
      where: {
        metadata_model: {
          piece_id: pieceId,
        },
      },
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
