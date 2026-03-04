import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";

export async function GET(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const metadataCreditId = searchParams.get("metadata_credit_id");

    if (!metadataCreditId) {
      return NextResponse.json(
        { success: false, message: "metadata_credit_id requis" },
        { status: 400 }
      );
    }

    const values = await prisma.meta_credit_values.findMany({
      where: {
        metadata_credit_id: parseInt(metadataCreditId),
      },
      include: {
        metadata_credit: {
          select: {
            nom_meta: true,
            type_meta: true,
          },
        },
      },
      orderBy: {
        created_at: "desc",
      },
    });

    return NextResponse.json({
      success: true,
      message: `${values.length} valeur(s) trouvée(s)`,
      data: values,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la récupération des valeurs:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const body = await request.json();
    const { metadata_credit_id, valeur } = body;

    if (!metadata_credit_id || !valeur) {
      return NextResponse.json(
        { success: false, message: "metadata_credit_id et valeur requis" },
        { status: 400 }
      );
    }

    // Créer une nouvelle valeur (pas de vérification d'existence)
    const result = await prisma.meta_credit_values.create({
      data: {
        metadata_credit_id: parseInt(metadata_credit_id),
        valeur,
      },
      include: {
        metadata_credit: {
          select: {
            nom_meta: true,
            type_meta: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Valeur sauvegardée avec succès",
      data: result,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la sauvegarde:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const body = await request.json();
    const { id, valeur } = body;

    if (!id || !valeur) {
      return NextResponse.json(
        { success: false, message: "id et valeur requis" },
        { status: 400 }
      );
    }

    const result = await prisma.meta_credit_values.update({
      where: { id: parseInt(id) },
      data: {
        valeur,
        updated_at: new Date(),
      },
      include: {
        metadata_credit: {
          select: {
            nom_meta: true,
            type_meta: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      message: "Valeur mise à jour avec succès",
      data: result,
    });
  } catch (error) {
    console.error("❌ Erreur lors de la mise à jour:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { success: false, message: "ID requis" },
        { status: 400 }
      );
    }

    await prisma.meta_credit_values.delete({
      where: {
        id: parseInt(id),
      },
    });

    return NextResponse.json({
      success: true,
      message: "Valeur supprimée avec succès",
    });
  } catch (error) {
    console.error("❌ Erreur lors de la suppression:", error);
    return NextResponse.json(
      { success: false, message: "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}
