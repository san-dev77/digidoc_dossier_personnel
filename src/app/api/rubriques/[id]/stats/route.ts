import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Protection de la route
  const authResult = await protectRoute(req);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { id } = await params;
    const rubriqueId = parseInt(id);

    // Compter les sous-dossiers
    const sousDossiersCount = await prisma.sous_dossiers.count({
      where: { rubrique_id: rubriqueId },
    });

    // Compter les pièces
    const piecesCount = await prisma.pieces.count({
      where: {
        sous_dossiers: {
          rubrique_id: rubriqueId,
        },
      },
    });

    // Compter les pièces avec métadonnées
    const piecesWithMetadataCount = await prisma.pieces.count({
      where: {
        sous_dossiers: {
          rubrique_id: rubriqueId,
        },
        has_meta: true,
      },
    });

    return NextResponse.json({
      sousDossiersCount,
      piecesCount,
      piecesWithMetadataCount,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération des statistiques:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
