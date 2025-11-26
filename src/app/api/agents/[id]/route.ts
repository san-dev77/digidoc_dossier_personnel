import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";
import { createErrorResponse } from "@/lib/errors/safeError";

export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const body = await req.json();
    const params = await Promise.resolve(context.params);
    const id = parseInt(params.id);

    console.log("[UPDATE AGENT] ID:", id);
    console.log("[UPDATE AGENT] Body:", body);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "ID invalide" },
        { status: 400 }
      );
    }

    // Préparer les données avec conversion de date
    interface AgentUpdateData {
      matricule: string;
      nom_complet: string;
      email: string | null;
      fonction: string | null;
      lieu_naissance: string | null;
      sexe: string | null;
      situation_matrimoniale: string | null;
      adresse: string | null;
      telephone: string | null;
      updated_at: Date;
      date_naissance?: Date;
    }

    const dataToUpdate: AgentUpdateData = {
      matricule: body.matricule,
      nom_complet: body.nom_complet,
      email: body.email ?? null,
      fonction: body.fonction ?? null,
      lieu_naissance: body.lieu_naissance ?? null,
      sexe: body.sexe ?? null,
      situation_matrimoniale: body.situation_matrimoniale ?? null,
      adresse: body.adresse ?? null,
      telephone: body.telephone ?? null,
      updated_at: new Date(),
    };

    // Convertir la date de naissance si elle existe
    if (body.date_naissance) {
      dataToUpdate.date_naissance = new Date(body.date_naissance);
    }

    console.log("[UPDATE AGENT] Data to update:", dataToUpdate);

    const updated = await prisma.agents.update({
      where: { id },
      data: dataToUpdate,
    });

    console.log("[UPDATE AGENT] Success:", updated.id);
    return NextResponse.json(updated);
  } catch (error) {
    console.error("[UPDATE AGENT] Erreur:", error);
    return createErrorResponse(error, "Erreur lors de la mise à jour de l'agent", 500);
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  // Protection de la route
  const authResult = await protectRoute(req);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    const params = await Promise.resolve(context.params);
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json(
        { message: "ID invalide" },
        { status: 400 }
      );
    }

    await prisma.agents.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Agent supprimé" });
  } catch (error) {
    console.error("Erreur lors de la suppression de l'agent:", error);
    return NextResponse.json(
      { message: "Erreur serveur" },
      { status: 500 }
    );
  }
}

