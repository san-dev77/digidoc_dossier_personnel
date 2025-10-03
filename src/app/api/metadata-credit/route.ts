import { NextRequest, NextResponse } from "next/server";
import { MetadataService } from "@/services/metadata";

export async function GET(request: NextRequest) {
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
        const result = await MetadataService.getMetadataBySousDossier(
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
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inconnue est survenue";
    return NextResponse.json(
      {
        success: false,
        message: `Erreur: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    switch (action) {
      case "create":
        const createResult = await MetadataService.createMetadata(data);
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
    const errorMessage =
      error instanceof Error
        ? error.message
        : "Une erreur inconnue est survenue";
    return NextResponse.json(
      {
        success: false,
        message: `Erreur: ${errorMessage}`,
      },
      { status: 500 }
    );
  }
}
