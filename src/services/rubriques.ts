import { Rubrique } from "@/types";

export const rubriquesService = {
  async getAllRubriques(): Promise<Rubrique[]> {
    try {
      const response = await fetch("/api/rubriques");
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des rubriques");
      }

      const data = await response.json();
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
      const response = await fetch(`/api/rubriques/${id}`);
      if (!response.ok) {
        if (response.status === 404) return null;
        throw new Error("Erreur lors de la récupération de la rubrique");
      }

      const data = await response.json();
      return {
        id: data.id.toString(),
        nom: data.nom,
        description: data.description,
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
      const response = await fetch("/api/rubriques", {
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
      const response = await fetch(`/api/rubriques/${id}`, {
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
      const response = await fetch(`/api/rubriques/${id}`, {
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
      const response = await fetch(
        `/api/rubriques/search?q=${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la recherche des rubriques");
      }

      const data = await response.json();
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
