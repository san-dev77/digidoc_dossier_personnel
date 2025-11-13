import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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
    const dataToUpdate: any = {
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
  } catch (error: any) {
    console.error("[UPDATE AGENT] Erreur:", error);
    console.error("[UPDATE AGENT] Stack:", error.stack);
    return NextResponse.json(
      { message: "Erreur serveur", detail: error.message },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
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

