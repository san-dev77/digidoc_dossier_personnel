import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET /api/pieces/[id]/files
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const pieceId = parseInt(idParam);

    if (isNaN(pieceId)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    console.log("📁 Récupération des fichiers pour la pièce ID:", pieceId);

    // Récupérer les fichiers de la pièce
    const files = await (prisma as any).piece_file.findMany({
      where: {
        id_piece: pieceId,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    console.log("✅ Fichiers récupérés:", files.length);

    // Transformer les données pour le frontend
    const filesData = files.map((file: any) => ({
      id: file.id.toString(),
      id_piece: file.id_piece.toString(),
      file_path: file.file_path,
      created_at: file.created_at.toISOString(),
    }));

    return NextResponse.json(filesData);
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des fichiers:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// POST /api/pieces/[id]/files
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const pieceId = parseInt(idParam);

    if (isNaN(pieceId)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const body = await request.json();
    const { file_path } = body;

    if (!file_path) {
      return NextResponse.json(
        { message: "file_path est requis" },
        { status: 400 }
      );
    }

    console.log("📁 Ajout d'un fichier pour la pièce ID:", pieceId);
    console.log("📋 Chemin du fichier:", file_path);

    // Vérifier que la pièce existe
    const piece = await prisma.pieces.findUnique({
      where: { id: pieceId },
    });

    if (!piece) {
      return NextResponse.json(
        { message: "Pièce non trouvée" },
        { status: 404 }
      );
    }

    // Créer le fichier
    const file = await (prisma as any).piece_file.create({
      data: {
        id_piece: pieceId,
        file_path: file_path,
      },
    });

    console.log("✅ Fichier créé:", file);

    return NextResponse.json({
      id: file.id.toString(),
      id_piece: file.id_piece.toString(),
      file_path: file.file_path,
      created_at: file.created_at.toISOString(),
    });
  } catch (error) {
    console.error("❌ Erreur lors de la création du fichier:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

// DELETE /api/pieces/[id]/files
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const pieceId = parseInt(idParam);

    if (isNaN(pieceId)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const { searchParams } = new URL(request.url);
    const fileId = searchParams.get("file_id");

    if (!fileId) {
      return NextResponse.json(
        { message: "file_id est requis" },
        { status: 400 }
      );
    }

    console.log("🗑️ Suppression du fichier ID:", fileId);

    // Supprimer le fichier
    await (prisma as any).piece_file.delete({
      where: { id: parseInt(fileId) },
    });

    console.log("✅ Fichier supprimé");

    return NextResponse.json({
      message: "Fichier supprimé avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression du fichier:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
