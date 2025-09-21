import type { Agent } from "@/types";

export interface AgentRubrique {
  id: string;
  agent_id: string;
  rubrique_id: string;
  created_at: string;
  updated_at: string;
}

export interface AgentWithRubrique extends Agent {
  rubrique_id?: string;
  rubrique_nom?: string;
}

export const agentRubriqueService = {
  // Récupérer toutes les relations agent-rubrique
  async getAllAgentRubriques(): Promise<AgentRubrique[]> {
    try {
      const response = await fetch("/api/agent-rubriques");
      if (!response.ok) {
        throw new Error(
          "Erreur lors de la récupération des relations agent-rubrique"
        );
      }
      return await response.json();
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des relations agent-rubrique:",
        error
      );
      throw error;
    }
  },

  // Récupérer tous les agents avec leurs rubriques affectées
  async getAgentsWithRubriques(): Promise<AgentWithRubrique[]> {
    try {
      const response = await fetch("/api/agents/with-rubriques");
      if (!response.ok) {
        throw new Error(
          "Erreur lors de la récupération des agents avec rubriques"
        );
      }
      return await response.json();
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des agents avec rubriques:",
        error
      );
      throw error;
    }
  },

  // Affecter un agent à une rubrique
  async assignAgentToRubrique(
    agentId: string,
    rubriqueId: string
  ): Promise<AgentRubrique> {
    try {
      const response = await fetch("/api/agent-rubriques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          rubrique_id: rubriqueId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de l'affectation");
      }

      return await response.json();
    } catch (error) {
      console.error(
        "Erreur lors de l'affectation de l'agent à la rubrique:",
        error
      );
      throw error;
    }
  },

  // Retirer un agent d'une rubrique
  async removeAgentFromRubrique(
    agentId: string,
    rubriqueId: string
  ): Promise<void> {
    try {
      const response = await fetch(
        `/api/agent-rubriques?agentId=${agentId}&rubriqueId=${rubriqueId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur lors de la suppression");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de l'affectation:", error);
      throw error;
    }
  },

  // Récupérer les agents non affectés à une rubrique
  async getUnassignedAgents(): Promise<Agent[]> {
    try {
      const response = await fetch("/api/agents/unassigned");
      if (!response.ok) {
        throw new Error(
          "Erreur lors de la récupération des agents non affectés"
        );
      }
      return await response.json();
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des agents non affectés:",
        error
      );
      throw error;
    }
  },

  // Récupérer les agents affectés à une rubrique spécifique
  async getAgentsByRubrique(rubriqueId: string): Promise<AgentWithRubrique[]> {
    try {
      const response = await fetch(
        `/api/agent-rubriques?rubriqueId=${rubriqueId}`
      );
      if (!response.ok) {
        throw new Error(
          "Erreur lors de la récupération des agents par rubrique"
        );
      }
      const data = await response.json();
      return data.map((relation: any) => ({
        ...relation.agents,
        rubrique_id: relation.rubrique_id?.toString(),
        rubrique_nom: relation.rubriques?.nom,
      }));
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des agents par rubrique:",
        error
      );
      throw error;
    }
  },
};
