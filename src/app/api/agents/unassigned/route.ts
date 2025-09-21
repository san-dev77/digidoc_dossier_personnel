import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    // Récupérer tous les agents qui n'ont pas de relation dans agent_rubriques
    const agents = await prisma.agents.findMany({
      where: {
        agent_rubriques: {
          none: {},
        },
      },
      orderBy: { created_at: "desc" },
    });

    // Transformer les données pour correspondre au format Agent
    const unassignedAgents = agents.map((agent) => ({
      id: agent.id.toString(),
      matricule: agent.matricule,
      nom_complet: agent.nom_complet, // Utiliser nom_complet de la base
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
    }));

    return NextResponse.json(unassignedAgents);
  } catch (error) {
    console.error(
      "Erreur lors de la récupération des agents non affectés:",
      error
    );
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
}
