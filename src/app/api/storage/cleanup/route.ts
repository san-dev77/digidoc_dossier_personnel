import { NextRequest, NextResponse } from "next/server";
import { FileManager } from "@/services/storage/FileManager";

export async function POST(request: NextRequest) {
  try {
    // Nettoyer les fichiers temporaires
    await FileManager.cleanupTempFiles();

    return NextResponse.json({
      success: true,
      message: "Nettoyage des fichiers temporaires terminé",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Erreur lors du nettoyage:", error);

    return NextResponse.json(
      {
        error: "Erreur lors du nettoyage",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    // Retourner des informations sur l'état du stockage
    const tempDir = process.cwd() + "/uploads/temp";
    const documentsDir = process.cwd() + "/uploads/documents";

    // TODO: Implémenter la récupération des statistiques de stockage
    // Pour l'instant, on retourne une réponse de base

    return NextResponse.json({
      success: true,
      data: {
        tempDir,
        documentsDir,
        message: "Informations de stockage récupérées",
      },
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des informations:", error);

    return NextResponse.json(
      {
        error: "Erreur lors de la récupération des informations",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
