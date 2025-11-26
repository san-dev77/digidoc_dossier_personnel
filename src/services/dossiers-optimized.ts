import {
  useDossiersStore,
  type DossierData,
  type SousDossierWithStats,
  type PieceWithMetadata,
  type AgentWithDossiers,
} from "@/store/dossiersStore";
import { rubriquesService } from "./rubriques";
import { sousDossiersService } from "./sous-dossiers";
import { piecesService } from "./pieces";
import { agentsService } from "./agents";
import type { AgentDossier } from "./agent-dossiers";
import type { SousDossier } from "./sous-dossiers";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";

// Type pour agent_dossier avec relations Prisma
interface AgentDossierWithRelations extends AgentDossier {
  agents?: {
    id: number;
    matricule: string;
    nom_complet: string;
  };
  rubriques?: {
    id: number;
    nom: string;
  };
  sous_dossiers?: {
    id: number;
    titre: string;
    description?: string;
  };
}

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
      // 1. Charger TOUTES les rubriques et agents EN PREMIER (pour la modale de création)
      // Important : charger les agents même s'il n'y a pas de dossiers
      const [agents, allRubriques] = await Promise.all([
        agentsService.getAllAgents(),
        rubriquesService.getAllRubriques(),
      ]);

      setAgents(agents);
      setRubriques(allRubriques); // Important pour la modale !

      // 2. Charger tous les agent_dossiers (dossiers créés)
      const response = await fetchWithAuth("/api/agent-dossiers");
      if (!response.ok) throw new Error("Erreur agent-dossiers");
      const agentDossiers: AgentDossierWithRelations[] = await response.json();

      if (agentDossiers.length === 0) {
        console.log("ℹ️ Aucun dossier créé");
        setDossiers([]);
        setAgentsWithDossiers([]);
        setLoading(false);
        return [];
      }

      // 3. Grouper par agent
      const agentDossiersMap = new Map<string, AgentDossierWithRelations[]>();
      agentDossiers.forEach((ad) => {
        const agentId = ad.agent_id.toString();
        if (!agentDossiersMap.has(agentId)) {
          agentDossiersMap.set(agentId, []);
        }
        agentDossiersMap.get(agentId)!.push(ad);
      });

      const agentsData = await Promise.all(
        Array.from(agentDossiersMap.entries()).map(
          async ([agentId, dossiers]): Promise<AgentWithDossiers | null> => {
            const agent = agents.find((a) => a.id === agentId);
            if (!agent) return null;

            // Grouper les dossiers par rubrique
            const rubriqueMap = new Map<string, (SousDossier | undefined)[]>();
            dossiers.forEach((ad) => {
              const rubriqueId = ad.rubrique_id.toString();
              if (!rubriqueMap.has(rubriqueId)) {
                rubriqueMap.set(rubriqueId, []);
              }
              const sousDossier = ad.sous_dossiers
                ? {
                    id: ad.sous_dossiers.id.toString(),
                    rubrique_id: rubriqueId,
                    titre: ad.sous_dossiers.titre,
                    description: ad.sous_dossiers.description || "",
                    statut: "ouvert",
                    createdAt: "",
                    updatedAt: "",
                  }
                : undefined;
              if (sousDossier) {
                rubriqueMap.get(rubriqueId)!.push(sousDossier);
              }
            });

            // Construire les dossiers par rubrique
            const rubriquePromises = Array.from(rubriqueMap.entries()).map(
              async ([rubriqueId, sousDossiersList]) => {
                const rubrique = await rubriquesService.getRubriqueById(
                  rubriqueId
                );
                if (!rubrique) return null;

                // Pour chaque sous-dossier de cette rubrique
                const sousDossiers = sousDossiersList.filter(
                  (sd): sd is SousDossier => sd !== undefined
                );

                // Charger les pièces pour chaque sous-dossier
                const sousDossiersWithStats: SousDossierWithStats[] =
                  await Promise.all(
                    sousDossiers.map(async (sousDossier) => {
                      // Récupérer l'agent_dossier_id pour ce sous-dossier
                      const agentDossier = dossiers.find(
                        (ad) =>
                          ad.sous_dossier_id === sousDossier.id ||
                          parseInt(ad.sous_dossier_id) ===
                            parseInt(sousDossier.id)
                      );
                      const agentDossierId = agentDossier?.id
                        ? parseInt(agentDossier.id.toString())
                        : undefined;

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
                              fetchWithAuth(metadataUrl).then((res) =>
                                res.ok ? res.json() : []
                              ),
                              fetchWithAuth(
                                `/api/pieces/${piece.id}/metadata-models`
                              ).then((res) => (res.ok ? res.json() : [])),
                              fetchWithAuth(filesUrl).then((res) =>
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
                        agentDossierId: agentDossierId
                          ? parseInt(agentDossierId.toString())
                          : undefined,
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
      const agentsWithData = agentsData.filter(
        (ad): ad is AgentWithDossiers => ad !== null
      );

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
   * Recharge une rubrique spécifique pour chaque agent séparément
   */
  static async reloadRubrique(rubriqueId: string): Promise<DossierData | null> {
    const { dossiers, setDossiers, agents, setAgentsWithDossiers } =
      useDossiersStore.getState();

    try {
      console.log(`🔄 Rechargement de la rubrique ${rubriqueId}`);

      const rubrique = await rubriquesService.getRubriqueById(rubriqueId);
      if (!rubrique) return null;

      // Charger tous les agent_dossiers pour cette rubrique
      const agentDossiersResponse = await fetchWithAuth(`/api/agent-dossiers`);
      const allAgentDossiers: AgentDossierWithRelations[] =
        agentDossiersResponse.ok
          ? (await agentDossiersResponse.json()).filter(
              (ad: AgentDossierWithRelations) => {
                const adRubriqueId =
                  typeof ad.rubrique_id === "number"
                    ? ad.rubrique_id
                    : parseInt(ad.rubrique_id);
                const targetRubriqueId = parseInt(rubriqueId);
                return adRubriqueId === targetRubriqueId;
              }
            )
          : [];

      if (allAgentDossiers.length === 0) {
        console.log(`ℹ️ Aucun agent_dossier pour la rubrique ${rubriqueId}`);
        return null;
      }

      // Grouper les agent_dossiers par agent
      const agentDossiersMap = new Map<string, AgentDossierWithRelations[]>();
      allAgentDossiers.forEach((ad) => {
        const agentId = ad.agent_id.toString();
        if (!agentDossiersMap.has(agentId)) {
          agentDossiersMap.set(agentId, []);
        }
        agentDossiersMap.get(agentId)!.push(ad);
      });

      // Reconstruire agentsWithDossiers en mettant à jour uniquement la rubrique pour chaque agent
      const { agentsWithDossiers: currentAgentsWithDossiers } =
        useDossiersStore.getState();
      const updatedAgentsWithDossiers = await Promise.all(
        currentAgentsWithDossiers.map(async (agentData) => {
          // Vérifier si cet agent a des dossiers dans cette rubrique
          const agentDossiersForRubrique = agentDossiersMap.get(
            agentData.agent.id
          );

          if (
            !agentDossiersForRubrique ||
            agentDossiersForRubrique.length === 0
          ) {
            // Cet agent n'a pas de dossiers dans cette rubrique, garder les données existantes
            return agentData;
          }

          // Grouper les sous-dossiers de cet agent pour cette rubrique
          // IMPORTANT: Dédupliquer les sous-dossiers en gardant uniquement ceux de cet agent
          // Chaque agent doit avoir ses propres instances de sous-dossiers avec ses propres données
          const sousDossiersMap = new Map<
            string,
            {
              sousDossier: NonNullable<
                AgentDossierWithRelations["sous_dossiers"]
              >;
              agentDossier: AgentDossierWithRelations;
            }
          >();
          agentDossiersForRubrique.forEach((ad) => {
            if (ad.sous_dossiers) {
              const sousDossierId = ad.sous_dossier_id.toString();
              // Garder uniquement les sous-dossiers de cet agent
              if (!sousDossiersMap.has(sousDossierId)) {
                sousDossiersMap.set(sousDossierId, {
                  sousDossier: ad.sous_dossiers,
                  agentDossier: ad,
                });
              }
            }
          });
          const sousDossiersList = Array.from(sousDossiersMap.values());

          // Charger les données complètes pour chaque sous-dossier de cet agent
          const sousDossiersWithStats: SousDossierWithStats[] =
            await Promise.all(
              sousDossiersList.map(async ({ sousDossier, agentDossier }) => {
                try {
                  // Utiliser directement l'agent_dossier associé
                  const agentDossierId = agentDossier.id
                    ? parseInt(agentDossier.id.toString())
                    : undefined;

                  // Convertir le sous-dossier en format SousDossier
                  const sousDossierFormatted: SousDossier = {
                    id: sousDossier.id.toString(),
                    rubrique_id: rubriqueId,
                    titre: sousDossier.titre,
                    description: sousDossier.description || "",
                    statut: "ouvert",
                    createdAt: "",
                    updatedAt: "",
                  };

                  const pieces = await piecesService.getAllPiecesBySousDossier(
                    sousDossier.id.toString()
                  );

                  // Charger métadonnées et fichiers pour chaque pièce avec filtrage par agent_dossier_id
                  const piecesWithMetadata: PieceWithMetadata[] =
                    await Promise.all(
                      pieces.map(async (piece) => {
                        try {
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
                            fetchWithAuth(metadataUrl).then((res) =>
                              res.ok ? res.json() : []
                            ),
                            fetchWithAuth(
                              `/api/pieces/${piece.id}/metadata-models`
                            ).then((res) => (res.ok ? res.json() : [])),
                            fetchWithAuth(filesUrl).then((res) =>
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
                      : "";

                  return {
                    ...sousDossierFormatted,
                    pieces: piecesWithMetadata,
                    piecesCount,
                    piecesWithMetadataCount,
                    totalMetadataCount,
                    lastActivity,
                    agentDossierId: agentDossierId
                      ? parseInt(agentDossierId.toString())
                      : undefined,
                  };
                } catch (error) {
                  console.error(
                    `❌ Erreur lors du chargement du sous-dossier ${sousDossier.titre}:`,
                    error
                  );
                  // Convertir le sous-dossier en format SousDossier pour le catch
                  const sousDossierFormattedError: SousDossier = {
                    id: sousDossier.id.toString(),
                    rubrique_id: rubriqueId,
                    titre: sousDossier.titre,
                    description: sousDossier.description || "",
                    statut: "ouvert",
                    createdAt: "",
                    updatedAt: "",
                  };
                  return {
                    ...sousDossierFormattedError,
                    pieces: [],
                    piecesCount: 0,
                    piecesWithMetadataCount: 0,
                    totalMetadataCount: 0,
                    lastActivity: "",
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

          // Mettre à jour uniquement la rubrique de cet agent
          const updatedAgentDossiers = agentData.dossiers.map((d) =>
            d.rubrique.id === rubriqueId ? updatedDossierData : d
          );

          return {
            ...agentData,
            dossiers: [...updatedAgentDossiers],
          };
        })
      );

      // Mettre à jour le store
      setAgentsWithDossiers([...updatedAgentsWithDossiers]);

      // Mettre à jour aussi le cache des dossiers (aplati)
      const allDossiers = updatedAgentsWithDossiers.flatMap(
        ({ dossiers }) => dossiers
      );
      setDossiers(allDossiers);

      console.log(
        "🔄 agentsWithDossiers mis à jour avec données filtrées par agent"
      );

      console.log(`✅ Rubrique ${rubrique.nom} rechargée pour tous les agents`);

      // Retourner le premier dossier mis à jour (pour compatibilité)
      const firstUpdated = updatedAgentsWithDossiers
        .flatMap((ad) => ad.dossiers)
        .find((d) => d.rubrique.id === rubriqueId);

      return firstUpdated || null;
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
