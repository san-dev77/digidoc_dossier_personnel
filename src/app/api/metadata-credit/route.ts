import { NextRequest, NextResponse } from "next/server";
import { MetadataService } from "@/services/metadata";
import { protectRoute } from "@/lib/auth/routeProtection";
import { createErrorResponse } from "@/lib/errors/safeError";

export async function GET(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get("action");
    const sousDossierId = searchParams.get("sous_dossier_id");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");

    switch (action) {
      case "by-sous-dossier":
        if (!sousDossierId) {
          return NextResponse.json(
            {
              success: false,
              message: "Paramètre sous_dossier_id requis",
            },
            { status: 400 }
          );
        }
        const result = await MetadataService.getMetadataBySousDossierServer(
          parseInt(sousDossierId)
        );
        return NextResponse.json(result);

      case "all":
        const allResult = await MetadataService.getAllMetadata(page, limit);
        return NextResponse.json(allResult);

      case "stats":
        const statsResult = await MetadataService.getMetadataStats();
        return NextResponse.json(statsResult);

      default:
        const defaultResult = await MetadataService.getAllMetadata(page, limit);
        return NextResponse.json(defaultResult);
    }
  } catch (error: unknown) {
    return createErrorResponse(error, "Erreur lors de la récupération des métadonnées", 500);
  }
}

export async function POST(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "create":
        const createResult = await MetadataService.createMetadataServer(data);
        return NextResponse.json(createResult);

      case "search":
        const searchTerm = data.searchTerm;
        if (!searchTerm) {
          return NextResponse.json(
            {
              success: false,
              message: "Terme de recherche requis",
            },
            { status: 400 }
          );
        }
        const searchResult = await MetadataService.searchMetadata(searchTerm);
        return NextResponse.json(searchResult);

      default:
        return NextResponse.json(
          {
            success: false,
            message: "Action non reconnue",
          },
          { status: 400 }
        );
    }
  } catch (error: unknown) {
    return createErrorResponse(error, "Erreur lors de la création/recherche de métadonnées", 500);
  }
}
