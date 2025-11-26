import { NextRequest, NextResponse } from "next/server";
import { FileManager } from "@/services/storage/FileManager";
import { protectRoute } from "@/lib/auth/routeProtection";
import { createErrorResponse } from "@/lib/errors/safeError";

export async function POST(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

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

    return createErrorResponse(error, "Erreur lors du nettoyage", 500);
  }
}

export async function GET(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

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

    return createErrorResponse(error, "Erreur lors de la récupération des informations", 500);
  }
}
