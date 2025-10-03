import { NextRequest, NextResponse } from "next/server";
import { ThumbnailService } from "@/services/storage/ThumbnailService";
import { FileValidator } from "@/services/validation/FileValidator";
import {
  getReadableStoragePath,
  generateAgentFileName,
} from "@/config/storage";
import { prisma } from "@/lib/prisma";
import fs from "fs-extra";
import path from "path";

export async function POST(request: NextRequest) {
  try {
    // Récupérer les données du formulaire
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const rubriqueId = formData.get("rubriqueId") as string;
    const sousDossierId = formData.get("sousDossierId") as string;
    const agentId = formData.get("agentId") as string;
    const nom = formData.get("nom") as string;
    const fileName = formData.get("fileName") as string;
    const description = formData.get("description") as string;

    // Validation des paramètres requis
    if (!file || !rubriqueId || !sousDossierId || !nom) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
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
        { error: "Fichier invalide", details: validation.errors },
        { status: 400 }
      );
    }

    // Valider les métadonnées
    const metadataValidation = FileValidator.validatePieceMetadata({
      nom,
      description,
      rubriqueId,
      sousDossierId,
    });

    if (!metadataValidation.isValid) {
      return NextResponse.json(
        { error: "Métadonnées invalides", details: metadataValidation.errors },
        { status: 400 }
      );
    }

    // Récupérer les noms depuis la base de données
    const [rubrique, sousDossier, agent] = await Promise.all([
      prisma.rubriques.findUnique({
        where: { id: parseInt(rubriqueId) },
        select: { nom: true },
      }),
      prisma.sous_dossiers.findUnique({
        where: { id: parseInt(sousDossierId) },
        select: { titre: true },
      }),
      agentId
        ? prisma.agents.findUnique({
            where: { id: parseInt(agentId) },
            select: { nom_complet: true },
          })
        : null,
    ]);

    if (!rubrique || !sousDossier) {
      return NextResponse.json(
        { error: "Rubrique ou sous-dossier non trouvé" },
        { status: 404 }
      );
    }

    // Générer un ID unique pour la pièce
    const pieceId = crypto.randomUUID();

    // Créer le chemin avec la nouvelle architecture
    const agentNom = agent ? agent.nom_complet : "Sans_Agent";
    const basePath = getReadableStoragePath(
      rubrique.nom,
      sousDossier.titre,
      nom,
      agentNom
    );

    console.log("🏗️ Création de l'arborescence:");
    console.log("📁 Rubrique:", rubrique.nom);
    console.log("📂 Sous-dossier:", sousDossier.titre);
    console.log("📄 Pièce:", nom);
    console.log("👤 Agent:", agentNom);
    console.log("🎯 Chemin complet:", basePath);

    // Créer le dossier s'il n'existe pas
    await fs.ensureDir(basePath);
    console.log("✅ Dossier créé avec succès");

    // Générer le nom du fichier avec l'agent
    const originalFileName = fileName || file.name;
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

    // Préparer la réponse
    const response = {
      success: true,
      data: {
        pieceId,
        fileName,
        originalName: file.name,
        filePath,
        fileSize,
        mimeType: file.type,
        rubriqueId,
        sousDossierId,
        nom,
        description,
        thumbnailPath: thumbnailResult.success
          ? thumbnailResult.thumbnailPath
          : null,
        uploadedAt: new Date().toISOString(),
      },
      warnings: [...validation.warnings, ...metadataValidation.warnings],
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Erreur lors de l'upload:", error);

    return NextResponse.json(
      {
        error: "Erreur lors de l'upload du fichier",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const pieceId = searchParams.get("pieceId");
    const rubriqueId = searchParams.get("rubriqueId");
    const sousDossierId = searchParams.get("sousDossierId");

    if (!pieceId || !rubriqueId || !sousDossierId) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // TODO: Implémenter la récupération des informations du fichier
    // Pour l'instant, on retourne une réponse de base

    return NextResponse.json({
      success: true,
      data: {
        pieceId,
        rubriqueId,
        sousDossierId,
        message: "Fichier trouvé",
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du fichier:", error);

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération du fichier",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
