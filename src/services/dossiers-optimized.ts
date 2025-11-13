import {
  useDossiersStore,
  type DossierData,
  type SousDossierWithStats,
  type PieceWithMetadata,
} from "@/store/dossiersStore";
import { rubriquesService } from "./rubriques";
import { sousDossiersService } from "./sous-dossiers";
import { piecesService } from "./pieces";
import { agentsService } from "./agents";

export class DossiersOptimizedService {
  /**
   * Charge les dossiers groupés par agent avec leurs rubriques assignées
   * Ne garde que les agents avec de vraies données (fichiers ou métadonnées)
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
      setAgentsWithDossiers,
    } = useDossiersStore.getState();

    // Vérifier si le cache est valide et qu'on ne force pas le refresh
    if (!forceRefresh && dossiers.length > 0 && isCacheValid()) {
      console.log("✅ Cache valide");
      return dossiers;
    }

    console.log("🔄 Chargement des dossiers...");
    setLoading(true);

    try {
      // 1. Charger tous les agent_dossiers (dossiers créés)
      const response = await fetch("/api/agent-dossiers");
      if (!response.ok) throw new Error("Erreur agent-dossiers");
      const agentDossiers = await response.json();

      if (agentDossiers.length === 0) {
        console.log("ℹ️ Aucun dossier créé");
        setDossiers([]);
        setAgentsWithDossiers([]);
        setLoading(false);
        return [];
      }

      // 2. Grouper par agent
      const agentDossiersMap = new Map<string, any[]>();
      agentDossiers.forEach((ad: any) => {
        const agentId = ad.agent_id.toString();
        if (!agentDossiersMap.has(agentId)) {
          agentDossiersMap.set(agentId, []);
        }
        agentDossiersMap.get(agentId)!.push(ad);
      });

      // 3. Charger TOUTES les rubriques et agents (pour la modale de création)
      const [agents, allRubriques] = await Promise.all([
        agentsService.getAllAgents(),
        rubriquesService.getAllRubriques(),
      ]);

      setAgents(agents);
      setRubriques(allRubriques); // Important pour la modale !

      const agentsData = await Promise.all(
        Array.from(agentDossiersMap.entries()).map(
          async ([agentId, dossiers]) => {
            const agent = agents.find((a) => a.id === agentId);
            if (!agent) return null;

            // Grouper les dossiers par rubrique
            const rubriqueMap = new Map<string, any[]>();
            dossiers.forEach((ad: any) => {
              const rubriqueId = ad.rubrique_id.toString();
              if (!rubriqueMap.has(rubriqueId)) {
                rubriqueMap.set(rubriqueId, []);
              }
              rubriqueMap.get(rubriqueId)!.push(ad.sous_dossiers);
            });

            // Construire les dossiers par rubrique
            const rubriquePromises = Array.from(rubriqueMap.entries()).map(
              async ([rubriqueId, sousDossiersList]) => {
                const rubrique = await rubriquesService.getRubriqueById(
                  rubriqueId
                );
                if (!rubrique) return null;

                // Pour chaque sous-dossier de cette rubrique
                const sousDossiers = sousDossiersList;

                // Charger les pièces pour chaque sous-dossier
                const sousDossiersWithStats: SousDossierWithStats[] =
                  await Promise.all(
                    sousDossiers.map(async (sousDossier) => {
                      // Récupérer l'agent_dossier_id pour ce sous-dossier
                      const agentDossier = dossiers.find(
                        (ad: any) =>
                          ad.sous_dossier_id === parseInt(sousDossier.id)
                      );
                      const agentDossierId = agentDossier?.id;

                      const pieces =
                        await piecesService.getAllPiecesBySousDossier(
                          sousDossier.id
                        );

                      // Charger métadonnées et fichiers pour chaque pièce avec filtrage par agent_dossier_id
                      const piecesWithMetadata: PieceWithMetadata[] =
                        await Promise.all(
                          pieces.map(async (piece) => {
                            const {
                              isPieceInCache,
                              getPieceFromCache,
                              setPieceInCache,
                            } = useDossiersStore.getState();

                            const cacheKey = agentDossierId
                              ? `${piece.id}_${agentDossierId}`
                              : piece.id;

                            if (isPieceInCache(cacheKey)) {
                              return getPieceFromCache(cacheKey)!;
                            }

                            // Filtrer par agent_dossier_id
                            const metadataUrl = agentDossierId
                              ? `/api/pieces/${piece.id}/metadata?agentDossierId=${agentDossierId}`
                              : `/api/pieces/${piece.id}/metadata`;
                            const filesUrl = agentDossierId
                              ? `/api/pieces/${piece.id}/files?agentDossierId=${agentDossierId}`
                              : `/api/pieces/${piece.id}/files`;

                            const [
                              metadataResponse,
                              metadataModelsResponse,
                              filesResponse,
                            ] = await Promise.all([
                              fetch(metadataUrl).then((res) =>
                                res.ok ? res.json() : []
                              ),
                              fetch(
                                `/api/pieces/${piece.id}/metadata-models`
                              ).then((res) => (res.ok ? res.json() : [])),
                              fetch(filesUrl).then((res) =>
                                res.ok ? res.json() : []
                              ),
                            ]);

                            const pieceWithMetadata = {
                              ...piece,
                              metadata: metadataResponse || [],
                              metadataModels: metadataModelsResponse || [],
                              files: filesResponse || [],
                            };

                            setPieceInCache(pieceWithMetadata);
                            return pieceWithMetadata;
                          })
                        );

                      const piecesCount = piecesWithMetadata.length;
                      const piecesWithMetadataCount = piecesWithMetadata.filter(
                        (p) => p.aMetadonnees
                      ).length;
                      const totalMetadataCount = piecesWithMetadata.reduce(
                        (sum, p) => sum + p.metadata.length,
                        0
                      );
                      const lastActivity =
                        piecesWithMetadata.length > 0
                          ? piecesWithMetadata.reduce((latest, p) => {
                              return new Date(p.createdAt) > new Date(latest)
                                ? p.createdAt
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

                return {
                  rubrique,
                  sousDossiers: sousDossiersWithStats,
                  totalPieces,
                  totalSousDossiers,
                  totalMetadata,
                };
              }
            );

            const dossiersData = (await Promise.all(rubriquePromises)).filter(
              (d) => d !== null
            ) as DossierData[];
            return { agent, dossiers: dossiersData };
          }
        )
      );

      // 4. Filtrer les résultats null
      const agentsWithData = agentsData.filter((ad) => ad !== null) as any[];

      // 5. Stocker les agents avec leurs dossiers
      setAgentsWithDossiers(agentsWithData);

      // Aplatir en liste de dossiers pour compatibilité
      const allDossiers = agentsWithData.flatMap(({ dossiers }) => dossiers);
      setDossiers(allDossiers);

      console.log(
        `✅ ${agentsWithData.length} agent(s) avec données chargé(s)`
      );

      return allDossiers;
    } catch (error) {
      console.error("❌ Erreur chargement:", error);
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
