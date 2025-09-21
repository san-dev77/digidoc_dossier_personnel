import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const { metadata } = body;

    console.log("💾 Création de métadonnées pour la pièce ID:", pieceId);
    console.log("📝 Métadonnées à créer:", metadata);

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

    // Créer les métadonnées
    const createdMetadata = await Promise.all(
      metadata.map(async (meta: any) => {
        return await prisma.metadata_model.create({
          data: {
            piece_id: pieceId,
            libelle: meta.nom,
            type: meta.type,
            obligatoire: meta.obligatoire || false,
            description: meta.description || "",
          },
        });
      })
    );

    // Mettre à jour la pièce pour indiquer qu'elle a des métadonnées
    await prisma.pieces.update({
      where: { id: pieceId },
      data: {
        has_meta: true,
        updated_at: new Date(),
      },
    });

    console.log("✅ Métadonnées créées:", createdMetadata);

    return NextResponse.json({
      message: "Métadonnées créées avec succès",
      metadata: createdMetadata.map((meta) => ({
        id: meta.id,
        nom: meta.libelle,
        type: meta.type,
        obligatoire: meta.obligatoire,
        description: meta.description,
        createdAt: meta.created_at?.toISOString() || "",
        updatedAt: meta.updated_at?.toISOString() || "",
      })),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création des métadonnées:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
