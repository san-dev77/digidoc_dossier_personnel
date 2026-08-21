import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";

export async function GET(req: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(req);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(req.url);
    const rubriqueId = searchParams.get("rubriqueId");

    if (!rubriqueId) {
      return NextResponse.json(
        { message: "rubriqueId est requis" },
        { status: 400 }
      );
    }

    const rubriqueIdNum = Number(rubriqueId);

    // Récupérer les sous-dossiers avec leurs positions
    const sousDossiers = await prisma.sous_dossiers.findMany({
      where: { rubrique_id: rubriqueIdNum },
      select: {
        id: true,
        rubrique_id: true,
        titre: true,
        description: true,
        statut: true,
        created_at: true,
        updated_at: true,
        position: { select: { position: true, rubrique_id: true } },
      },
    });

    // Équivalent du COALESCE(sdp.position, 999) : une position rattachée à une
    // autre rubrique ne compte pas, le sous-dossier est renvoyé en fin de liste.
    const rows = sousDossiers
      .map(({ position, ...sousDossier }) => ({
        ...sousDossier,
        position:
          position && position.rubrique_id === rubriqueIdNum
            ? position.position
            : 999,
      }))
      .sort((a, b) => a.position - b.position || a.id - b.id);

    return NextResponse.json(rows);
  } catch (error) {
    console.error("Erreur lors de la récupération des sous-dossiers:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(req);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const body = await req.json();
    const { rubrique_id, titre, description, statut } = body;

    if (!rubrique_id || !titre) {
      return NextResponse.json(
        { message: "rubrique_id et titre sont requis" },
        { status: 400 }
      );
    }

    const sousDossier = await prisma.sous_dossiers.create({
      data: {
        rubrique_id: parseInt(rubrique_id),
        titre,
        description: description || null,
        statut: statut || "ouvert",
      },
      include: {
        rubriques: true,
      },
    });

    return NextResponse.json(sousDossier, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création du sous-dossier:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
