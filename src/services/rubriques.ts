import { supabase } from "@/lib/supabase";
import { Rubrique } from "@/types";

export const rubriquesService = {
  async getAllRubriques(): Promise<Rubrique[]> {
    try {
      const { data, error } = await supabase
        .from("rubriques")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((rubrique: any) => ({
        id: rubrique.id.toString(),
        nom: rubrique.nom,
        description: rubrique.description,
        createdAt: rubrique.created_at || "",
        updatedAt: rubrique.updated_at || "",
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des rubriques:", error);
      throw error;
    }
  },

  async getRubriqueById(id: string): Promise<Rubrique | null> {
    try {
      const { data, error } = await supabase
        .from("rubriques")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        id: data.id.toString(),
        nom: data.nom,
        description: data.description,
        couleur: data.couleur,
        createdAt: data.created_at || "",
        updatedAt: data.updated_at || "",
      };
    } catch (error) {
      console.error("Erreur lors de la récupération de la rubrique:", error);
      return null;
    }
  },

  async createRubrique(
    rubriqueData: Omit<Rubrique, "id" | "createdAt" | "updatedAt">
  ): Promise<Rubrique> {
    try {
      const { data, error } = await supabase
        .from("rubriques")
        .insert([
          {
            nom: rubriqueData.nom,
            description: rubriqueData.description,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id.toString(),
        nom: data.nom,
        description: data.description,
        couleur: data.couleur,
        createdAt: data.created_at || "",
        updatedAt: data.updated_at || "",
      };
    } catch (error) {
      console.error("Erreur lors de la création de la rubrique:", error);
      throw error;
    }
  },

  async updateRubrique(
    id: string,
    rubriqueData: Partial<Omit<Rubrique, "id" | "createdAt" | "updatedAt">>
  ): Promise<Rubrique> {
    try {
      const updateData: any = {};

      if (rubriqueData.nom) updateData.nom = rubriqueData.nom;
      if (rubriqueData.description)
        updateData.description = rubriqueData.description;

      const { data, error } = await supabase
        .from("rubriques")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id.toString(),
        nom: data.nom,
        description: data.description,
        couleur: data.couleur,
        createdAt: data.created_at || "",
        updatedAt: data.updated_at || "",
      };
    } catch (error) {
      console.error("Erreur lors de la modification de la rubrique:", error);
      throw error;
    }
  },

  async deleteRubrique(id: string): Promise<void> {
    try {
      const { error } = await supabase.from("rubriques").delete().eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Erreur lors de la suppression de la rubrique:", error);
      throw error;
    }
  },

  async searchRubriques(query: string): Promise<Rubrique[]> {
    try {
      const { data, error } = await supabase
        .from("rubriques")
        .select("*")
        .or(`nom.ilike.%${query}%,description.ilike.%${query}%`)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((rubrique: any) => ({
        id: rubrique.id.toString(),
        nom: rubrique.nom,
        description: rubrique.description,
        createdAt: rubrique.created_at || "",
        updatedAt: rubrique.updated_at || "",
      }));
    } catch (error) {
      console.error("Erreur lors de la recherche des rubriques:", error);
      throw error;
    }
  },
};
