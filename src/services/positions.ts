import { fetchWithAuth } from "@/lib/api/fetchWithAuth";

export interface SousDossierPosition {
  id: number;
  sous_dossier_id: number;
  position: number;
  rubrique_id: number;
  titre?: string;
  description?: string;
}

export interface PiecePosition {
  id: number;
  piece_id: number;
  position: number;
  sous_dossier_id: number;
  nom?: string;
  description?: string;
}

export const positionsService = {
  /**
   * Récupère les positions des sous-dossiers pour une rubrique
   */
  async getSousDossierPositions(
    rubriqueId: string
  ): Promise<SousDossierPosition[]> {
    try {
      const response = await fetchWithAuth(
        `/api/sous-dossiers/positions?rubriqueId=${rubriqueId}`
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des positions");
      }
      const data = await response.json();
      return data.positions || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des positions:", error);
      return [];
    }
  },

  /**
   * Met à jour les positions des sous-dossiers
   */
  async updateSousDossierPositions(
    rubriqueId: string,
    positions: { sousDossierId: number; position: number }[]
  ): Promise<void> {
    try {
      const response = await fetchWithAuth("/api/sous-dossiers/positions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rubriqueId, positions }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour des positions");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des positions:", error);
      throw error;
    }
  },

  /**
   * Récupère les positions des pièces pour un sous-dossier
   */
  async getPiecePositions(sousDossierId: string): Promise<PiecePosition[]> {
    try {
      const response = await fetchWithAuth(
        `/api/pieces/positions?sousDossierId=${sousDossierId}`
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des positions");
      }
      const data = await response.json();
      return data.positions || [];
    } catch (error) {
      console.error("Erreur lors de la récupération des positions:", error);
      return [];
    }
  },

  /**
   * Met à jour les positions des pièces
   */
  async updatePiecePositions(
    sousDossierId: string,
    positions: { pieceId: number; position: number }[]
  ): Promise<void> {
    try {
      const response = await fetchWithAuth("/api/pieces/positions", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sousDossierId, positions }),
      });
      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour des positions");
      }
    } catch (error) {
      console.error("Erreur lors de la mise à jour des positions:", error);
      throw error;
    }
  },
};

