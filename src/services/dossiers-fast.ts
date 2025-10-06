import { useDossiersStore } from "@/store/dossiersStore";
import { rubriquesService } from "./rubriques";
import { sousDossiersService } from "./sous-dossiers";
import { piecesService } from "./pieces";
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

export class DossiersFastService {
  /**
   * Charge tous les dossiers avec une approche optimisée
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

    console.log("🔄 Chargement rapide des dossiers...");
    setLoading(true);

    try {
      // Charger les données de base en parallèle
      const [rubriques, agents] = await Promise.all([
        rubriquesService.getAllRubriques(),
        agentsService.getAllAgents(),
      ]);

      // Mettre à jour le cache des données de base
      setRubriques(rubriques);
      setAgents(agents);

      // Charger les dossiers avec une approche optimisée
      const dossiersData: DossierData[] = await Promise.all(
        rubriques.map(async (rubrique) => {
          try {
            console.log(`📁 Chargement rapide pour: ${rubrique.nom}`);

            // Charger les sous-dossiers de la rubrique
            const sousDossiers =
              await sousDossiersService.getAllSousDossiersByRubrique(
                rubrique.id
              );

            // Charger seulement les pièces de base (sans métadonnées/fichiers)
            const sousDossiersWithStats: SousDossierWithStats[] =
              await Promise.all(
                sousDossiers.map(async (sousDossier) => {
                  try {
                    // Charger seulement les pièces de base
                    const pieces =
                      await piecesService.getAllPiecesBySousDossier(
                        sousDossier.id
                      );

                    // Créer des pièces avec des données vides (chargées à la demande)
                    const piecesWithMetadata: PieceWithMetadata[] = pieces.map(
                      (piece) => ({
                        ...piece,
                        metadata: [],
                        metadataModels: [],
                        files: [],
                      })
                    );

                    // Calculer les statistiques de base
                    const piecesCount = piecesWithMetadata.length;
                    const piecesWithMetadataCount = piecesWithMetadata.filter(
                      (piece) => piece.aMetadonnees
                    ).length;

                    return {
                      ...sousDossier,
                      pieces: piecesWithMetadata,
                      piecesCount,
                      piecesWithMetadataCount,
                      totalMetadataCount: 0, // Calculé à la demande
                      lastActivity: sousDossier.updatedAt,
                    };
                  } catch (error) {
                    console.error(
                      `❌ Erreur lors du chargement du sous-dossier ${sousDossier.titre}:`,
                      error
                    );
                    return {
                      ...sousDossier,
                      pieces: [],
                      piecesCount: 0,
                      piecesWithMetadataCount: 0,
                      totalMetadataCount: 0,
                      lastActivity: sousDossier.updatedAt,
                    };
                  }
                })
              );

            // Calculer les statistiques globales de la rubrique
            const totalPieces = sousDossiersWithStats.reduce(
              (sum, sd) => sum + sd.piecesCount,
              0
            );
            const totalSousDossiers = sousDossiersWithStats.length;

            console.log(
              `✅ Rubrique ${rubrique.nom} chargée rapidement: ${totalPieces} pièces, ${totalSousDossiers} sous-dossiers`
            );

            return {
              rubrique,
              sousDossiers: sousDossiersWithStats,
              totalPieces,
              totalSousDossiers,
              totalMetadata: 0, // Calculé à la demande
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
        `🎉 Tous les dossiers chargés rapidement: ${dossiersData.length} rubriques`
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

      // Charger la pièce de base
      const piece = await piecesService.getPieceById(pieceId);
      if (!piece) return null;

      // Charger les données complètes en parallèle
      const [metadataResponse, metadataModelsResponse, filesResponse] =
        await Promise.all([
          fetch(`/api/pieces/${pieceId}/metadata`).then((res) =>
            res.ok ? res.json() : []
          ),
          fetch(`/api/pieces/${pieceId}/metadata-models`).then((res) =>
            res.ok ? res.json() : []
          ),
          fetch(`/api/pieces/${pieceId}/files`).then((res) =>
            res.ok ? res.json() : []
          ),
        ]);

      const pieceWithMetadata: PieceWithMetadata = {
        ...piece,
        metadata: metadataResponse || [],
        metadataModels: metadataModelsResponse || [],
        files: filesResponse || [],
      };

      // Mettre en cache
      setPieceInCache(pieceWithMetadata);

      return pieceWithMetadata;
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
