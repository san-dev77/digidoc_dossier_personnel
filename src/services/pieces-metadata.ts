import type { MetaValue } from "@/types";

export interface PieceMetadata {
  id: string;
  meta_model_id: string;
  valeur: string;
  created_at: string;
  metadataModel?: {
    libelle: string;
    type: string;
    obligatoire: boolean;
  };
}

export const piecesMetadataService = {
  async getPieceMetadata(pieceId: string): Promise<PieceMetadata[]> {
    try {
      const response = await fetch(`/api/pieces/${pieceId}/metadata`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des métadonnées");
      }
      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la récupération des métadonnées:", error);
      return [];
    }
  },

  async createPieceMetadata(
    pieceId: string,
    metaModelId: string,
    valeur: string
  ): Promise<PieceMetadata> {
    try {
      const response = await fetch(`/api/pieces/${pieceId}/metadata`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta_model_id: metaModelId,
          valeur: valeur,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création de la métadonnée");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la création de la métadonnée:", error);
      throw error;
    }
  },

  async updatePieceMetadata(
    pieceId: string,
    metaValueId: string,
    valeur: string
  ): Promise<PieceMetadata> {
    try {
      const response = await fetch(`/api/pieces/${pieceId}/metadata`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          meta_value_id: metaValueId,
          valeur: valeur,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la métadonnée");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la métadonnée:", error);
      throw error;
    }
  },

  async deletePieceMetadata(
    pieceId: string,
    metaValueId: string
  ): Promise<{ hasRemainingMetadata: boolean }> {
    try {
      const response = await fetch(
        `/api/pieces/${pieceId}/metadata?meta_value_id=${metaValueId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la métadonnée");
      }

      return await response.json();
    } catch (error) {
      console.error("Erreur lors de la suppression de la métadonnée:", error);
      throw error;
    }
  },
};
