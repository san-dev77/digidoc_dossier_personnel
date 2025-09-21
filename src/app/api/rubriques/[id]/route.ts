import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const rubrique = await prisma.rubriques.findUnique({
      where: { id },
    });

    if (!rubrique) {
      return NextResponse.json(
        { message: "Rubrique non trouvée" },
        { status: 404 }
      );
    }

    // Ajouter les champs created_at et updated_at pour compatibilité
    const rubriqueWithTimestamps = {
      ...rubrique,
      created_at: null,
      updated_at: null,
    };

    return NextResponse.json(rubriqueWithTimestamps);
  } catch (error) {
    console.error("Erreur lors de la récupération de la rubrique:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const body = await req.json();
    const { nom, description } = body;

    const rubrique = await prisma.rubriques.update({
      where: { id },
      data: {
        nom: nom || undefined,
        description: description || undefined,
      },
    });

    // Ajouter les champs created_at et updated_at pour compatibilité
    const rubriqueWithTimestamps = {
      ...rubrique,
      created_at: null,
      updated_at: null,
    };

    return NextResponse.json(rubriqueWithTimestamps);
  } catch (error) {
    console.error("Erreur lors de la modification de la rubrique:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    await prisma.rubriques.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Rubrique supprimée" });
  } catch (error) {
    console.error("Erreur lors de la suppression de la rubrique:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
