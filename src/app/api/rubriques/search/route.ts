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
    const query = searchParams.get("q");

    if (!query) {
      return NextResponse.json(
        { message: "Paramètre de recherche requis" },
        { status: 400 }
      );
    }

    const rubriques = await prisma.rubriques.findMany({
      where: {
        OR: [
          {
            nom: {
              contains: query,
              mode: "insensitive",
            },
          },
          {
            description: {
              contains: query,
              mode: "insensitive",
            },
          },
        ],
      },
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
    console.error("Erreur lors de la recherche des rubriques:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
