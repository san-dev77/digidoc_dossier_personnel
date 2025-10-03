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

export class DossiersOptimizedService {
  /**
   * Charge tous les dossiers avec mise en cache intelligente
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

    console.log("🔄 Chargement des dossiers depuis l'API...");
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

      // Charger les dossiers avec leurs données complètes
      const dossiersData: DossierData[] = await Promise.all(
        rubriques.map(async (rubrique) => {
          try {
            console.log(
              `📁 Chargement des données pour la rubrique: ${rubrique.nom}`
            );

            // Charger les sous-dossiers de la rubrique
            const sousDossiers =
              await sousDossiersService.getAllSousDossiersByRubrique(
                rubrique.id
              );

            // Charger les données complètes pour chaque sous-dossier
            const sousDossiersWithStats: SousDossierWithStats[] =
              await Promise.all(
                sousDossiers.map(async (sousDossier) => {
                  try {
                    console.log(
                      `📂 Chargement des pièces pour: ${sousDossier.titre}`
                    );

                    const pieces =
                      await piecesService.getAllPiecesBySousDossier(
                        sousDossier.id
                      );

                    // Charger les métadonnées et fichiers pour chaque pièce en parallèle
                    const piecesWithMetadata: PieceWithMetadata[] =
                      await Promise.all(
                        pieces.map(async (piece) => {
                          try {
                            // Vérifier d'abord le cache
                            const {
                              isPieceInCache,
                              getPieceFromCache,
                              setPieceInCache,
                            } = useDossiersStore.getState();

                            if (isPieceInCache(piece.id)) {
                              console.log(
                                `🚀 Cache hit pour la pièce ${piece.nom} (ID: ${piece.id})`
                              );
                              return getPieceFromCache(piece.id)!;
                            }

                            console.log(
                              `🔄 Chargement depuis l'API pour la pièce ${piece.nom} (ID: ${piece.id})`
                            );

                            // Charger toutes les données de la pièce en parallèle
                            const [
                              metadataResponse,
                              metadataModelsResponse,
                              filesResponse,
                            ] = await Promise.all([
                              fetch(`/api/pieces/${piece.id}/metadata`).then(
                                (res) => (res.ok ? res.json() : [])
                              ),
                              fetch(
                                `/api/pieces/${piece.id}/metadata-models`
                              ).then((res) => (res.ok ? res.json() : [])),
                              fetch(`/api/pieces/${piece.id}/files`).then(
                                (res) => (res.ok ? res.json() : [])
                              ),
                            ]);

                            const pieceWithMetadata = {
                              ...piece,
                              metadata: metadataResponse || [],
                              metadataModels: metadataModelsResponse || [],
                              files: filesResponse || [],
                            };

                            // Mettre en cache la pièce
                            setPieceInCache(pieceWithMetadata);

                            return pieceWithMetadata;
                          } catch (error) {
                            console.error(
                              `❌ Erreur lors du chargement des données pour ${piece.nom}:`,
                              error
                            );
                            return {
                              ...piece,
                              metadata: [],
                              metadataModels: [],
                              files: [],
                            };
                          }
                        })
                      );

                    // Calculer les statistiques
                    const piecesCount = piecesWithMetadata.length;
                    const piecesWithMetadataCount = piecesWithMetadata.filter(
                      (piece) => piece.aMetadonnees
                    ).length;
                    const totalMetadataCount = piecesWithMetadata.reduce(
                      (sum, piece) => sum + piece.metadata.length,
                      0
                    );

                    const lastActivity =
                      piecesWithMetadata.length > 0
                        ? piecesWithMetadata.reduce((latest, piece) => {
                            const pieceDate = new Date(piece.createdAt);
                            const latestDate = new Date(latest);
                            return pieceDate > latestDate
                              ? piece.createdAt
                              : latest;
                          }, piecesWithMetadata[0].createdAt)
                        : sousDossier.updatedAt;

                    return {
                      ...sousDossier,
                      pieces: piecesWithMetadata,
                      piecesCount,
                      piecesWithMetadataCount,
                      totalMetadataCount,
                      lastActivity,
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
            const totalMetadata = sousDossiersWithStats.reduce(
              (sum, sd) => sum + sd.totalMetadataCount,
              0
            );

            console.log(
              `✅ Rubrique ${rubrique.nom} chargée: ${totalPieces} pièces, ${totalSousDossiers} sous-dossiers`
            );

            return {
              rubrique,
              sousDossiers: sousDossiersWithStats,
              totalPieces,
              totalSousDossiers,
              totalMetadata,
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
        `🎉 Tous les dossiers chargés: ${dossiersData.length} rubriques`
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
   * Recharge une rubrique spécifique
   */
  static async reloadRubrique(rubriqueId: string): Promise<DossierData | null> {
    const { dossiers, setDossiers } = useDossiersStore.getState();

    try {
      console.log(`🔄 Rechargement de la rubrique ${rubriqueId}`);

      const rubrique = await rubriquesService.getRubriqueById(rubriqueId);
      if (!rubrique) return null;

      // Charger les sous-dossiers
      const sousDossiers =
        await sousDossiersService.getAllSousDossiersByRubrique(rubriqueId);

      // Charger les données complètes (même logique que dans loadDossiers)
      const sousDossiersWithStats: SousDossierWithStats[] = await Promise.all(
        sousDossiers.map(async (sousDossier) => {
          try {
            const pieces = await piecesService.getAllPiecesBySousDossier(
              sousDossier.id
            );

            const piecesWithMetadata: PieceWithMetadata[] = await Promise.all(
              pieces.map(async (piece) => {
                try {
                  const [
                    metadataResponse,
                    metadataModelsResponse,
                    filesResponse,
                  ] = await Promise.all([
                    fetch(`/api/pieces/${piece.id}/metadata`).then((res) =>
                      res.ok ? res.json() : []
                    ),
                    fetch(`/api/pieces/${piece.id}/metadata-models`).then(
                      (res) => (res.ok ? res.json() : [])
                    ),
                    fetch(`/api/pieces/${piece.id}/files`).then((res) =>
                      res.ok ? res.json() : []
                    ),
                  ]);

                  return {
                    ...piece,
                    metadata: metadataResponse || [],
                    metadataModels: metadataModelsResponse || [],
                    files: filesResponse || [],
                  };
                } catch (error) {
                  console.error(
                    `❌ Erreur lors du chargement des données pour ${piece.nom}:`,
                    error
                  );
                  return {
                    ...piece,
                    metadata: [],
                    metadataModels: [],
                    files: [],
                  };
                }
              })
            );

            const piecesCount = piecesWithMetadata.length;
            const piecesWithMetadataCount = piecesWithMetadata.filter(
              (piece) => piece.aMetadonnees
            ).length;
            const totalMetadataCount = piecesWithMetadata.reduce(
              (sum, piece) => sum + piece.metadata.length,
              0
            );

            const lastActivity =
              piecesWithMetadata.length > 0
                ? piecesWithMetadata.reduce((latest, piece) => {
                    const pieceDate = new Date(piece.createdAt);
                    const latestDate = new Date(latest);
                    return pieceDate > latestDate ? piece.createdAt : latest;
                  }, piecesWithMetadata[0].createdAt)
                : sousDossier.updatedAt;

            return {
              ...sousDossier,
              pieces: piecesWithMetadata,
              piecesCount,
              piecesWithMetadataCount,
              totalMetadataCount,
              lastActivity,
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

      const totalPieces = sousDossiersWithStats.reduce(
        (sum, sd) => sum + sd.piecesCount,
        0
      );
      const totalSousDossiers = sousDossiersWithStats.length;
      const totalMetadata = sousDossiersWithStats.reduce(
        (sum, sd) => sum + sd.totalMetadataCount,
        0
      );

      const updatedDossierData: DossierData = {
        rubrique,
        sousDossiers: sousDossiersWithStats,
        totalPieces,
        totalSousDossiers,
        totalMetadata,
      };

      // Mettre à jour le cache
      const updatedDossiers = dossiers.map((dossier) =>
        dossier.rubrique.id === rubriqueId ? updatedDossierData : dossier
      );
      setDossiers(updatedDossiers);

      console.log(`✅ Rubrique ${rubrique.nom} rechargée`);
      return updatedDossierData;
    } catch (error) {
      console.error(
        `❌ Erreur lors du rechargement de la rubrique ${rubriqueId}:`,
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

  /**
   * Met à jour une pièce dans le cache
   */
  static updatePieceInCache(
    rubriqueId: string,
    sousDossierId: string,
    pieceId: string,
    updates: Partial<PieceWithMetadata>
  ): void {
    const { updatePieceData } = useDossiersStore.getState();
    updatePieceData(rubriqueId, sousDossierId, pieceId, updates);
  }

  /**
   * Ajoute une pièce au cache
   */
  static addPieceToCache(
    rubriqueId: string,
    sousDossierId: string,
    piece: PieceWithMetadata
  ): void {
    const { addPiece } = useDossiersStore.getState();
    addPiece(rubriqueId, sousDossierId, piece);
  }

  /**
   * Supprime une pièce du cache
   */
  static removePieceFromCache(
    rubriqueId: string,
    sousDossierId: string,
    pieceId: string
  ): void {
    const { removePiece } = useDossiersStore.getState();
    removePiece(rubriqueId, sousDossierId, pieceId);
  }
}
