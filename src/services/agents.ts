import { Agent } from "@/types";

const toAgent = (row: any): Agent => ({
  id: row.id?.toString(),
  matricule: row.matricule,
  nom: row.nom_complet || row.nom, // Utiliser nom_complet de la base
  prenom: "", // Plus utilisé, on garde pour compatibilité
  email: row.email || "",
  fonction: row.fonction || "",
  date_naissance: row.date_naissance || "",
  lieu_naissance: row.lieu_naissance || "",
  sexe: row.sexe as "M" | "F",
  situationMatrimoniale: (row.situation_matrimoniale ||
    row.situationMatrimoniale) as
    | "Célibataire"
    | "Marié(e)"
    | "Divorcé(e)"
    | "Veuf/Veuve",
  adresse: row.adresse || "",
  telephone: row.telephone || "",
  createdAt: row.created_at || row.createdAt || "",
  updatedAt: row.updated_at || row.updatedAt || "",
});

export const agentsService = {
  // Récupérer tous les agents
  async getAllAgents(): Promise<Agent[]> {
    try {
      const res = await fetch("/api/agents", { cache: "no-store" });
      if (!res.ok) throw new Error("Erreur API agents");
      const data = await res.json();
      return (data as any[]).map(toAgent);
    } catch (error) {
      console.error("Erreur lors de la récupération des agents:", error);
      throw error;
    }
  },

  // Récupérer un agent par ID
  async getAgentById(id: string): Promise<Agent | null> {
    try {
      const res = await fetch(`/api/agents?id=${encodeURIComponent(id)}`, {
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Erreur API agent");
      const data = await res.json();
      return data ? toAgent(data) : null;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'agent:", error);
      throw error;
    }
  },

  // Créer un nouvel agent
  async createAgent(
    agentData: Omit<Agent, "id" | "createdAt" | "updatedAt">
  ): Promise<Agent> {
    try {
      const res = await fetch("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          matricule: agentData.matricule,
          nom: agentData.nom,
          prenom: agentData.prenom,
          email: agentData.email,
          fonction: agentData.fonction,
          date_naissance: agentData.date_naissance,
          lieu_naissance: agentData.lieu_naissance,
          sexe: agentData.sexe,
          situation_matrimoniale: agentData.situationMatrimoniale,
          adresse: agentData.adresse,
          telephone: agentData.telephone,
        }),
      });
      if (!res.ok) throw new Error("Erreur création agent");
      const data = await res.json();
      return toAgent(data);
    } catch (error) {
      console.error("Erreur lors de la création de l'agent:", error);
      throw error;
    }
  },

  // Mettre à jour un agent
  async updateAgent(
    id: string,
    agentData: Partial<Omit<Agent, "id" | "createdAt" | "updatedAt">>
  ): Promise<Agent> {
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...agentData,
          situation_matrimoniale: agentData.situationMatrimoniale,
        }),
      });
      if (!res.ok) throw new Error("Erreur mise à jour agent");
      const data = await res.json();
      return toAgent(data);
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'agent:", error);
      throw error;
    }
  },

  // Supprimer un agent
  async deleteAgent(id: string): Promise<void> {
    try {
      const res = await fetch(`/api/agents/${encodeURIComponent(id)}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur suppression agent");
    } catch (error) {
      console.error("Erreur lors de la suppression de l'agent:", error);
      throw error;
    }
  },

  // Rechercher des agents
  async searchAgents(query: string): Promise<Agent[]> {
    try {
      const res = await fetch(
        `/api/agents/search?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error("Erreur recherche agents");
      const data = await res.json();
      return (data as any[]).map(toAgent);
    } catch (error) {
      console.error("Erreur lors de la recherche des agents:", error);
      throw error;
    }
  },
};
