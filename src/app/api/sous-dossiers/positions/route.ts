import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";

/**
 * GET /api/sous-dossiers/positions?rubriqueId=xxx
 * Récupère les positions des sous-dossiers pour une rubrique
 */
export async function GET(request: NextRequest) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const rubriqueId = searchParams.get("rubriqueId");

    if (!rubriqueId) {
      return NextResponse.json(
        { message: "rubriqueId est requis" },
        { status: 400 }
      );
    }

    const rows = await prisma.sous_dossier_positions.findMany({
      where: { rubrique_id: Number(rubriqueId) },
      select: {
        id: true,
        sous_dossier_id: true,
        position: true,
        rubrique_id: true,
        sous_dossiers: { select: { titre: true, description: true } },
      },
      orderBy: [{ position: "asc" }, { sous_dossier_id: "asc" }],
    });

    // On aplatit la relation pour conserver le format de réponse historique
    // (titre/description au même niveau que la position).
    const positions = rows.map(({ sous_dossiers, ...position }) => ({
      ...position,
      titre: sous_dossiers.titre,
      description: sous_dossiers.description,
    }));

    return NextResponse.json({ positions }, { status: 200 });
  } catch (error) {
    console.error("Erreur lors de la récupération des positions:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

/**
 * PUT /api/sous-dossiers/positions
 * Met à jour les positions des sous-dossiers
 * Body: { rubriqueId: number, positions: [{ sousDossierId: number, position: number }] }
 */
export async function PUT(request: NextRequest) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const body = await request.json();
    const { rubriqueId, positions } = body;

    if (!rubriqueId || !Array.isArray(positions)) {
      return NextResponse.json(
        { message: "rubriqueId et positions sont requis" },
        { status: 400 }
      );
    }

    const rubriqueIdNum = Number(rubriqueId);

    const valides = positions.filter(
      (pos) => pos?.sousDossierId && typeof pos.position === "number"
    );

    // `$transaction` garantit réellement l'atomicité : la version précédente
    // envoyait BEGIN/COMMIT via un pool, donc chaque requête partait sur une
    // connexion différente et la transaction ne couvrait rien.
    await prisma.$transaction(async (tx) => {
      // Supprimer les anciennes positions pour cette rubrique
      await tx.sous_dossier_positions.deleteMany({
        where: { rubrique_id: rubriqueIdNum },
      });

      // `sous_dossier_id` est unique globalement : si le sous-dossier était
      // positionné dans une autre rubrique, on rattache la ligne existante
      // plutôt que de violer la contrainte.
      for (const pos of valides) {
        await tx.sous_dossier_positions.upsert({
          where: { sous_dossier_id: Number(pos.sousDossierId) },
          create: {
            rubrique_id: rubriqueIdNum,
            sous_dossier_id: Number(pos.sousDossierId),
            position: pos.position,
            updated_at: new Date(),
          },
          update: {
            rubrique_id: rubriqueIdNum,
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
