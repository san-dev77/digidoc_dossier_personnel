export interface AgentDossier {
  id: string;
  agent_id: string;
  rubrique_id: string;
  sous_dossier_id: string;
  created_at: string;
}

export const agentDossiersService = {
  /**
   * Créer une entrée agent_dossiers
   */
  async createAgentDossier(
    agentId: string,
    rubriqueId: string,
    sousDossierId: string
  ): Promise<AgentDossier> {
    try {
      const response = await fetch("/api/agent-dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: agentId,
          rubrique_id: rubriqueId,
          sous_dossier_id: sousDossierId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur création agent_dossier");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la création de agent_dossier:", error);
      throw error;
    }
  },

  /**
   * Récupérer tous les agent_dossiers
   */
  async getAllAgentDossiers(): Promise<AgentDossier[]> {
    try {
      const response = await fetch("/api/agent-dossiers");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des agent_dossiers");
      }
      return await response.json();
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des agent_dossiers:",
        error
      );
      throw error;
    }
  },

  /**
   * Récupérer les dossiers d'un agent spécifique
   */
  async getAgentDossiersByAgent(agentId: string): Promise<AgentDossier[]> {
    try {
      const response = await fetch(`/api/agent-dossiers?agentId=${agentId}`);
      if (!response.ok) {
        throw new Error(
          "Erreur lors de la récupération des dossiers de l'agent"
        );
      }
      return await response.json();
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des dossiers de l'agent:",
        error
      );
      throw error;
    }
  },

  /**
   * Supprimer une entrée agent_dossiers
   */
  async deleteAgentDossier(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/agent-dossiers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Erreur suppression agent_dossier");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de agent_dossier:", error);
      throw error;
    }
  },
};

