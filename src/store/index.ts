import { create } from "zustand";
import { devtools } from "zustand/middleware";
import {
  Agent,
  Rubrique,
  SousDossier,
  Piece,
  MetadataModel,
  PieceMetadata,
  Notification,
} from "@/types";
import { useAuthStore } from "@/store/authStore";

interface AppState {
  // État de l'application
  isLoading: boolean;
  error: string | null;
  notifications: Notification[];

  // Données
  agents: Agent[];
  rubriques: Rubrique[];
  sousDossiers: SousDossier[];
  pieces: Piece[];
  metadataModels: MetadataModel[];
  pieceMetadata: PieceMetadata[];

  // Filtres et pagination
  currentPage: number;
  itemsPerPage: number;

  // Actions
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  addNotification: (notification: Notification) => void;
  removeNotification: (id: string) => void;

  // Gestion des agents
  setAgents: (agents: Agent[]) => void;
  addAgent: (agent: Agent) => void;
  updateAgent: (id: string, updates: Partial<Agent>) => void;
  removeAgent: (id: string) => void;

  // Gestion des rubriques
  setRubriques: (rubriques: Rubrique[]) => void;
  addRubrique: (rubrique: Rubrique) => void;
  updateRubrique: (id: string, updates: Partial<Rubrique>) => void;
  removeRubrique: (id: string) => void;

  // Gestion des sous-dossiers
  setSousDossiers: (sousDossiers: SousDossier[]) => void;
  addSousDossier: (sousDossier: SousDossier) => void;
  updateSousDossier: (id: string, updates: Partial<SousDossier>) => void;
  removeSousDossier: (id: string) => void;

  // Gestion des pièces
  setPieces: (pieces: Piece[]) => void;
  addPiece: (piece: Piece) => void;
  updatePiece: (id: string, updates: Partial<Piece>) => void;
  removePiece: (id: string) => void;

  // Gestion des métadonnées
  setMetadataModels: (models: MetadataModel[]) => void;
  addMetadataModel: (model: MetadataModel) => void;
  updateMetadataModel: (id: string, updates: Partial<MetadataModel>) => void;
  removeMetadataModel: (id: string) => void;

  // Pagination
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (perPage: number) => void;

  // Utilitaires
  getAgentById: (id: string) => Agent | undefined;
  getRubriqueById: (id: string) => Rubrique | undefined;
  getSousDossierById: (id: string) => SousDossier | undefined;
  getPieceById: (id: string) => Piece | undefined;

  // Recherche et filtrage
  searchAgents: (query: string) => Agent[];
  getAgentsByRubrique: (rubriqueId: string) => Agent[];
  getSousDossiersByAgent: (agentId: string) => SousDossier[];
  getPiecesBySousDossier: (sousDossierId: string) => Piece[];
}

