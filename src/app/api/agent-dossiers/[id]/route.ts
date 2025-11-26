import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { protectRoute } from "@/lib/auth/routeProtection";

// DELETE - Supprimer un agent_dossier
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> | { id: string } }
) {
  // Protection de la route
  const authResult = await protectRoute(request);
  if (!authResult.authorized) {
    return authResult.response!;
  }

  try {
    // Gérer les params qui peuvent être une Promise (Next.js 15)
    const params = await Promise.resolve(context.params);
    const id = parseInt(params.id);

    if (isNaN(id)) {
      return NextResponse.json({ message: "ID invalide" }, { status: 400 });
    }

    await prisma.agent_dossiers.delete({
      where: { id },
    });

    return NextResponse.json(
      { message: "Agent_dossier supprimé avec succès" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Erreur DELETE /api/agent-dossiers/[id]:", error);
    return NextResponse.json(
      { message: "Erreur lors de la suppression de l'agent_dossier" },
      { status: 500 }
    );
  }
}
