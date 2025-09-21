export interface SousDossier {
  id: string;
  titre: string;
  description: string;
  rubrique_id: string;
  statut?: string;
  documentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface SousDossierFormData {
  titre: string;
  description: string;
  rubrique_id: string;
  statut?: string;
}

export const sousDossiersService = {
  async getAllSousDossiersByRubrique(
    rubriqueId: string
  ): Promise<SousDossier[]> {
    try {
      const response = await fetch(
        `/api/sous-dossiers?rubriqueId=${rubriqueId}`
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des sous-dossiers");
      }

      const data = await response.json();
      return data.map((sousDossier: any) => ({
        id: sousDossier.id.toString(),
        titre: sousDossier.titre,
        description: sousDossier.description,
        rubrique_id: sousDossier.rubrique_id.toString(),
        statut: sousDossier.statut,
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
      const response = await fetch(`/api/sous-dossiers/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Erreur lors de la récupération du sous-dossier");
      }

      const data = await response.json();
      return {
        id: data.id.toString(),
        titre: data.titre,
        description: data.description,
        rubrique_id: data.rubrique_id.toString(),
        statut: data.statut,
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
      const response = await fetch("/api/sous-dossiers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          rubrique_id: sousDossierData.rubrique_id,
          titre: sousDossierData.titre,
          description: sousDossierData.description,
          statut: sousDossierData.statut || "ouvert",
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création du sous-dossier");
      }

      const data = await response.json();
      return {
        id: data.id.toString(),
        titre: data.titre,
        description: data.description,
        rubrique_id: data.rubrique_id.toString(),
        statut: data.statut,
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
      const response = await fetch(`/api/sous-dossiers/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(sousDossierData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la modification du sous-dossier");
      }

      const data = await response.json();
      return {
        id: data.id.toString(),
        titre: data.titre,
        description: data.description,
        rubrique_id: data.rubrique_id.toString(),
        statut: data.statut,
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
      const response = await fetch(`/api/sous-dossiers/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression du sous-dossier");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression du sous-dossier:", error);
      throw error;
    }
  },
};
