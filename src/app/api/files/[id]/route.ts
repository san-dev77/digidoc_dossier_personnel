import { NextRequest, NextResponse } from "next/server";
import { FileManager } from "@/services/storage/FileManager";
// FileValidator importé mais non utilisé - conservé pour usage futur
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";
import { createErrorResponse } from "@/lib/errors/safeError";
import path from "path";
import fs from "fs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const pieceFileId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    // Note: rubriqueId et sousDossierId peuvent être utilisés pour des validations futures
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rubriqueId = searchParams.get("rubriqueId");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sousDossierId = searchParams.get("sousDossierId");
    const type = searchParams.get("type") || "original"; // original, thumbnail, metadata

    // Récupérer les informations du fichier depuis la base de données
    const pieceFile = await prisma.piece_file.findUnique({
      where: { id: parseInt(pieceFileId) },
      include: {
        pieces: {
          include: {
            sous_dossiers: true,
          },
        },
      },
    });

    if (!pieceFile) {
      return NextResponse.json(
        { error: "Fichier non trouvé dans la base de données" },
        { status: 404 }
      );
    }

    // Utiliser le chemin direct du fichier depuis la base de données
    let filePath: string;

    // Déclarer les variables nécessaires
    let pieceId: string;
    let finalSousDossierId: string;
    let finalRubriqueId: string;

    switch (type) {
      case "thumbnail":
        // Construire le chemin du thumbnail
        pieceId = pieceFile.pieces.id.toString();
        finalSousDossierId = pieceFile.pieces.sous_dossiers.id.toString();
        finalRubriqueId = pieceFile.pieces.sous_dossiers.rubrique_id.toString();
        const basePath = path.join(
          process.cwd(),
          "uploads",
          "documents",
          "rubriques",
          finalRubriqueId,
          "sous-dossiers",
          finalSousDossierId,
          "pieces",
          pieceId,
          "thumbnails"
        );
        filePath = basePath;
        break;
      case "metadata":
        // Construire le chemin des métadonnées
        pieceId = pieceFile.pieces.id.toString();
        finalSousDossierId = pieceFile.pieces.sous_dossiers.id.toString();
        finalRubriqueId = pieceFile.pieces.sous_dossiers.rubrique_id.toString();
        const metaBasePath = path.join(
          process.cwd(),
          "uploads",
          "documents",
          "rubriques",
          finalRubriqueId,
          "sous-dossiers",
          finalSousDossierId,
          "pieces",
          pieceId,
          "metadata",
          `${pieceId}.json`
        );
        filePath = metaBasePath;
        break;
      case "original":
      default:
        // Utiliser le chemin direct du fichier (déjà absolu)
        filePath = pieceFile.file_path;
        break;
    }

    // Vérifier si le fichier existe
    const fileInfo = await FileManager.getFileInfo(filePath);

    if (!fileInfo.exists) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    // Lire le fichier
    const fileBuffer = await FileManager.readFile(filePath);

    // Déterminer le type MIME
    const mimeType = getMimeType(filePath);

    // Retourner le fichier
    // Convertir Buffer en Uint8Array pour NextResponse
    const fileArray = new Uint8Array(fileBuffer);
    return new NextResponse(fileArray, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600", // Cache 1 heure
        "Last-Modified": fileInfo.mtime.toUTCString(),
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du fichier:", error);

    return createErrorResponse(error, "Erreur lors de la récupération du fichier", 500);
  }
}

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
    const resolvedParams = await params;
    const pieceFileId = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    // Note: rubriqueId et sousDossierId peuvent être utilisés pour des validations futures
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const rubriqueId = searchParams.get("rubriqueId");
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const sousDossierId = searchParams.get("sousDossierId");

    // Récupérer les informations du fichier depuis la base de données
    const pieceFile = await prisma.piece_file.findUnique({
      where: { id: parseInt(pieceFileId) },
      include: {
        pieces: {
          include: {
            sous_dossiers: true,
          },
        },
      },
    });

    if (!pieceFile) {
      return NextResponse.json(
        { error: "Fichier non trouvé dans la base de données" },
        { status: 404 }
      );
    }

    // Supprimer le fichier de la base de données
    await prisma.piece_file.delete({
      where: { id: parseInt(pieceFileId) },
    });

    // Optionnel: Supprimer le fichier physique du système de fichiers
    try {
      const filePath = path.join(process.cwd(), pieceFile.file_path);
      await fs.promises.unlink(filePath);
    } catch (error) {
      console.warn("Impossible de supprimer le fichier physique:", error);
    }

    return NextResponse.json({
      success: true,
      message: "Fichier supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du fichier:", error);

    return createErrorResponse(error, "Erreur lors de la suppression du fichier", 500);
  }
}

function getMimeType(filePath: string): string {
  const ext = path.extname(filePath).toLowerCase();

  const mimeTypes: { [key: string]: string } = {
    ".pdf": "application/pdf",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".png": "image/png",
    ".gif": "image/gif",
    ".webp": "image/webp",
    ".doc": "application/msword",
    ".docx":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ".xls": "application/vnd.ms-excel",
    ".xlsx":
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ".txt": "text/plain",
    ".csv": "text/csv",
    ".json": "application/json",
  };

  return mimeTypes[ext] || "application/octet-stream";
}
