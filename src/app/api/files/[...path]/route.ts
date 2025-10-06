import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";

export async function GET(
  request: NextRequest,
  { params }: { params: { path: string[] } }
) {
  try {
    // Reconstituer le chemin du fichier
    const filePath = params.path.join("/");
    const fullPath = path.join(process.cwd(), "uploads", filePath);

    // Vérifier que le fichier existe
    if (!fs.existsSync(fullPath)) {
      return NextResponse.json(
        { error: "Fichier non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que c'est bien un fichier (pas un dossier)
    const stats = fs.statSync(fullPath);
    if (!stats.isFile()) {
      return NextResponse.json(
        { error: "Le chemin ne pointe pas vers un fichier" },
        { status: 400 }
      );
    }

    // Lire le fichier
    const fileBuffer = fs.readFileSync(fullPath);

    // Déterminer le type MIME
    const ext = path.extname(fullPath).toLowerCase();
    let contentType = "application/octet-stream";

    switch (ext) {
      case ".pdf":
        contentType = "application/pdf";
        break;
      case ".jpg":
      case ".jpeg":
        contentType = "image/jpeg";
        break;
      case ".png":
        contentType = "image/png";
        break;
      case ".gif":
        contentType = "image/gif";
        break;
      case ".webp":
        contentType = "image/webp";
        break;
      case ".svg":
        contentType = "image/svg+xml";
        break;
      case ".txt":
        contentType = "text/plain";
        break;
      case ".md":
        contentType = "text/markdown";
        break;
      case ".html":
        contentType = "text/html";
        break;
      case ".css":
        contentType = "text/css";
        break;
      case ".js":
        contentType = "application/javascript";
        break;
      case ".json":
        contentType = "application/json";
        break;
    }

    // Retourner le fichier avec les bons headers
    return new NextResponse(fileBuffer, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": fileBuffer.length.toString(),
        "Cache-Control": "public, max-age=3600", // Cache pendant 1 heure
      },
    });
  } catch (error) {
    console.error("Erreur lors de la lecture du fichier:", error);
    return NextResponse.json(
      { error: "Erreur lors de la lecture du fichier" },
      { status: 500 }
    );
  }
}
