import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/pieces?sousDossierId=X
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const sousDossierId = searchParams.get("sousDossierId");

    if (!sousDossierId) {
      return NextResponse.json(
        { message: "sousDossierId est requis" },
        { status: 400 }
      );
    }

    const pieces = await prisma.pieces.findMany({
      where: {
        sous_dossier_id: parseInt(sousDossierId),
      },
      include: {
        metadata_model: true,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    const formattedPieces = pieces.map((piece) => ({
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
    }));

    return NextResponse.json(formattedPieces);
  } catch (error) {
    console.error("Erreur lors de la récupération des pièces:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/pieces
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sous_dossier_id, nom, description, has_meta, metadonnees } = body;

    if (!sous_dossier_id || !nom) {
      return NextResponse.json(
        { message: "sous_dossier_id et nom sont requis" },
        { status: 400 }
      );
    }

    // Créer la pièce
    const piece = await prisma.pieces.create({
      data: {
        sous_dossier_id: parseInt(sous_dossier_id),
        nom,
        description: description || null,
        has_meta: has_meta || false,
      },
    });

    // Créer les métadonnées si elles existent
    if (has_meta && metadonnees && metadonnees.length > 0) {
      const metadataToInsert = metadonnees.map((meta: any) => ({
        piece_id: piece.id,
        libelle: meta.nom,
        type: meta.type,
        obligatoire: meta.obligatoire || false,
        description: meta.description || null,
      }));

      await prisma.metadata_model.createMany({
        data: metadataToInsert,
      });
    }

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
    console.error("Erreur lors de la création de la pièce:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
