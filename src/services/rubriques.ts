import { Rubrique } from "@/types";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";

export const rubriquesService = {
  async getAllRubriques(): Promise<Rubrique[]> {
    try {
      const response = await fetchWithAuth("/api/rubriques");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des rubriques");
      }

      interface RubriqueRow {
        id: number | string;
        nom: string;
        description?: string | null;
        created_at?: string | Date;
        updated_at?: string | Date;
      }

      const data: RubriqueRow[] = await response.json();
      return data.map((rubrique) => ({
        id: rubrique.id.toString(),
        nom: rubrique.nom,
        description: rubrique.description || "",
        created_at: rubrique.created_at
          ? typeof rubrique.created_at === "string"
            ? rubrique.created_at
            : rubrique.created_at.toString()
          : "",
        updatedAt: rubrique.updated_at
          ? typeof rubrique.updated_at === "string"
            ? rubrique.updated_at
            : rubrique.updated_at.toString()
          : "",
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des rubriques:", error);
      throw error;
    }
  },

  async getRubriqueById(id: string): Promise<Rubrique | null> {
    try {
      const response = await fetchWithAuth(`/api/rubriques/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Erreur lors de la récupération de la rubrique");
      }

      const data = await response.json();
      return {
        id: data.id.toString(),
        nom: data.nom,
        description: data.description,
        created_at: data.created_at || "",
        updatedAt: data.updated_at || "",
      };
    } catch (error) {
      console.error("Erreur lors de la récupération de la rubrique:", error);
      return null;
    }
  },

  async createRubrique(
    rubriqueData: Omit<Rubrique, "id" | "created_at" | "updatedAt">
  ): Promise<Rubrique> {
    try {
      const response = await fetchWithAuth("/api/rubriques", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nom: rubriqueData.nom,
          description: rubriqueData.description,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création de la rubrique");
      }

      const data = await response.json();
      return {
        id: data.id.toString(),
        nom: data.nom,
        description: data.description,
        created_at: data.created_at || "",
        updatedAt: data.updated_at || "",
      };
    } catch (error) {
      console.error("Erreur lors de la création de la rubrique:", error);
      throw error;
    }
  },

  async updateRubrique(
    id: string,
    rubriqueData: Partial<Omit<Rubrique, "id" | "created_at" | "updatedAt">>
  ): Promise<Rubrique> {
    try {
      const response = await fetchWithAuth(`/api/rubriques/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(rubriqueData),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la modification de la rubrique");
      }

      const data = await response.json();
      return {
        id: data.id.toString(),
        nom: data.nom,
        description: data.description,
        created_at: data.created_at || "",
        updatedAt: data.updated_at || "",
      };
    } catch (error) {
      console.error("Erreur lors de la modification de la rubrique:", error);
      throw error;
    }
  },

  async deleteRubrique(id: string): Promise<void> {
    try {
      const response = await fetchWithAuth(`/api/rubriques/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la rubrique");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la rubrique:", error);
      throw error;
    }
  },

  async searchRubriques(query: string): Promise<Rubrique[]> {
    try {
      const response = await fetchWithAuth(
        `/api/rubriques/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la recherche des rubriques");
      }

      interface RubriqueRow {
        id: number | string;
        nom: string;
        description?: string | null;
        created_at?: string | Date;
        updated_at?: string | Date;
      }

      const data: RubriqueRow[] = await response.json();
      return data.map((rubrique) => ({
        id: rubrique.id.toString(),
        nom: rubrique.nom,
        description: rubrique.description || "",
        created_at: rubrique.created_at
          ? typeof rubrique.created_at === "string"
            ? rubrique.created_at
            : rubrique.created_at.toString()
          : "",
        updatedAt: rubrique.updated_at
          ? typeof rubrique.updated_at === "string"
            ? rubrique.updated_at
            : rubrique.updated_at.toString()
          : "",
      }));
    } catch (error) {
      console.error("Erreur lors de la recherche des rubriques:", error);
      throw error;
    }
  },

  async getRubriqueStats(rubriqueId: string): Promise<{
    sousDossiersCount: number;
    piecesCount: number;
    piecesWithMetadataCount: number;
  }> {
    try {
      const response = await fetchWithAuth(`/api/rubriques/${rubriqueId}/stats`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des statistiques");
      }

      const data = await response.json();
      return {
        sousDossiersCount: data.sousDossiersCount || 0,
        piecesCount: data.piecesCount || 0,
        piecesWithMetadataCount: data.piecesWithMetadataCount || 0,
      };
    } catch (error) {
      console.error("Erreur lors de la récupération des statistiques:", error);
      return {
        sousDossiersCount: 0,
        piecesCount: 0,
        piecesWithMetadataCount: 0,
      };
    }
  },
};
