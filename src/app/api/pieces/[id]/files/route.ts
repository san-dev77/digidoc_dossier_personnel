import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const pieceId = parseInt(params.id);

    if (isNaN(pieceId)) {
      return NextResponse.json(
        { message: "ID de pièce invalide" },
        { status: 400 }
      );
    }

    // Récupérer les fichiers de la pièce
    const files = await prisma.piece_file.findMany({
      where: {
        id_piece: pieceId,
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json(files);
  } catch (error) {
    console.error("Erreur lors de la récupération des fichiers:", error);
    return NextResponse.json(
      { message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
