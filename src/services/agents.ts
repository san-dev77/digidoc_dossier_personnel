import { supabase } from "@/lib/supabase";
import { Agent } from "@/types";

export const agentsService = {
  // Récupérer tous les agents
  async getAllAgents(): Promise<Agent[]> {
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Transformer les données pour correspondre au type Agent
      return data.map((agent: any) => ({
        id: agent.id.toString(),
        matricule: agent.matricule,
        nom: agent.nom,
        prenom: agent.prenom,
        fonction: agent.fonction || "",
        dateNaissance: agent.date_naissance || "",
        lieuNaissance: agent.lieu_naissance || "",
        sexe: agent.sexe as "M" | "F",
        situationMatrimoniale: agent.situation_matrimoniale as
          | "Célibataire"
          | "Marié(e)"
          | "Divorcé(e)"
          | "Veuf/Veuve",
        adresse: agent.adresse || "",
        telephone: agent.telephone || "",
        createdAt: agent.created_at || "",
        updatedAt: agent.updated_at || "",
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des agents:", error);
      throw error;
    }
  },

  // Récupérer un agent par ID
  async getAgentById(id: string): Promise<Agent | null> {
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id.toString(),
        matricule: data.matricule,
        nom: data.nom,
        prenom: data.prenom,
        fonction: data.fonction || "",
        dateNaissance: data.date_naissance || "",
        lieuNaissance: data.lieu_naissance || "",
        sexe: data.sexe as "M" | "F",
        situationMatrimoniale: data.situation_matrimoniale as
          | "Célibataire"
          | "Marié(e)"
          | "Divorcé(e)"
          | "Veuf/Veuve",
        adresse: data.adresse || "",
        telephone: data.telephone || "",
        createdAt: data.created_at || "",
        updatedAt: data.updated_at || "",
      };
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
      const { data, error } = await supabase
        .from("agents")
        .insert([
          {
            matricule: agentData.matricule,
            nom: agentData.nom,
            prenom: agentData.prenom,
            fonction: agentData.fonction,
            date_naissance: agentData.dateNaissance,
            lieu_naissance: agentData.lieuNaissance,
            sexe: agentData.sexe,
            situation_matrimoniale: agentData.situationMatrimoniale,
            adresse: agentData.adresse,
            telephone: agentData.telephone,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id.toString(),
        matricule: data.matricule,
        nom: data.nom,
        prenom: data.prenom,
        fonction: data.fonction || "",
        dateNaissance: data.date_naissance || "",
        lieuNaissance: data.lieu_naissance || "",
        sexe: data.sexe as "M" | "F",
        situationMatrimoniale: data.situation_matrimoniale as
          | "Célibataire"
          | "Marié(e)"
          | "Divorcé(e)"
          | "Veuf/Veuve",
        adresse: data.adresse || "",
        telephone: data.telephone || "",
        createdAt: data.created_at || "",
        updatedAt: data.updated_at || "",
      };
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
      const updateData: any = {};

      if (agentData.matricule) updateData.matricule = agentData.matricule;
      if (agentData.nom) updateData.nom = agentData.nom;
      if (agentData.prenom) updateData.prenom = agentData.prenom;
      if (agentData.fonction) updateData.fonction = agentData.fonction;
      if (agentData.dateNaissance)
        updateData.date_naissance = agentData.dateNaissance;
      if (agentData.lieuNaissance)
        updateData.lieu_naissance = agentData.lieuNaissance;
      if (agentData.sexe) updateData.sexe = agentData.sexe;
      if (agentData.situationMatrimoniale)
        updateData.situation_matrimoniale = agentData.situationMatrimoniale;
      if (agentData.adresse) updateData.adresse = agentData.adresse;
      if (agentData.telephone) updateData.telephone = agentData.telephone;

      const { data, error } = await supabase
        .from("agents")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id.toString(),
        matricule: data.matricule,
        nom: data.nom,
        prenom: data.prenom,
        fonction: data.fonction || "",
        dateNaissance: data.date_naissance || "",
        lieuNaissance: data.lieu_naissance || "",
        sexe: data.sexe as "M" | "F",
        situationMatrimoniale: data.situation_matrimoniale as
          | "Célibataire"
          | "Marié(e)"
          | "Divorcé(e)"
          | "Veuf/Veuve",
        adresse: data.adresse || "",
        telephone: data.telephone || "",
        createdAt: data.created_at || "",
        updatedAt: data.updated_at || "",
      };
    } catch (error) {
      console.error("Erreur lors de la mise à jour de l'agent:", error);
      throw error;
    }
  },

  // Supprimer un agent
  async deleteAgent(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("agents").delete().eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Erreur lors de la suppression de l'agent:", error);
      throw error;
    }
  },

  // Rechercher des agents
  async searchAgents(query: string): Promise<Agent[]> {
    try {
      const { data, error } = await supabase
        .from("agents")
        .select("*")
        .or(
          `nom.ilike.%${query}%,prenom.ilike.%${query}%,matricule.ilike.%${query}%,fonction.ilike.%${query}%`
        )
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((agent: any) => ({
        id: agent.id.toString(),
        matricule: agent.matricule,
        nom: agent.nom,
        prenom: agent.prenom,
        fonction: agent.fonction || "",
        dateNaissance: agent.date_naissance || "",
        lieuNaissance: agent.lieu_naissance || "",
        sexe: agent.sexe as "M" | "F",
        situationMatrimoniale: agent.situation_matrimoniale as
          | "Célibataire"
          | "Marié(e)"
          | "Divorcé(e)"
          | "Veuf/Veuve",
        adresse: agent.adresse || "",
        telephone: agent.telephone || "",
        createdAt: agent.created_at || "",
        updatedAt: agent.updated_at || "",
      }));
    } catch (error) {
      console.error("Erreur lors de la recherche des agents:", error);
      throw error;
    }
  },
};
