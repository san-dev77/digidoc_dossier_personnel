import { Agent, AgentFormData } from "@/types";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";

interface AgentRow {
  id?: number | string;
  matricule: string;
  nom_complet?: string;
  nom?: string;
  email?: string;
  fonction?: string;
  date_naissance?: string | Date;
  lieu_naissance?: string;
  sexe?: string;
  situation_matrimoniale?: string;
  situationMatrimoniale?: string;
  adresse?: string;
  telephone?: string;
  created_at?: string | Date;
  createdAt?: string | Date;
  updated_at?: string | Date;
  updatedAt?: string | Date;
}

const toAgent = (row: AgentRow): Agent => {
  const formatDate = (date: string | Date | undefined): string => {
    if (!date) return "";
    if (typeof date === "string") return date;
    return date.toISOString();
  };

  return {
    id: row.id?.toString() || "",
    matricule: row.matricule,
    nom: row.nom_complet || row.nom || "", // Utiliser nom_complet de la base
    prenom: "", // Plus utilisé, on garde pour compatibilité
    email: row.email || "",
    fonction: row.fonction || "",
    date_naissance: formatDate(row.date_naissance),
    lieu_naissance: row.lieu_naissance || "",
    sexe: (row.sexe as "M" | "F") || "M",
    situationMatrimoniale: (row.situation_matrimoniale ||
      row.situationMatrimoniale) as
      | "Célibataire"
      | "Marié(e)"
      | "Divorcé(e)"
      | "Veuf/Veuve",
    adresse: row.adresse || "",
    telephone: row.telephone || "",
    createdAt: formatDate(row.created_at || row.createdAt),
    updatedAt: formatDate(row.updated_at || row.updatedAt),
  };
};

export const agentsService = {
  // Récupérer tous les agents
  async getAllAgents(): Promise<Agent[]> {
    try {
      const res = await fetchWithAuth("/api/agents", { cache: "no-store" });
      if (!res.ok) throw new Error("Erreur API agents");
      const data: AgentRow[] = await res.json();
      return data.map(toAgent);
    } catch (error) {
      console.error("Erreur lors de la récupération des agents:", error);
      throw error;
    }
  },

  // Récupérer un agent par ID
  async getAgentById(id: string): Promise<Agent | null> {
    try {
      const res = await fetchWithAuth(`/api/agents?id=${encodeURIComponent(id)}`, {
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

  // Créer un nouvel agent (sans password - géré dans utilisateurs)
  async createAgent(agentData: AgentFormData): Promise<Agent> {
    try {
      console.log("[Service] Create agent data:", agentData);

      const payload = {
        matricule: agentData.matricule,
        nom_complet: agentData.nom_complet,
        email: agentData.email,
        fonction: agentData.fonction,
        date_naissance: agentData.date_naissance,
        lieu_naissance: agentData.lieu_naissance,
        sexe: agentData.sexe,
        situation_matrimoniale: agentData.situationMatrimoniale,
        adresse: agentData.adresse,
        telephone: agentData.telephone,
      };

      console.log("[Service] Payload to send:", payload);

      const res = await fetchWithAuth("/api/agents", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("[Service] Create API Error:", errorData);
        throw new Error(errorData.message || "Erreur création agent");
      }

      const data = await res.json();
      console.log("[Service] Created agent:", data);
      return toAgent(data);
    } catch (error) {
      console.error("Erreur lors de la création de l'agent:", error);
      throw error;
    }
  },

  // Mettre à jour un agent
  async updateAgent(
    id: string,
    agentData: Partial<AgentFormData>
  ): Promise<Agent> {
    try {
      console.log("[Service] Update agent ID:", id);
      console.log("[Service] Update data:", agentData);

      const payload = {
        matricule: agentData.matricule,
        nom_complet: agentData.nom_complet,
        email: agentData.email,
        fonction: agentData.fonction,
        date_naissance: agentData.date_naissance,
        lieu_naissance: agentData.lieu_naissance,
        sexe: agentData.sexe,
        situation_matrimoniale: agentData.situationMatrimoniale,
        adresse: agentData.adresse,
        telephone: agentData.telephone,
      };

      console.log("[Service] Payload to send:", payload);

      const res = await fetchWithAuth(`/api/agents/${encodeURIComponent(id)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const errorData = await res.json();
        console.error("[Service] API Error:", errorData);
        throw new Error(errorData.detail || "Erreur mise à jour agent");
      }

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
      const res = await fetchWithAuth(`/api/agents/${encodeURIComponent(id)}`, {
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
      const res = await fetchWithAuth(
        `/api/agents/search?q=${encodeURIComponent(query)}`
      );
      if (!res.ok) throw new Error("Erreur recherche agents");
      const data: AgentRow[] = await res.json();
      return data.map(toAgent);
    } catch (error) {
      console.error("Erreur lors de la recherche des agents:", error);
      throw error;
    }
  },
};
