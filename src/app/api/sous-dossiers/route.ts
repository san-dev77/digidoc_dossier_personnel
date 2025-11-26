import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
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

    // Récupérer les sous-dossiers avec leurs positions
    const { rows } = await query(
      `SELECT 
        sd.id,
        sd.rubrique_id,
        sd.titre,
        sd.description,
        sd.statut,
        sd.created_at,
        sd.updated_at,
        COALESCE(sdp.position, 999) as position
      FROM sous_dossiers sd
      LEFT JOIN sous_dossier_positions sdp ON sd.id = sdp.sous_dossier_id AND sdp.rubrique_id = $1
      WHERE sd.rubrique_id = $1
      ORDER BY COALESCE(sdp.position, 999) ASC, sd.id ASC`,
      [rubriqueId]
    );

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