export const useAppStore = create<AppState>()(
  devtools(
    (set, get) => ({
      // État initial
      isLoading: false,
      error: null,
      notifications: [],

      agents: [],
      rubriques: [],
      sousDossiers: [],
      pieces: [],
      metadataModels: [],
      pieceMetadata: [],

      currentPage: 1,
      itemsPerPage: 10,

      // Actions de base
      setLoading: (loading) => set({ isLoading: loading }),
      setError: (error) => set({ error }),

      addNotification: (notification) =>
        set((state) => ({
          notifications: [...state.notifications, notification],
        })),

      removeNotification: (id) =>
        set((state) => ({
          notifications: state.notifications.filter((n) => n.id !== id),
        })),

      // Gestion des agents
      setAgents: (agents) => set({ agents }),
      addAgent: (agent) =>
        set((state) => ({ agents: [...state.agents, agent] })),

      updateAgent: (id, updates) =>
        set((state) => ({
          agents: state.agents.map((agent) =>
            agent.id === id ? { ...agent, ...updates } : agent
          ),
        })),

      removeAgent: (id) =>
        set((state) => ({
          agents: state.agents.filter((agent) => agent.id !== id),
        })),

      // Gestion des rubriques
      setRubriques: (rubriques) => set({ rubriques }),
      addRubrique: (rubrique) =>
        set((state) => ({ rubriques: [...state.rubriques, rubrique] })),

      updateRubrique: (id, updates) =>
        set((state) => ({
          rubriques: state.rubriques.map((rubrique) =>
            rubrique.id === id ? { ...rubrique, ...updates } : rubrique
          ),
        })),

      removeRubrique: (id) =>
        set((state) => ({
          rubriques: state.rubriques.filter((rubrique) => rubrique.id !== id),
        })),

      // Gestion des sous-dossiers
      setSousDossiers: (sousDossiers) => set({ sousDossiers }),
      addSousDossier: (sousDossier) =>
        set((state) => ({
          sousDossiers: [...state.sousDossiers, sousDossier],
        })),

      updateSousDossier: (id, updates) =>
        set((state) => ({
          sousDossiers: state.sousDossiers.map((sousDossier) =>
            sousDossier.id === id ? { ...sousDossier, ...updates } : sousDossier
          ),
        })),

      removeSousDossier: (id) =>
        set((state) => ({
          sousDossiers: state.sousDossiers.filter(
            (sousDossier) => sousDossier.id !== id
          ),
        })),

      // Gestion des pièces
      setPieces: (pieces) => set({ pieces }),
      addPiece: (piece) =>
        set((state) => ({ pieces: [...state.pieces, piece] })),

      updatePiece: (id, updates) =>
        set((state) => ({
          pieces: state.pieces.map((piece) =>
            piece.id === id ? { ...piece, ...updates } : piece
          ),
        })),

      removePiece: (id) =>
        set((state) => ({
          pieces: state.pieces.filter((piece) => piece.id !== id),
        })),

      // Gestion des métadonnées
      setMetadataModels: (models) => set({ metadataModels: models }),
      addMetadataModel: (model) =>
        set((state) => ({ metadataModels: [...state.metadataModels, model] })),

      updateMetadataModel: (id, updates) =>
        set((state) => ({
          metadataModels: state.metadataModels.map((model) =>
            model.id === id ? { ...model, ...updates } : model
          ),
        })),

      removeMetadataModel: (id) =>
        set((state) => ({
          metadataModels: state.metadataModels.filter(
            (model) => model.id !== id
          ),
        })),

      // Pagination
      setCurrentPage: (page) => set({ currentPage: page }),
      setItemsPerPage: (perPage) => set({ itemsPerPage: perPage }),

      // Utilitaires
      getAgentById: (id) => get().agents.find((agent) => agent.id === id),
      getRubriqueById: (id) =>
        get().rubriques.find((rubrique) => rubrique.id === id),
      getSousDossierById: (id) =>
        get().sousDossiers.find((sousDossier) => sousDossier.id === id),
      getPieceById: (id) => get().pieces.find((piece) => piece.id === id),

      // Recherche et filtrage
      searchAgents: (query) => {
        const { agents } = get();
        if (!query) return agents;
        const lowercaseQuery = query.toLowerCase();
        return agents.filter(
          (agent) =>
            agent.nom.toLowerCase().includes(lowercaseQuery) ||
            agent.prenom.toLowerCase().includes(lowercaseQuery) ||
            agent.matricule.toLowerCase().includes(lowercaseQuery) ||
            agent.fonction.toLowerCase().includes(lowercaseQuery)
        );
      },

      getAgentsByRubrique: (rubriqueId) => {
        // Cette fonction nécessiterait une jointure avec agent_rubriques
        // Pour l'instant, retourne tous les agents
        return get().agents;
      },

      getSousDossiersByAgent: (agentId) => {
        // Cette fonction nécessiterait une jointure avec agent_rubriques
        // Pour l'instant, retourne tous les sous-dossiers
        return get().sousDossiers;
      },

      getPiecesBySousDossier: (sousDossierId) => {
        return get().pieces.filter(
          (piece) => piece.sousDossierId === sousDossierId
        );
      },
    }),
    {
      name: "app-store",
    }
  )
);
