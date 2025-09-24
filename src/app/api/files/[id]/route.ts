import { NextRequest, NextResponse } from "next/server";
import { FileManager } from "@/services/storage/FileManager";
import { FileValidator } from "@/services/validation/FileValidator";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pieceId = params.id;
    const { searchParams } = new URL(request.url);
    const rubriqueId = searchParams.get("rubriqueId");
    const sousDossierId = searchParams.get("sousDossierId");
    const type = searchParams.get("type") || "original"; // original, thumbnail, metadata

    if (!rubriqueId || !sousDossierId) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Construire le chemin du fichier
    const basePath = path.join(
      process.cwd(),
      "uploads",
      "documents",
      "rubriques",
      rubriqueId,
      "sous-dossiers",
      sousDossierId,
      "pieces",
      pieceId
    );

    let filePath: string;

    switch (type) {
      case "thumbnail":
        filePath = path.join(basePath, "thumbnails");
        break;
      case "metadata":
        filePath = path.join(basePath, "metadata", `${pieceId}.json`);
        break;
      case "original":
      default:
        filePath = path.join(basePath, "original");
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
    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": mimeType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600", // Cache 1 heure
        "Last-Modified": fileInfo.mtime.toUTCString(),
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pieceId = params.id;
    const { searchParams } = new URL(request.url);
    const rubriqueId = searchParams.get("rubriqueId");
    const sousDossierId = searchParams.get("sousDossierId");

    if (!rubriqueId || !sousDossierId) {
      return NextResponse.json(
        { error: "Paramètres manquants" },
        { status: 400 }
      );
    }

    // Supprimer le fichier
    await FileManager.deleteFile(rubriqueId, sousDossierId, pieceId);

    return NextResponse.json({
      success: true,
      message: "Fichier supprimé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors de la suppression du fichier:", error);

    return NextResponse.json(
      {
        error: "Erreur lors de la suppression du fichier",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
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
