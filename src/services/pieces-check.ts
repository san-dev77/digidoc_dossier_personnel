import type { PieceCheck } from "@/types";

export interface PieceCheckFormData {
  piece_id: string;
  disponible: boolean;
  agent_id: string;
}

export const piecesCheckService = {
  async updatePieceAvailability(data: PieceCheckFormData): Promise<PieceCheck> {
    try {
      const response = await fetch("/api/pieces-check", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la disponibilité");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de la disponibilité:",
        error
      );
      throw error;
    }
  },

  async getPieceChecks(
    agentId?: string,
    pieceId?: string
  ): Promise<PieceCheck[]> {
    try {
      const params = new URLSearchParams();
      if (agentId) params.append("agent_id", agentId);
      if (pieceId) params.append("piece_id", pieceId);

      const response = await fetch(`/api/pieces-check?${params.toString()}`);
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des vérifications");
      }

      const result = await response.json();
      return result.data;
    } catch (error) {
      console.error("Erreur lors de la récupération des vérifications:", error);
      throw error;
    }
  },

  async getPiecesWithAvailabilityStatus(
    agentId: string
  ): Promise<Map<string, PieceCheck>> {
    try {
      // Récupérer toutes les pièces avec leurs statuts de disponibilité
      const checks = await this.getPieceChecks(agentId);

      // Créer un map pour accéder rapidement aux vérifications par piece_id
      const checksMap = new Map<string, PieceCheck>();
      checks.forEach((check) => {
        if (
          !checksMap.has(check.piece_id) ||
          new Date(check.date_check) >
            new Date(checksMap.get(check.piece_id)?.date_check || "0")
        ) {
          checksMap.set(check.piece_id, check);
        }
      });

      return checksMap;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des pièces avec statut:",
        error
      );
      return new Map();
    }
  },
};
