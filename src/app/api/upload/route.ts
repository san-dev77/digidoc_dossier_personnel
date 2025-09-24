import { NextRequest, NextResponse } from "next/server";
import { FileManager } from "@/services/storage/FileManager";
import { ThumbnailService } from "@/services/storage/ThumbnailService";
import { FileValidator } from "@/services/validation/FileValidator";
import { storageConfig } from "@/config/storage";

export async function POST(request: NextRequest) {
  try {
    // Récupérer les données du formulaire
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const rubriqueId = formData.get("rubriqueId") as string;
    const sousDossierId = formData.get("sousDossierId") as string;
    const nom = formData.get("nom") as string;
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

    // Générer un ID unique pour la pièce
    const pieceId = crypto.randomUUID();

    // Sauvegarder le fichier
    const { filePath, fileName, fileSize } = await FileManager.saveFile(
      fileBuffer,
      rubriqueId,
      sousDossierId,
      pieceId,
      file.name
    );

    // Générer un thumbnail
    const thumbnailPath = filePath
      .replace("original", "thumbnails")
      .replace(/\.[^/.]+$/, "_thumb.jpg");
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
