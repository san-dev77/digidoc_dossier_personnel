import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";

/**
 * GET /api/pieces/positions?sousDossierId=xxx
 * Récupère les positions des pièces pour un sous-dossier
 */
export async function GET(request: NextRequest) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const sousDossierId = searchParams.get("sousDossierId");

    if (!sousDossierId) {
      return NextResponse.json(
        { message: "sousDossierId est requis" },
        { status: 400 }
      );
    }

    const rows = await prisma.piece_positions.findMany({
      where: { sous_dossier_id: Number(sousDossierId) },
      select: {
        id: true,
        piece_id: true,
        position: true,
        sous_dossier_id: true,
        pieces: { select: { nom: true, description: true } },
      },
      orderBy: [{ position: "asc" }, { piece_id: "asc" }],
    });

    // On aplatit la relation pour conserver le format de réponse historique
    // (nom/description au même niveau que la position).
    const positions = rows.map(({ pieces, ...position }) => ({
      ...position,
      nom: pieces.nom,
      description: pieces.description,
    }));

    return NextResponse.json({ positions }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des positions:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PUT /api/pieces/positions
 * Met à jour les positions des pièces
 * Body: { sousDossierId: number, positions: [{ pieceId: number, position: number }] }
 */
export async function PUT(request: NextRequest) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const body = await request.json();
    const { sousDossierId, positions } = body;

    if (!sousDossierId || !Array.isArray(positions)) {
      return NextResponse.json(
        { message: "sousDossierId et positions sont requis" },
        { status: 400 }
      );
    }

    const sousDossierIdNum = Number(sousDossierId);

    const valides = positions.filter(
      (pos) => pos?.pieceId && typeof pos.position === "number"
    );

    // `$transaction` garantit réellement l'atomicité : la version précédente
    // envoyait BEGIN/COMMIT via un pool, donc chaque requête partait sur une
    // connexion différente et la transaction ne couvrait rien.
    await prisma.$transaction(async (tx) => {
      // Supprimer les anciennes positions pour ce sous-dossier
      await tx.piece_positions.deleteMany({
        where: { sous_dossier_id: sousDossierIdNum },
      });

      // Insérer les nouvelles positions. `piece_id` est unique globalement :
      // si la pièce était positionnée dans un autre sous-dossier, on rattache
      // la ligne existante plutôt que de violer la contrainte.
      for (const pos of valides) {
        await tx.piece_positions.upsert({
          where: { piece_id: Number(pos.pieceId) },
          create: {
            sous_dossier_id: sousDossierIdNum,
            piece_id: Number(pos.pieceId),
            position: pos.position,
            updated_at: new Date(),
          },
          update: {
            sous_dossier_id: sousDossierIdNum,
            position: pos.position,
            updated_at: new Date(),
          },
        });
      }
    });

    return NextResponse.json(
      { message: "Positions mises à jour avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur lors de la mise à jour des positions:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
