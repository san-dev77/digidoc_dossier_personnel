import type {
  Piece,
  PieceFormData,
  PieceWithMetadata,
  MetadataModel,
} from "@/types";

export const piecesService = {
  async getAllPiecesBySousDossier(sousDossierId: string): Promise<Piece[]> {
    try {
      const response = await fetch(
        `/api/pieces?sousDossierId=${sousDossierId}`
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des pièces");
      }

      const data = await response.json();
      return data.map((piece: Piece) => ({
        id: piece.id.toString(),
        sousDossierId: piece.sousDossierId,
        nom: piece.nom,
        description: piece.description,
        aMetadonnees: piece.aMetadonnees,
        createdAt: piece.createdAt,
        updatedAt: piece.updatedAt,
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des pièces:", error);
      throw error;
    }
  },

  async getAllPiecesByRubrique(rubriqueId: string): Promise<Piece[]> {
    try {
      // Pour l'instant, on retourne un tableau vide car cette fonctionnalité
      // nécessiterait une jointure complexe. On peut l'implémenter plus tard si nécessaire.
      return [];
    } catch (error) {
      console.error("Erreur lors du chargement des pièces:", error);
      throw error;
    }
  },

  async createPiece(
    sousDossierId: string,
    formData: PieceFormData
  ): Promise<Piece> {
    try {
      // Créer l'enregistrement en base via l'API pieces (sans fichier)
      const response = await fetch("/api/pieces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sous_dossier_id: sousDossierId,
          nom: formData.nom,
          description: formData.description,
          has_meta: formData.has_meta,
          metadonnees: formData.metadonnees,
          // Pas de fichier au niveau des rubriques
          filePath: null,
          fileName: null,
          fileSize: null,
          mimeType: null,
        }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la création de la pièce");
      }

      const data = await response.json();
      return {
        id: data.id.toString(),
        sousDossierId: data.sousDossierId,
        nom: data.nom,
        description: data.description,
        aMetadonnees: data.aMetadonnees,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      console.error("Erreur lors de la création de la pièce:", error);
      throw error;
    }
  },

  async updatePiece(id: string, updates: Partial<Piece>): Promise<Piece> {
    try {
      console.log("🔧 Service updatePiece - ID:", id);
      console.log("📝 Service updatePiece - Updates:", updates);

      const response = await fetch(`/api/pieces/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      console.log("📡 Réponse API:", response.status, response.statusText);

      if (!response.ok) {
        throw new Error("Erreur lors de la mise à jour de la pièce");
      }

      const data = await response.json();
      return {
        id: data.id.toString(),
        sousDossierId: data.sousDossierId,
        nom: data.nom,
        description: data.description,
        aMetadonnees: data.aMetadonnees,
        createdAt: data.createdAt,
        updatedAt: data.updatedAt,
      };
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la pièce:", error);
      throw error;
    }
  },

  async getPiecesWithMetadata(
    sousDossierId: string
  ): Promise<PieceWithMetadata[]> {
    try {
      const response = await fetch(
        `/api/pieces?sousDossierId=${sousDossierId}`
      );
      if (!response.ok) {
        throw new Error("Erreur lors de la récupération des pièces");
      }

      const data = await response.json();
      return data.map((piece: any) => ({
        id: piece.id.toString(),
        sousDossierId: piece.sousDossierId,
        nom: piece.nom,
        description: piece.description,
        aMetadonnees: piece.aMetadonnees,
        createdAt: piece.createdAt,
        updatedAt: piece.updatedAt,
        metadonnees: piece.metadonnees || [],
      }));
    } catch (error) {
      console.error(
        "Erreur lors du chargement des pièces avec métadonnées:",
        error
      );
      throw error;
    }
  },

  async deletePiece(id: string): Promise<void> {
    try {
      const response = await fetch(`/api/pieces/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erreur lors de la suppression de la pièce");
      }
    } catch (error) {
      console.error("Erreur lors de la suppression de la pièce:", error);
      throw error;
    }
  },

  // async downloadPiece(piece: Piece): Promise<void> {
  //   try {
  //     const { data, error } = await supabase.storage
  //       .from("documents")
  //       .download(piece.lienFichier);

  //     if (error) throw error;

  //     const url = URL.createObjectURL(data);
  //     const a = document.createElement("a");
  //     a.href = url;
  //     a.download = piece.nom;
  //     document.body.appendChild(a);
  //     a.click();
  //     document.body.removeChild(a);
  //     URL.revokeObjectURL(url);
  //   } catch (error) {
  //     console.error("Erreur lors du téléchargement:", error);
  //     throw error;
  //   }
  // },
};
