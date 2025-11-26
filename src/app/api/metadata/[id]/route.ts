import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";

// PUT /api/metadata/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const metadataId = parseInt(idParam);

    if (isNaN(metadataId)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const body = await request.json();
    const { libelle, type, obligatoire, description } = body;

    console.log("🔧 Mise à jour de la métadonnée ID:", metadataId);
    console.log("📝 Nouvelles données:", body);

    const metadata = await prisma.metadata_model.update({
      where: { id: metadataId },
      data: {
        libelle: libelle || undefined,
        type: type || undefined,
        obligatoire: obligatoire !== undefined ? obligatoire : undefined,
        description: description !== undefined ? description : undefined,
        updated_at: new Date(),
      },
    });

    console.log("✅ Métadonnée mise à jour:", metadata);

    return NextResponse.json({
      id: metadata.id,
      nom: metadata.libelle,
      type: metadata.type,
      obligatoire: metadata.obligatoire,
      description: metadata.description,
      createdAt: metadata.created_at?.toISOString() || "",
      updatedAt: metadata.updated_at?.toISOString() || "",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour de la métadonnée:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/metadata/[id]
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
    const metadataId = parseInt(idParam);

    if (isNaN(metadataId)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    console.log("🗑️ Suppression de la métadonnée ID:", metadataId);

    // Vérifier si c'est la dernière métadonnée de la pièce
    const metadata = await prisma.metadata_model.findUnique({
      where: { id: metadataId },
    });

    if (!metadata) {
      return NextResponse.json(
        { message: "Métadonnée non trouvée" },
        { status: 404 }
      );
    }

    // Supprimer la métadonnée
    await prisma.metadata_model.delete({
      where: { id: metadataId },
    });

    // Vérifier s'il reste des métadonnées pour cette pièce
    const remainingMetadata = await prisma.metadata_model.count({
      where: { piece_id: metadata.piece_id },
    });

    // Si plus de métadonnées, mettre à jour le flag de la pièce
    if (remainingMetadata === 0) {
      await prisma.pieces.update({
        where: { id: metadata.piece_id },
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
