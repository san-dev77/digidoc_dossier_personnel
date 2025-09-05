import { supabase } from "@/lib/supabase";
import type {
  Piece,
  PieceFormData,
  PieceWithMetadata,
  MetadataModel,
} from "@/types";

export const piecesService = {
  async getAllPiecesBySousDossier(sousDossierId: string): Promise<Piece[]> {
    try {
      const { data, error } = await supabase
        .from("pieces")
        .select("*")
        .eq("sous_dossier_id", sousDossierId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((piece) => ({
        id: piece.id,
        sousDossierId: piece.sous_dossier_id,
        nom: piece.nom,
        description: piece.description,
        statut: piece.statut,
        aMetadonnees: piece.has_meta || false,
        createdAt: piece.created_at,
        updatedAt: piece.updated_at,
      }));
    } catch (error) {
      console.error("Erreur lors du chargement des pièces:", error);
      throw error;
    }
  },

  async getAllPiecesByRubrique(rubriqueId: string): Promise<Piece[]> {
    try {
      const { data, error } = await supabase
        .from("pieces")
        .select(
          `
          *,
          sous_dossiers!inner(rubrique_id)
        `
        )
        .eq("sous_dossiers.rubrique_id", rubriqueId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return data.map((piece) => ({
        id: piece.id,
        sousDossierId: piece.sous_dossier_id,
        nom: piece.nom,
        description: piece.description,
        statut: piece.statut,
        aMetadonnees: piece.has_meta || false,
        createdAt: piece.created_at,
        updatedAt: piece.updated_at,
      }));
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
      // Création de l'enregistrement en base
      const { data, error } = await supabase
        .from("pieces")
        .insert({
          sous_dossier_id: sousDossierId,
          nom: formData.nom,
          description: formData.description,
          has_meta: formData.has_meta,
        })
        .select()
        .single();

      if (error) throw error;

      // Créer les métadonnées si elles existent
      if (
        formData.has_meta &&
        formData.metadonnees &&
        formData.metadonnees.length > 0
      ) {
        const metadataToInsert = formData.metadonnees.map((meta) => ({
          piece_id: data.id,
          libelle: meta.nom,
          type: meta.type,
          obligatoire: meta.obligatoire,
          description: meta.description,
        }));

        const { error: metadataError } = await supabase
          .from("metadata_model")
          .insert(metadataToInsert);

        if (metadataError) {
          console.error(
            "Erreur lors de la création des métadonnées:",
            metadataError
          );
          // On continue même si les métadonnées échouent
        }
      }

      return {
        id: data.id,
        sousDossierId: data.sous_dossier_id,
        nom: data.nom,
        description: data.description,
        aMetadonnees: data.has_meta || false,
        createdAt: data.created_at,
      };
    } catch (error) {
      console.error("Erreur lors de la création de la pièce:", error);
      throw error;
    }
  },

  async updatePiece(id: string, updates: Partial<Piece>): Promise<Piece> {
    try {
      const { data, error } = await supabase
        .from("pieces")
        .update({
          nom: updates.nom,
          updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        sousDossierId: data.sous_dossier_id,
        nom: data.nom,
        description: data.description,
        aMetadonnees: data.has_meta || false,
        createdAt: data.created_at,
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
      // Récupérer les pièces
      const { data: pieces, error: piecesError } = await supabase
        .from("pieces")
        .select("*")
        .eq("sous_dossier_id", sousDossierId)
        .order("created_at", { ascending: false });

      if (piecesError) throw piecesError;

      // Pour chaque pièce, récupérer ses métadonnées si elle en a
      const piecesWithMetadata = await Promise.all(
        pieces.map(async (piece) => {
          let metadonnees: MetadataModel[] = [];

          if (piece.has_meta) {
            const { data: metadata, error: metadataError } = await supabase
              .from("metadata_model")
              .select("*")
              .eq("piece_id", piece.id);

            if (!metadataError && metadata) {
              metadonnees = metadata.map((meta) => ({
                id: meta.id,
                nom: meta.libelle,
                type: meta.type,
                obligatoire: meta.obligatoire,
                description: meta.description,
                createdAt: meta.created_at,
                updatedAt: meta.updated_at,
              }));
            }
          }

          return {
            id: piece.id,
            sousDossierId: piece.sous_dossier_id,
            nom: piece.nom,
            description: piece.description,
            aMetadonnees: piece.has_meta || false,
            createdAt: piece.created_at,
            metadonnees,
          };
        })
      );

      return piecesWithMetadata;
    } catch (error) {
      console.error(
        "Erreur lors du chargement des pièces avec métadonnées:",
        error
      );
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
