import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { query } from "@/lib/db";
import { protectRoute } from "@/lib/auth/routeProtection";

// GET /api/pieces?sousDossierId=X
export async function GET(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const sousDossierId = searchParams.get("sousDossierId");

    if (!sousDossierId) {
      return NextResponse.json(
        { message: "sousDossierId est requis" },
        { status: 400 }
      );
    }

    // Utiliser une requête SQL pour trier par position
    const { rows } = await query(
      `SELECT 
        p.id,
        p.sous_dossier_id,
        p.nom,
        p.description,
        p.has_meta,
        p.created_at,
        p.updated_at,
        COALESCE(pp.position, 999) as position
      FROM pieces p
      LEFT JOIN piece_positions pp ON p.id = pp.piece_id AND pp.sous_dossier_id = $1
      WHERE p.sous_dossier_id = $1
      ORDER BY COALESCE(pp.position, 999) ASC, p.id ASC`,
      [sousDossierId]
    );

    // Récupérer les métadonnées et fichiers pour chaque pièce
    const pieces = await Promise.all(
      rows.map(async (piece: { id: number }) => {
        const [metadata, files] = await Promise.all([
          prisma.metadata_model.findMany({
            where: { piece_id: piece.id },
          }),
          prisma.piece_file.findMany({
            where: { id_piece: piece.id },
          }),
        ]);

        return {
          ...piece,
          metadata_model: metadata,
          piece_file: files,
        };
      })
    );

    interface PieceWithRelations {
      id: number | bigint;
      sous_dossier_id: number | bigint;
      nom: string;
      description: string | null;
      has_meta: boolean;
      created_at: Date | null;
      updated_at: Date | null;
      piece_file: Array<{
        id: number | bigint;
        file_path: string;
        created_at: Date | null;
      }>;
      metadata_model: Array<{
        id: number | bigint;
        libelle: string;
        type: string;
        obligatoire: boolean;
        description: string | null;
        created_at: Date | null;
        updated_at: Date | null;
      }>;
    }

    const formattedPieces = (pieces as PieceWithRelations[]).map((piece) => ({
      id: piece.id,
      sousDossierId: piece.sous_dossier_id.toString(),
      nom: piece.nom,
      description: piece.description,
      aMetadonnees: piece.has_meta || false,
      createdAt: piece.created_at?.toISOString() || "",
      updatedAt: piece.updated_at?.toISOString() || "",
      files: piece.piece_file.map(
        (file: PieceWithRelations["piece_file"][0]) => ({
          id: file.id,
          filePath: file.file_path,
          createdAt: file.created_at?.toISOString() || "",
        })
      ),
      metadonnees: piece.metadata_model.map(
        (meta: PieceWithRelations["metadata_model"][0]) => ({
          id: meta.id,
          nom: meta.libelle,
          type: meta.type,
          obligatoire: meta.obligatoire || false,
          description: meta.description,
          createdAt: meta.created_at?.toISOString() || "",
          updatedAt: meta.updated_at?.toISOString() || "",
        })
      ),
    }));

    return NextResponse.json(formattedPieces);
  } catch (error) {
    console.error("Erreur lors de la récupération des pièces:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/pieces
export async function POST(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const body = await request.json();
    const {
      sous_dossier_id,
      nom,
      description,
      has_meta,
      metadonnees,
      filePath,
      // Note: fileName, fileSize, mimeType peuvent être utilisés pour des validations futures
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      fileName,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      fileSize,
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      mimeType,
    } = body;

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

    // Créer l'enregistrement du fichier si filePath existe
    if (filePath) {
      await prisma.piece_file.create({
        data: {
          id_piece: piece.id,
          file_path: filePath,
        },
      });
    }

    // Créer les métadonnées si elles existent
    if (has_meta && metadonnees && metadonnees.length > 0) {
      interface MetadataInput {
        nom: string;
        type: string;
        obligatoire?: boolean;
        description?: string | null;
      }

      const metadataToInsert = (metadonnees as MetadataInput[]).map((meta) => ({
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
