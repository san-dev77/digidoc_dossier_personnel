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
    const agentDossierId = searchParams.get("agentDossierId");

    console.log(`🔍 [API Pieces] Fetching pieces for sousDossierId=${sousDossierId}, agentDossierId=${agentDossierId}`);

    if (!sousDossierId) {
      return NextResponse.json(
        { message: "sousDossierId est requis" },
        { status: 400 }
      );
    }

    // Récupérer les pièces avec toutes leurs relations en une seule requête optimisée
    const pieces = await prisma.pieces.findMany({
      where: {
        sous_dossier_id: parseInt(sousDossierId)
      },
      include: {
        metadata_model: {
          include: {
            meta_values: agentDossierId ? {
              where: {
                agent_dossier_id: parseInt(agentDossierId)
              }
            } : true
          }
        },
        piece_file: true,
        position: true
      },
      orderBy: [
        { position: { position: 'asc' } },
        { id: 'asc' }
      ]
    });

    console.log(`✅ [API Pieces] Found ${pieces.length} pieces`);

    const formattedPieces = pieces.map((piece: any) => ({
      id: piece.id,
      sousDossierId: piece.sous_dossier_id.toString(),
      nom: piece.nom,
      description: piece.description,
      aMetadonnees: Boolean(piece.has_meta),
      createdAt: piece.created_at?.toISOString() || "",
      updatedAt: piece.updated_at?.toISOString() || "",
      files: piece.piece_file.map((file: any) => ({
        id: file.id,
        filePath: file.file_path,
        mimeType: file.mime_type,
        createdAt: file.created_at?.toISOString() || "",
      })),
      metadonnees: piece.metadata_model.flatMap((model: any) => 
        model.meta_values.map((val: any) => ({
          id: val.id,
          meta_model_id: model.id,
          valeur: val.valeur,
          createdAt: val.created_at?.toISOString() || "",
          metadataModel: {
            libelle: model.libelle,
            type: model.type,
            obligatoire: Boolean(model.obligatoire)
          }
        }))
      ),
      metadataModels: piece.metadata_model.map((meta: any) => ({
        id: meta.id,
        piece_id: piece.id,
        libelle: meta.libelle,
        nom: meta.libelle, // Alias
        type: meta.type,
        obligatoire: Boolean(meta.obligatoire),
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
