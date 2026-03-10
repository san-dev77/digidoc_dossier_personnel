/**
 * DossiersOptimizedService
 *
 * Service centralisé pour le chargement des données dossiers.
 *
 * Architecture lazy-loading :
 * - loadDossiers()            → charge la LISTE (agents + rubriques + sous-dossiers avec compteurs)
 * - loadPiecesForSousDossier() → charge les PIÈCES à la demande (quand l'utilisateur expand)
 *
 * Cela élimine le problème de mémoire : on ne charge plus toutes les pièces de tous les agents
 * au démarrage mais uniquement quand l'utilisateur en a besoin.
 */

import {
  type PieceWithMetadata,
  type DossierData,
  type AgentWithDossiers,
  type SousDossierWithStats,
} from "@/types";
import { useDossiersStore } from "@/store/dossiersStore";
import { agentsService } from "./agents";
import { rubriquesService } from "./rubriques";
import { piecesService } from "./pieces";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";

/**
 * Shape retournée par /api/agent-dossiers-summary
 */
interface SummaryResponse {
  success: boolean;
  data: Array<{
    agent: {
      id: number;
      matricule: string;
      nom_complet: string;
      email: string;
      fonction: string;
      date_naissance: string | null;
      lieu_naissance: string | null;
      sexe: string | null;
      situation_matrimoniale: string | null;
      adresse: string | null;
      telephone: string | null;
      statut: string | null;
      created_at: string | null;
      updated_at: string | null;
    };
    rubriques: Array<{
      rubrique: {
        id: number;
        nom: string;
        description: string | null;
        type: string | null;
        created_at: string | null;
      };
      sousDossiers: Array<{
        id: number;
        titre: string;
        description: string | null;
        created_at: string | null;
        updated_at: string | null;
        agentDossierId: number;
        piecesCount: number;
        filesCount: number;
        metadataCount: number;
      }>;
      totalPieces: number;
      totalSousDossiers: number;
    }>;
  }>;
  count: number;
}

