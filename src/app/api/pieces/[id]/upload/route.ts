import { NextRequest, NextResponse } from "next/server";
import { ThumbnailService } from "@/services/storage/ThumbnailService";
import { FileValidator } from "@/services/validation/FileValidator";
import {
  getReadableStoragePath,
  generateAgentFileName,
} from "@/config/storage";
import { prisma } from "@/lib/prisma";
import { createErrorResponse } from "@/lib/errors/safeError";
import { protectRoute } from "@/lib/auth/routeProtection";
import fs from "fs-extra";
import path from "path";

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
    const resolvedParams = await params;
    const pieceId = parseInt(resolvedParams.id);

    if (isNaN(pieceId)) {
      return NextResponse.json(
        { error: "ID de pièce invalide" },
        { status: 400 }
      );
    }

    // Vérifier que la pièce existe et récupérer ses informations
    const piece = await prisma.pieces.findUnique({
      where: { id: pieceId },
      include: {
        sous_dossiers: {
          include: {
            rubriques: true,
          },
        },
      },
    });

    if (!piece) {
      return NextResponse.json(
        { error: "Pièce non trouvée" },
        { status: 404 }
      );
    }

    // Récupérer les données du formulaire
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const agentDossierId = formData.get("agentDossierId") as string | null;

    if (!file) {
      return NextResponse.json(
        { error: "Fichier manquant" },
        { status: 400 }
      );
    }

    // Convertir le fichier en buffer
    const fileBuffer = Buffer.from(await file.arrayBuffer());

    // Créer un objet fichier pour la validation
    const fileObj = {
      originalname: file.name,
      mimetype: file.type,
      size: file.size,
      buffer: fileBuffer,
    };

    // Valider le fichier
    const validation = FileValidator.validateFile(fileObj);
    if (!validation.isValid) {
      return NextResponse.json(
        { error: "Fichier invalide", errors: validation.errors },
        { status: 400 }
      );
    }

    // Récupérer les informations nécessaires
    const rubrique = piece.sous_dossiers.rubriques;
    const sousDossier = piece.sous_dossiers;

    // Récupérer l'agent si agentDossierId est fourni
    let agent = null;
    if (agentDossierId) {
      const agentDossier = await prisma.agent_dossiers.findUnique({
        where: { id: parseInt(agentDossierId) },
        include: {
          agents: true,
        },
      });
      if (agentDossier) {
        agent = agentDossier.agents;
      }
    }

    // Créer le chemin avec la nouvelle architecture
    const agentNom = agent ? agent.nom_complet : "Sans_Agent";
    const basePath = getReadableStoragePath(
      rubrique.nom,
      sousDossier.titre,
      piece.nom,
      agentNom
    );

    console.log("🏗️ Upload de fichier pour pièce existante:");
    console.log("📁 Rubrique:", rubrique.nom);
    console.log("📂 Sous-dossier:", sousDossier.titre);
    console.log("📄 Pièce:", piece.nom);
    console.log("👤 Agent:", agentNom);
    console.log("🎯 Chemin complet:", basePath);

    // Créer le dossier s'il n'existe pas
    await fs.ensureDir(basePath);
    console.log("✅ Dossier créé avec succès");

    // Générer le nom du fichier avec l'agent
    const originalFileName = file.name;
    const finalFileName = generateAgentFileName(originalFileName, agentNom);
    const filePath = path.join(basePath, finalFileName);

    console.log("📝 Nom du fichier original:", originalFileName);
    console.log("📝 Nom du fichier avec agent:", finalFileName);
    console.log("📝 Chemin complet du fichier:", filePath);

    // Sauvegarder le fichier
    await fs.writeFile(filePath, fileBuffer);
    const fileSize = fileBuffer.length;
    console.log("✅ Fichier sauvegardé avec succès");

    // Générer un thumbnail dans le même dossier
    const thumbnailPath = path.join(basePath, `thumb_${finalFileName}`);
    const thumbnailResult = await ThumbnailService.generateThumbnailForFile(
      filePath,
      thumbnailPath,
      file.type
    );

    // Lier le fichier à la pièce
    const pieceFileData: {
      id_piece: number;
      file_path: string;
      agent_dossier_id?: number;
    } = {
      id_piece: pieceId,
      file_path: filePath,
    };

    if (agentDossierId) {
      pieceFileData.agent_dossier_id = parseInt(agentDossierId);
    }

    const pieceFile = await prisma.piece_file.create({
      data: pieceFileData,
    });

    console.log("✅ Fichier lié à la pièce avec succès:", pieceFile);

    // Préparer la réponse
    const response = {
      success: true,
      data: {
        pieceId: pieceId.toString(),
        fileId: pieceFile.id.toString(),
        fileName: finalFileName,
        originalName: file.name,
        filePath,
        fileSize,
        mimeType: file.type,
        thumbnailPath: thumbnailResult.success
          ? thumbnailResult.thumbnailPath
          : null,
        uploadedAt: new Date().toISOString(),
      },
      warnings: validation.warnings,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);
    return createErrorResponse(
      error,
      "Erreur lors de l'upload du fichier",
      500
    );
  }
}

