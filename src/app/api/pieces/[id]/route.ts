import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/pieces/[id]
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const piece = await prisma.pieces.findUnique({
      where: { id },
      include: {
        metadata_model: true,
      },
    });

    if (!piece) {
      return NextResponse.json(
        { message: "Pièce non trouvée" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      id: piece.id,
      sousDossierId: piece.sous_dossier_id.toString(),
      nom: piece.nom,
      description: piece.description,
      aMetadonnees: piece.has_meta || false,
      createdAt: piece.created_at?.toISOString() || "",
      updatedAt: piece.updated_at?.toISOString() || "",
      metadonnees: piece.metadata_model.map((meta) => ({
        id: meta.id,
        nom: meta.libelle,
        type: meta.type,
        obligatoire: meta.obligatoire || false,
        description: meta.description,
        createdAt: meta.created_at?.toISOString() || "",
        updatedAt: meta.updated_at?.toISOString() || "",
      })),
    });
  } catch (error) {
    console.error("Erreur lors de la récupération de la pièce:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// PUT /api/pieces/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const body = await request.json();
    const { nom, description } = body;

    const piece = await prisma.pieces.update({
      where: { id },
      data: {
        nom: nom || undefined,
        description: description !== undefined ? description : undefined,
        updated_at: new Date(),
      },
    });

    return NextResponse.json({
      id: piece.id,
      sousDossierId: piece.sous_dossier_id.toString(),
      nom: piece.nom,
      description: piece.description,
      aMetadonnees: piece.has_meta || false,
      createdAt: piece.created_at?.toISOString() || "",
      updatedAt: piece.updated_at?.toISOString() || "",
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour de la pièce:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/pieces/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    await prisma.pieces.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Pièce supprimée avec succès" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la pièce:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
