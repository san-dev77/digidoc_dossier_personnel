import { supabase } from "@/lib/supabase";

export interface SousDossier {
  id: string;
  titre: string;
  description: string;
  rubrique_id: string;
  documentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SousDossierFormData {
  titre: string;
  description: string;
  rubrique_id: string;
}

export const sousDossiersService = {
  async getAllSousDossiersByRubrique(
    rubriqueId: string
  ): Promise<SousDossier[]> {
    try {
      const { data, error } = await supabase
        .from("sous_dossiers")
        .select("*")
        .eq("rubrique_id", rubriqueId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((sousDossier: any) => ({
        id: sousDossier.id.toString(),
        titre: sousDossier.titre,
        description: sousDossier.description,
        rubrique_id: sousDossier.rubrique_id.toString(),
        createdAt: sousDossier.created_at || "",
        updatedAt: sousDossier.updated_at || "",
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des sous-dossiers:", error);
      throw error;
    }
  },

  async getSousDossierById(id: string): Promise<SousDossier | null> {
    try {
      const { data, error } = await supabase
        .from("sous_dossiers")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;

      return {
        id: data.id.toString(),
        titre: data.titre,
        description: data.description,
        rubrique_id: data.rubrique_id.toString(),
        createdAt: data.created_at || "",
        updatedAt: data.updated_at || "",
      };
    } catch (error) {
      console.error("Erreur lors de la récupération du sous-dossier:", error);
      return null;
    }
  },

  async createSousDossier(
    sousDossierData: SousDossierFormData
  ): Promise<SousDossier> {
    try {
      const { data, error } = await supabase
        .from("sous_dossiers")
        .insert([
          {
            titre: sousDossierData.titre,
            description: sousDossierData.description,
            rubrique_id: sousDossierData.rubrique_id,
          },
        ])
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id.toString(),
        titre: data.titre,
        description: data.description,
        rubrique_id: data.rubrique_id.toString(),
        createdAt: data.created_at || "",
        updatedAt: data.updated_at || "",
      };
    } catch (error) {
      console.error("Erreur lors de la création du sous-dossier:", error);
      throw error;
    }
  },

  async updateSousDossier(
    id: string,
    sousDossierData: Partial<
      Omit<SousDossier, "id" | "createdAt" | "updatedAt">
    >
  ): Promise<SousDossier> {
    try {
      const updateData: any = {};

      if (sousDossierData.titre) updateData.titre = sousDossierData.titre;
      if (sousDossierData.description)
        updateData.description = sousDossierData.description;

      const { data, error } = await supabase
        .from("sous_dossiers")
        .update(updateData)
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id.toString(),
        titre: data.titre,
        description: data.description,
        rubrique_id: data.rubrique_id.toString(),
        createdAt: data.created_at || "",
        updatedAt: data.updated_at || "",
      };
    } catch (error) {
      console.error("Erreur lors de la modification du sous-dossier:", error);
      throw error;
    }
  },

  async deleteSousDossier(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from("sous_dossiers")
        .delete()
        .eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Erreur lors de la suppression du sous-dossier:", error);
      throw error;
    }
  },
};
