import { useDossiersStore } from "@/store/dossiersStore";
import { rubriquesService } from "./rubriques";
import { sousDossiersService } from "./sous-dossiers";
import { agentsService } from "./agents";
import type { MetaValue } from "@/types";

interface MetadataModel {
  id: string;
  piece_id: string;
  libelle: string;
  type: string;
  obligatoire: boolean;
  description?: string;
  created_at: string;
  updated_at?: string;
}

interface PieceFile {
  id: string;
  piece_id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type: string;
  created_at: string;
}

interface PieceWithMetadata {
  id: string;
  nom: string;
  description?: string;
  aMetadonnees: boolean;
  createdAt: string;
  updatedAt: string;
  metadata: MetaValue[];
  metadataModels: MetadataModel[];
  files: PieceFile[];
}

interface SousDossierWithStats {
  id: string;
  rubrique_id: string;
  titre: string;
  description: string;
  statut?: string;
  documentsCount?: number;
  createdAt: string;
  updatedAt: string;
  pieces: PieceWithMetadata[];
  piecesCount: number;
  piecesWithMetadataCount: number;
  totalMetadataCount: number;
  lastActivity: string;
}

interface DossierData {
  rubrique: {
    id: string;
    nom: string;
    description: string;
    created_at: string;
    updatedAt: string;
  };
  sousDossiers: SousDossierWithStats[];
  totalPieces: number;
  totalSousDossiers: number;
  totalMetadata: number;
}

export class DossiersUltraFastService {
  /**
   * Charge seulement les rubriques et sous-dossiers (SANS les pièces)
   * Ultra rapide - charge les pièces seulement à la demande
   */
  static async loadDossiers(
    forceRefresh: boolean = false
  ): Promise<DossierData[]> {
    const {
      dossiers,
      isCacheValid,
      setDossiers,
      setLoading,
      setAgents,
      setRubriques,
    } = useDossiersStore.getState();

    // Vérifier si le cache est valide et qu'on ne force pas le refresh
    if (!forceRefresh && dossiers.length > 0 && isCacheValid()) {
      console.log("🚀 Utilisation du cache pour les dossiers");
      return dossiers;
    }

    console.log("⚡ Chargement ULTRA rapide des dossiers...");
    setLoading(true);

    try {
      // Charger SEULEMENT les données de base
      const [rubriques, agents] = await Promise.all([
        rubriquesService.getAllRubriques(),
        agentsService.getAllAgents(),
      ]);

      // Mettre à jour le cache des données de base
      setRubriques(rubriques);
      setAgents(agents);

      // Charger SEULEMENT les sous-dossiers (SANS les pièces)
      const dossiersData: DossierData[] = await Promise.all(
        rubriques.map(async (rubrique) => {
          try {
            console.log(`📁 Chargement ultra rapide pour: ${rubrique.nom}`);

            // Charger SEULEMENT les sous-dossiers
            const sousDossiers =
              await sousDossiersService.getAllSousDossiersByRubrique(
                rubrique.id
              );

            // Créer des sous-dossiers SANS pièces (chargées à la demande)
            const sousDossiersWithStats: SousDossierWithStats[] =
              sousDossiers.map((sousDossier) => ({
                ...sousDossier,
                pieces: [], // Vide - chargé à la demande
                piecesCount: 0, // Sera mis à jour quand on charge les pièces
                piecesWithMetadataCount: 0,
                totalMetadataCount: 0,
                lastActivity: sousDossier.updatedAt,
              }));

            console.log(
              `✅ Rubrique ${rubrique.nom} chargée ultra rapidement: ${sousDossiers.length} sous-dossiers`
            );

            return {
              rubrique,
              sousDossiers: sousDossiersWithStats,
              totalPieces: 0, // Sera mis à jour quand on charge les pièces
              totalSousDossiers: sousDossiers.length,
              totalMetadata: 0,
            };
          } catch (error) {
            console.error(
              `❌ Erreur lors du chargement de la rubrique ${rubrique.nom}:`,
              error
            );
            return {
              rubrique,
              sousDossiers: [],
              totalPieces: 0,
              totalSousDossiers: 0,
              totalMetadata: 0,
            };
          }
        })
      );

      // Mettre à jour le cache
      setDossiers(dossiersData);

      console.log(
        `🎉 Tous les dossiers chargés ULTRA rapidement: ${dossiersData.length} rubriques`
      );
      return dossiersData;
    } catch (error) {
      console.error("❌ Erreur lors du chargement des dossiers:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Charge les pièces d'un sous-dossier à la demande
   */
  static async loadSousDossierPieces(
    rubriqueId: string,
    sousDossierId: string
  ): Promise<PieceWithMetadata[]> {
    const { dossiers, setDossiers } = useDossiersStore.getState();

    try {
      console.log(
        `🔄 Chargement des pièces pour le sous-dossier ${sousDossierId}`
      );

      // Charger les pièces du sous-dossier
      const { piecesService } = await import("./pieces");
      const pieces = await piecesService.getAllPiecesBySousDossier(
        sousDossierId
      );

      // Créer des pièces avec des données vides (métadonnées chargées à la demande)
      const piecesWithMetadata: PieceWithMetadata[] = pieces.map((piece) => ({
        ...piece,
        metadata: [],
        metadataModels: [],
        files: [],
      }));

      // Mettre à jour le cache avec les pièces
      const updatedDossiers = dossiers.map((dossier) =>
        dossier.rubrique.id === rubriqueId
          ? {
              ...dossier,
              sousDossiers: dossier.sousDossiers.map((sousDossier) =>
                sousDossier.id === sousDossierId
                  ? {
                      ...sousDossier,
                      pieces: piecesWithMetadata,
                      piecesCount: piecesWithMetadata.length,
                      piecesWithMetadataCount: piecesWithMetadata.filter(
                        (piece) => piece.aMetadonnees
                      ).length,
                    }
                  : sousDossier
              ),
              totalPieces: dossier.totalPieces + piecesWithMetadata.length,
            }
          : dossier
      );

      setDossiers(updatedDossiers);

      console.log(
        `✅ ${piecesWithMetadata.length} pièces chargées pour le sous-dossier`
      );
      return piecesWithMetadata;
    } catch (error) {
      console.error(
        `❌ Erreur lors du chargement des pièces du sous-dossier ${sousDossierId}:`,
        error
      );
      return [];
    }
  }

  /**
   * Charge les données complètes d'une pièce à la demande
   */
  static async loadPieceDetails(
    pieceId: string
  ): Promise<PieceWithMetadata | null> {
    const { isPieceInCache, getPieceFromCache, setPieceInCache } =
      useDossiersStore.getState();

    // Vérifier le cache d'abord
    if (isPieceInCache(pieceId)) {
      console.log(`🚀 Cache hit pour la pièce ${pieceId}`);
      return getPieceFromCache(pieceId)!;
    }

    try {
      console.log(`🔄 Chargement des détails pour la pièce ${pieceId}`);

      // Pour l'instant, on ne peut pas charger une pièce individuelle
      // On retourne null et on laisse l'appelant gérer
      console.log(
        `⚠️ Chargement individuel de pièce non implémenté pour ${pieceId}`
      );
      return null;
    } catch (error) {
      console.error(
        `❌ Erreur lors du chargement des détails de la pièce ${pieceId}:`,
        error
      );
      return null;
    }
  }

  /**
   * Invalide le cache et force un rechargement
   */
  static async refreshCache(): Promise<DossierData[]> {
    const { clearCache } = useDossiersStore.getState();
    clearCache();
    return this.loadDossiers(true);
  }
}
