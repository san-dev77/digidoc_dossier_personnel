import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const rubriques = await prisma.rubriques.findMany({
      orderBy: { nom: "asc" },
    });

    // Ajouter les champs created_at et updated_at pour compatibilité
    const rubriquesWithTimestamps = rubriques.map((rubrique) => ({
      ...rubrique,
      created_at: null,
      updated_at: null,
    }));

    return NextResponse.json(rubriquesWithTimestamps);
  } catch (error) {
    console.error("Erreur lors de la récupération des rubriques:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { nom, description } = body;

    if (!nom) {
      return NextResponse.json(
        { message: "Le nom est requis" },
        { status: 400 }
      );
    }

    const rubrique = await prisma.rubriques.create({
      data: {
        nom,
        description: description || null,
      },
    });

    // Ajouter les champs created_at et updated_at pour compatibilité
    const rubriqueWithTimestamps = {
      ...rubrique,
      created_at: null,
      updated_at: null,
    };

    return NextResponse.json(rubriqueWithTimestamps, { status: 201 });
  } catch (error) {
    console.error("Erreur lors de la création de la rubrique:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
