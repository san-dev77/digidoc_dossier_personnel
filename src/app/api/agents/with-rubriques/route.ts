import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const agents = await prisma.agents.findMany({
      include: {
        agent_rubriques: {
          include: {
            rubriques: true,
          },
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Transformer les données pour avoir un format plus simple
    const agentsWithRubriques = agents.map((agent) => ({
      id: agent.id.toString(),
      matricule: agent.matricule,
      nom: agent.nom_complet, // Utiliser nom_complet de la base
      prenom: "", // Vide maintenant
      email: agent.email || "",
      fonction: agent.fonction || "",
      date_naissance: agent.date_naissance?.toISOString().split("T")[0] || "",
      lieu_naissance: agent.lieu_naissance || "",
      sexe: agent.sexe as "M" | "F",
      situationMatrimoniale: agent.situation_matrimoniale as
        | "Célibataire"
        | "Marié(e)"
        | "Divorcé(e)"
        | "Veuf/Veuve",
      adresse: agent.adresse || "",
      telephone: agent.telephone || "",
      createdAt: agent.created_at?.toISOString() || "",
      updatedAt: agent.updated_at?.toISOString() || "",
      rubrique_id: agent.agent_rubriques?.[0]?.rubrique_id?.toString() || null,
      rubrique_nom: agent.agent_rubriques?.[0]?.rubriques?.nom || null,
    }));

    return NextResponse.json(agentsWithRubriques);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des agents avec rubriques:",
      error
    );
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
