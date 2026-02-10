import { agentsService } from "./agents";
import { rubriquesService } from "./rubriques";
import { sousDossiersService } from "./sous-dossiers";
import { piecesService } from "./pieces";
import { fetchWithAuth } from "@/lib/api/fetchWithAuth";

export interface AgentData {
  agent: {
    id: string;
    nom: string;
    prenom: string;
    email: string;
  };
  rubriques: RubriqueData[];
}

export interface RubriqueData {
  rubrique: {
    id: string;
    nom: string;
    description: string;
  };
  sousDossiers: SousDossierData[];
  totalPieces: number;
  totalFiles: number;
}

export interface SousDossierData {
  sousDossier: {
    id: string;
    titre: string;
    description: string;
    rubrique_id: string;
    statut?: string;
    createdAt: string;
  };
  pieces: PieceData[];
  totalPieces: number;
  piecesWithFiles: number;
}

export interface PieceContext {
  agentId: string;
  agentName: string;
  rubriqueId: string;
  rubriqueName: string;
  sousDossierId: string;
  sousDossierName: string;
  agentDossierId?: number;
}

export interface PieceData {
  piece: {
    id: string;
    nom: string;
    description?: string;
    has_meta: boolean;
    createdAt: string;
    updatedAt: string;
  };
  metadata: MetaValueData[];
  files: FileData[];
  hasFiles: boolean;
  context?: PieceContext;
}

export interface MetaValueData {
  id: string;
  meta_model_id: string;
  valeur: string;
  metadataModel: {
    libelle: string;
    type: string;
    obligatoire: boolean;
  } | null;
  created_at: string;
}

export interface FileData {
  id: string;
  filePath: string;        // API returns this (camelCase)
  mimeType?: string;       // API returns this (camelCase)
  createdAt: string;       // API returns this (camelCase)
  // Backward compatibility / legacy
  id_piece?: string;
  file_path?: string;
  created_at?: string;
}

export const agentDataService = {
  // Récupérer toutes les données organisées par agent
  async getAllAgentsData(): Promise<AgentData[]> {
    try {
      const agents = await agentsService.getAllAgents();

      const agentsData: AgentData[] = await Promise.all(
        agents.map(async (agent) => {
          // Récupérer tous les agent_dossiers de l'agent une seule fois
          const agentDossiersResponse = await fetchWithAuth(`/api/agent-dossiers?agentId=${agent.id}`);
          const agentDossiers = agentDossiersResponse.ok ? await agentDossiersResponse.json() : [];

          // Pour chaque agent, récupérer ses rubriques avec des données
          const rubriques = await this.getAgentRubriques(agent.id, agentDossiers);

          return {
            agent: {
              id: agent.id,
              nom: agent.nom,
              prenom: agent.prenom,
              email: agent.email,
            },
            rubriques,
          };
        })
      );

      return agentsData;
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des données par agent:",
        error
      );
      throw error;
    }
  },

  // Récupérer les rubriques pour un agent spécifique
  async getAgentRubriques(agentId: string, agentDossiers: any[] = []): Promise<RubriqueData[]> {
    try {
      const allRubriques = await rubriquesService.getAllRubriques();

      const rubriquesData: RubriqueData[] = await Promise.all(
        allRubriques.map(async (rubrique) => {
          const sousDossiers = await this.getRubriqueSousDossiers(
            agentId,
            rubrique.id,
            agentDossiers
          );

          // Calculer les totaux
          const totalPieces = sousDossiers.reduce(
            (sum, sd) => sum + sd.totalPieces,
            0
          );
          const totalFiles = sousDossiers.reduce(
            (sum, sd) => sum + sd.piecesWithFiles,
            0
          );

          return {
            rubrique: {
              id: rubrique.id,
              nom: rubrique.nom,
              description: rubrique.description,
            },
            sousDossiers,
            totalPieces,
            totalFiles,
          };
        })
      );

      // Filtrer les rubriques qui ont des données
      return rubriquesData.filter((r) => r.totalPieces > 0);
    } catch (error) {
      console.error(
        "Erreur lors de la récupération des rubriques pour l'agent:",
        error
      );
      throw error;
    }
  },

  // Récupérer les sous-dossiers d'une rubrique avec les données de l'agent
  async getRubriqueSousDossiers(
    agentId: string,
    rubriqueId: string,
    agentDossiers: any[] = []
  ): Promise<SousDossierData[]> {
    try {
      const sousDossiers =
        await sousDossiersService.getAllSousDossiersByRubrique(rubriqueId);

      const sousDossiersData: SousDossierData[] = await Promise.all(
        sousDossiers.map(async (sousDossier) => {
          const pieces = await this.getSousDossierPieces(
            agentId,
            sousDossier.id,
            agentDossiers
          );
          const piecesWithFiles = pieces.filter((p) => p.hasFiles).length;

          return {
            sousDossier: {
              id: sousDossier.id,
              titre: sousDossier.titre,
              description: sousDossier.description,
              rubrique_id: sousDossier.rubrique_id,
              statut: sousDossier.statut,
              createdAt: sousDossier.createdAt,
            },
            pieces,
            totalPieces: pieces.length,
            piecesWithFiles,
          };
        })
      );

      return sousDossiersData;
    } catch (error) {
      console.error("Erreur lors de la récupération des sous-dossiers:", error);
      throw error;
    }
  },

  // Récupérer les pièces d'un sous-dossier avec les données de l'agent
  async getSousDossierPieces(
    agentId: string,
    sousDossierId: string,
    agentDossiers: any[] = []
  ): Promise<PieceData[]> {
    try {
      // Trouver l'agent_dossier_id pour ce sous-dossier
      const agentDossier = agentDossiers.find(
        ad => ad.sous_dossier_id.toString() === sousDossierId.toString()
      );
      const agentDossierId = agentDossier?.id;

      // Récupérer TOUTES les données en un seul appel optimisé (modèles, fichiers, valeurs)
      const pieces = await piecesService.getAllPiecesBySousDossier(
        sousDossierId,
        agentDossierId
      );

      return pieces.map(piece => ({
        piece: {
          id: piece.id,
          nom: piece.nom,
          description: piece.description,
          has_meta: piece.aMetadonnees,
          createdAt: piece.createdAt,
          updatedAt: piece.updatedAt,
        },
        metadata: piece.metadata.map((m: any) => ({
          id: m.id,
          meta_model_id: m.meta_model_id,
          valeur: m.valeur,
          metadataModel: m.metadataModel,
          created_at: m.createdAt,
        })),
        files: piece.files.map((f: any) => ({
          id: f.id,
          filePath: f.filePath,
          mimeType: f.mimeType,
          createdAt: f.createdAt,
          // Backward comp
          file_path: f.filePath,
          mime_type: f.mimeType,
          created_at: f.createdAt,
        })),
        hasFiles: piece.files.length > 0,
        // Ajouter un contexte pour faciliter l'accès à l'agent et au dossier
        context: {
          agentId,
          agentName: "", // Sera rempli par le composant si nécessaire
          rubriqueId: "", // Sera rempli par le composant si nécessaire
          rubriqueName: "",
          sousDossierId,
          sousDossierName: "",
          agentDossierId: agentDossierId ? parseInt(agentDossierId.toString()) : undefined,
        }
      }));
    } catch (error) {
      console.error("Erreur lors de la récupération des pièces:", error);
      throw error;
    }
  },
};