export class DossiersOptimizedService {
  /**
   * Charge la liste des dossiers (agents + rubriques + sous-dossiers) avec compteurs UNIQUEMENT.
   * Les pièces ne sont PAS chargées ici — elles le seront à la demande via loadPiecesForSousDossier().
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

    // Vérifier si le cache est valide
    if (!forceRefresh && dossiers.length > 0 && isCacheValid()) {
      console.log("✅ Cache valide — données depuis le store");
      return dossiers;
    }

    console.log("🔄 Chargement des dossiers (summary léger)...");
    setLoading(true);

    try {
      // 1. Charger agents et rubriques (pour la modale de création)
      const [agents, allRubriques] = await Promise.all([
        agentsService.getAllAgents(),
        rubriquesService.getAllRubriques(),
      ]);
      setAgents(agents);
      setRubriques(allRubriques);

      // 2. Charger le summary (1 seul appel API au lieu de milliers)
      const response = await fetchWithAuth("/api/agent-dossiers-summary");
      if (!response.ok) throw new Error("Erreur chargement summary");
      const result: SummaryResponse = await response.json();

      if (!result.success || !result.data || result.data.length === 0) {
        console.log("ℹ️ Aucun dossier trouvé");
        setDossiers([]);
        setAgentsWithDossiers([]);
        setLoading(false);
        return [];
      }

      // 3. Transformer le summary en AgentWithDossiers[] (sans pièces)
      const agentsWithData: AgentWithDossiers[] = result.data.map((item) => {
        const agent = {
          id: item.agent.id.toString(),
          matricule: item.agent.matricule,
          nom: item.agent.nom_complet,
          prenom: "",
          email: item.agent.email,
          fonction: item.agent.fonction,
          date_naissance: item.agent.date_naissance || "",
          lieu_naissance: item.agent.lieu_naissance || "",
          sexe: (item.agent.sexe || "M") as "M" | "F",
          situationMatrimoniale: (item.agent.situation_matrimoniale || "Célibataire") as any,
          adresse: item.agent.adresse || "",
          telephone: item.agent.telephone || "",
          createdAt: item.agent.created_at || "",
          updatedAt: item.agent.updated_at || "",
        };

        const dossiers: DossierData[] = item.rubriques.map((rub) => {
          const sousDossiers: SousDossierWithStats[] = rub.sousDossiers.map((sd) => ({
            id: sd.id.toString(),
            rubrique_id: rub.rubrique.id.toString(),
            titre: sd.titre,
            description: sd.description || "",
            createdAt: sd.created_at || "",
            updatedAt: sd.updated_at || "",
            // Pas de pièces chargées (lazy loading)
            pieces: undefined,
            piecesLoaded: false,
            piecesCount: sd.piecesCount,
            piecesWithMetadataCount: 0,
            totalMetadataCount: sd.metadataCount,
            filesCount: sd.filesCount,
            lastActivity: sd.updated_at || sd.created_at || "",
            agentDossierId: sd.agentDossierId,
          }));

          return {
            rubrique: {
              id: rub.rubrique.id.toString(),
              nom: rub.rubrique.nom,
              description: rub.rubrique.description || "",
              created_at: rub.rubrique.created_at || "",
              updatedAt: "",
            },
            sousDossiers,
            totalPieces: rub.totalPieces,
            totalSousDossiers: rub.totalSousDossiers,
            totalMetadata: sousDossiers.reduce((sum, sd) => sum + sd.totalMetadataCount, 0),
          };
        });

        return { agent, dossiers };
      });

      // 4. Stocker dans le store
      setAgentsWithDossiers(agentsWithData);
      const allDossiers = agentsWithData.flatMap(({ dossiers }) => dossiers);
      setDossiers(allDossiers);

      console.log(`✅ ${agentsWithData.length} agent(s) chargés (summary léger, sans pièces)`);
      return allDossiers;
    } catch (error) {
      console.error("❌ Erreur chargement:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  }

  /**
   * Charge les pièces pour un sous-dossier spécifique (lazy loading).
   * Appelé quand l'utilisateur expand un sous-dossier dans le UI.
   *
   * @param sousDossierId   ID du sous-dossier
   * @param agentDossierId  ID de l'agent_dossier (pour filtrer les fichiers de cet agent)
   * @returns Les pièces chargées avec métadonnées et fichiers
   */
  static async loadPiecesForSousDossier(
    sousDossierId: string,
    agentDossierId?: number
  ): Promise<PieceWithMetadata[]> {
    console.log(`🔄 Chargement pièces pour sous-dossier ${sousDossierId}...`);

    try {
      const pieces = await piecesService.getAllPiecesBySousDossier(
        sousDossierId,
        agentDossierId
      );

      // Mettre à jour le store avec les pièces chargées
      const { agentsWithDossiers, setAgentsWithDossiers, setDossiers } =
        useDossiersStore.getState();

      const updatedAgents = agentsWithDossiers.map((agentData) => ({
        ...agentData,
        dossiers: agentData.dossiers.map((dossier) => ({
          ...dossier,
          sousDossiers: dossier.sousDossiers.map((sd) => {
            if (sd.id === sousDossierId) {
              return {
                ...sd,
                pieces,
                piecesLoaded: true,
                piecesCount: pieces.length,
                piecesWithMetadataCount: pieces.filter((p) => p.aMetadonnees).length,
                totalMetadataCount: pieces.reduce((sum, p) => sum + p.metadata.length, 0),
              };
            }
            return sd;
          }),
        })),
      }));

      setAgentsWithDossiers(updatedAgents);
      const allDossiers = updatedAgents.flatMap(({ dossiers }) => dossiers);
      setDossiers(allDossiers);

      console.log(`✅ ${pieces.length} pièce(s) chargées pour sous-dossier ${sousDossierId}`);
      return pieces;
    } catch (error) {
      console.error(`❌ Erreur chargement pièces (sd=${sousDossierId}):`, error);
      throw error;
    }
  }

  /**
   * Recharge les données d'une rubrique spécifique.
   * Alias de refreshCache() pour la compatibilité ascendante.
   */
  static async reloadRubrique(_rubriqueId: string): Promise<void> {
    await this.refreshCache();
  }

  /**
   * Invalide le cache et force un rechargement complet.
   */
  static async refreshCache(): Promise<DossierData[]> {
    const { clearCache } = useDossiersStore.getState();
    clearCache();
    return this.loadDossiers(true);
  }

  /**
   * Met à jour une pièce dans le cache (sans recharger depuis le serveur).
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
   * Ajoute une pièce au cache (sans recharger depuis le serveur).
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
   * Supprime une pièce du cache.
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
