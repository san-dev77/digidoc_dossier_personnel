import { NextRequest, NextResponse } from "next/server";
import { MetadataService } from "@/services/metadata";
import { protectRoute } from "@/lib/auth/routeProtection";
import { createErrorResponse } from "@/lib/errors/safeError";

export async function GET(
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
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID invalide",
        },
        { status: 400 }
      );
    }

    const result = await MetadataService.getMetadataById(id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return createErrorResponse(error, "Erreur lors de la récupération de la métadonnée", 500);
  }
}

export async function PUT(
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
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID invalide",
        },
        { status: 400 }
      );
    }

    const body = await request.json();
    const result = await MetadataService.updateMetadata(id, body);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return createErrorResponse(error, "Erreur lors de la mise à jour de la métadonnée", 500);
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
    const id = parseInt(resolvedParams.id);
    if (isNaN(id)) {
      return NextResponse.json(
        {
          success: false,
          message: "ID invalide",
        },
        { status: 400 }
      );
    }

    const result = await MetadataService.deleteMetadata(id);
    return NextResponse.json(result);
  } catch (error: unknown) {
    return createErrorResponse(error, "Erreur lors de la suppression de la métadonnée", 500);
  }
}
