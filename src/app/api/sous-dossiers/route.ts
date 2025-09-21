import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rubriqueId = searchParams.get("rubriqueId");

    let whereClause: any = {};
    if (rubriqueId) {
      whereClause.rubrique_id = parseInt(rubriqueId);
    }

    const sousDossiers = await prisma.sous_dossiers.findMany({
      where: whereClause,
      include: {
        rubriques: true,
      },
      orderBy: { created_at: "desc" },
    });

    return NextResponse.json(sousDossiers);
  } catch (error) {
    console.error("Erreur lors de la récupération des sous-dossiers:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
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


