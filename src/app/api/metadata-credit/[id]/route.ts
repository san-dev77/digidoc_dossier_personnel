import { NextRequest, NextResponse } from "next/server";
import { MetadataService } from "@/services/metadata";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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
