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
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const sousDossier = await prisma.sous_dossiers.findUnique({
      where: { id },
      include: {
        rubriques: true,
      },
    });

    if (!sousDossier) {
      return NextResponse.json(
        { message: "Sous-dossier non trouvé" },
        { status: 404 }
      );
    }

    return NextResponse.json(sousDossier);
  } catch (error) {
    console.error("Erreur lors de la récupération du sous-dossier:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Protection de la route
  const authResult = await protectRoute(req);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    const body = await req.json();
    const { titre, description, statut } = body;

    const sousDossier = await prisma.sous_dossiers.update({
      where: { id },
      data: {
        titre: titre || undefined,
        description: description || undefined,
        statut: statut || undefined,
        updated_at: new Date(),
      },
      include: {
        rubriques: true,
      },
    });

    return NextResponse.json(sousDossier);
  } catch (error) {
    console.error("Erreur lors de la modification du sous-dossier:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  // Protection de la route
  const authResult = await protectRoute(req);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { id: idParam } = await params;
    const id = parseInt(idParam);
    if (isNaN(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    await prisma.sous_dossiers.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Sous-dossier supprimé" });
  } catch (error) {
    console.error("Erreur lors de la suppression du sous-dossier:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
