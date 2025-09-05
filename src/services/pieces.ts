import { supabase } from "@/lib/supabase";

export interface Piece {
  id: string;
  sousDossierId: string;
  nom: string;
  lienFichier: string;
  typeFichier: string;
  tailleFichier: number;
  dateAjout: string;
  statut: "valide" | "en_attente" | "rejeté";
  createdAt: string;
  updatedAt: string;
}

export interface PieceFormData {
  nom: string;
  fichier: File;
  description?: string;
}

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
        lienFichier: piece.lien_fichier,
        typeFichier: piece.type_fichier,
        tailleFichier: piece.taille_fichier,
        dateAjout: piece.date_ajout,
        statut: piece.statut,
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
        lienFichier: piece.lien_fichier,
        typeFichier: piece.type_fichier,
        tailleFichier: piece.taille_fichier,
        dateAjout: piece.date_ajout,
        statut: piece.statut,
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
      // Upload du fichier
      const fileExt = formData.fichier.name.split(".").pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `pieces/${sousDossierId}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("documents")
        .upload(filePath, formData.fichier);

      if (uploadError) throw uploadError;

      // Création de l'enregistrement en base
      const { data, error } = await supabase
        .from("pieces")
        .insert({
          sous_dossier_id: sousDossierId,
          nom: formData.nom,
          lien_fichier: filePath,
          type_fichier: formData.fichier.type,
          taille_fichier: formData.fichier.size,
          date_ajout: new Date().toISOString(),
          statut: "en_attente",
        })
        .select()
        .single();

      if (error) throw error;

      return {
        id: data.id,
        sousDossierId: data.sous_dossier_id,
        nom: data.nom,
        lienFichier: data.lien_fichier,
        typeFichier: data.type_fichier,
        tailleFichier: data.taille_fichier,
        dateAjout: data.date_ajout,
        statut: data.statut,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
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
          statut: updates.statut,
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
        lienFichier: data.lien_fichier,
        typeFichier: data.type_fichier,
        tailleFichier: data.taille_fichier,
        dateAjout: data.date_ajout,
        statut: data.statut,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
      };
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la pièce:", error);
      throw error;
    }
  },

  async deletePiece(id: string): Promise<void> {
    try {
      // Récupérer les informations de la pièce pour supprimer le fichier
      const { data: piece, error: fetchError } = await supabase
        .from("pieces")
        .select("lien_fichier")
        .eq("id", id)
        .single();

      if (fetchError) throw fetchError;

      // Supprimer le fichier du storage
      if (piece.lien_fichier) {
        const { error: deleteError } = await supabase.storage
          .from("documents")
          .remove([piece.lien_fichier]);

        if (deleteError) {
          console.warn(
            "Erreur lors de la suppression du fichier:",
            deleteError
          );
        }
      }

      // Supprimer l'enregistrement en base
      const { error } = await supabase.from("pieces").delete().eq("id", id);

      if (error) throw error;
    } catch (error) {
      console.error("Erreur lors de la suppression de la pièce:", error);
      throw error;
    }
  },

  async downloadPiece(piece: Piece): Promise<void> {
    try {
      const { data, error } = await supabase.storage
        .from("documents")
        .download(piece.lienFichier);

      if (error) throw error;

      const url = URL.createObjectURL(data);
      const a = document.createElement("a");
      a.href = url;
      a.download = piece.nom;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Erreur lors du téléchargement:", error);
      throw error;
    }
  },
};
