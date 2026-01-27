import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { 
  MetaValue, 
  Agent, 
  Rubrique, 
  MetadataModel, 
  PieceFile, 
  PieceWithMetadata,
  SousDossierWithStats,
  DossierData,
  AgentWithDossiers
} from "@/types";

// Types (déplacés dans @/types)

interface CacheState {
  // Données mises en cache
  dossiers: DossierData[];
  agents: Agent[];
  rubriques: Rubrique[];
  agentsWithDossiers: AgentWithDossiers[]; // ← NOUVEAU

  // Cache des pièces avec métadonnées et fichiers
  piecesCache: Record<string, PieceWithMetadata>; // key: pieceId

  // État de chargement
  loading: boolean;
  lastFetch: number;

  // Configuration du cache
  cacheExpiry: number; // en millisecondes (défaut: 5 minutes)

  // Actions
  setDossiers: (dossiers: DossierData[]) => void;
  setAgents: (agents: Agent[]) => void;
  setRubriques: (rubriques: Rubrique[]) => void;
  setAgentsWithDossiers: (agentsWithDossiers: AgentWithDossiers[]) => void; // ← NOUVEAU
  setLoading: (loading: boolean) => void;

  // Actions pour le cache des pièces
  setPieceInCache: (piece: PieceWithMetadata) => void;
  getPieceFromCache: (pieceId: string) => PieceWithMetadata | null;
  isPieceInCache: (pieceId: string) => boolean;

  // Actions de cache
  isCacheValid: () => boolean;
  clearCache: () => void;
  updateDossierData: (
    rubriqueId: string,
    updates: Partial<DossierData>
  ) => void;
  updateSousDossierData: (
    rubriqueId: string,
    sousDossierId: string,
    updates: Partial<SousDossierWithStats>
  ) => void;
  updatePieceData: (
    rubriqueId: string,
    sousDossierId: string,
    pieceId: string,
    updates: Partial<PieceWithMetadata>
  ) => void;

  // Actions de mise à jour
  addPiece: (
    rubriqueId: string,
    sousDossierId: string,
    piece: PieceWithMetadata
  ) => void;
  removePiece: (
    rubriqueId: string,
    sousDossierId: string,
    pieceId: string
  ) => void;
  addSousDossier: (
    rubriqueId: string,
    sousDossier: SousDossierWithStats
  ) => void;
  removeSousDossier: (rubriqueId: string, sousDossierId: string) => void;
}

export const useDossiersStore = create<CacheState>()(
  persist(
    (set, get) => ({
      // État initial
      dossiers: [],
      agents: [],
      rubriques: [],
      agentsWithDossiers: [], // ← NOUVEAU
      piecesCache: {},
      loading: false,
      lastFetch: 0,
      cacheExpiry: 15 * 60 * 1000, // 15 minutes

      // Actions de base
      setDossiers: (dossiers) =>
        set({
          dossiers,
          lastFetch: Date.now(),
          loading: false,
        }),

      setAgents: (agents) => set({ agents }),

      setRubriques: (rubriques) => set({ rubriques }),

      setAgentsWithDossiers: (agentsWithDossiers) => set({ agentsWithDossiers }), // ← NOUVEAU

      setLoading: (loading) => set({ loading }),

      // Actions pour le cache des pièces
      setPieceInCache: (piece) =>
        set((state) => ({
          piecesCache: {
            ...state.piecesCache,
            [piece.id]: piece,
          },
        })),

      getPieceFromCache: (pieceId) => {
        const { piecesCache } = get();
        return piecesCache[pieceId] || null;
      },

      isPieceInCache: (pieceId) => {
        const { piecesCache } = get();
        return pieceId in piecesCache;
      },

      // Vérification de validité du cache
      isCacheValid: () => {
        const { lastFetch, cacheExpiry } = get();
        return Date.now() - lastFetch < cacheExpiry;
      },

      // Nettoyage du cache
      clearCache: () =>
        set({
          dossiers: [],
          agents: [],
          rubriques: [],
          agentsWithDossiers: [],
          piecesCache: {},
          lastFetch: 0,
        }),

      // Mise à jour des données de dossier
      updateDossierData: (rubriqueId, updates) =>
        set((state) => ({
          dossiers: state.dossiers.map((dossier) =>
            dossier.rubrique.id === rubriqueId
              ? { ...dossier, ...updates }
              : dossier
          ),
        })),

      // Mise à jour des données de sous-dossier
      updateSousDossierData: (rubriqueId, sousDossierId, updates) =>
        set((state) => ({
          dossiers: state.dossiers.map((dossier) =>
            dossier.rubrique.id === rubriqueId
              ? {
                  ...dossier,
                  sousDossiers: dossier.sousDossiers.map((sousDossier) =>
                    sousDossier.id === sousDossierId
                      ? { ...sousDossier, ...updates }
                      : sousDossier
                  ),
                }
              : dossier
          ),
        })),

      // Mise à jour des données de pièce
      updatePieceData: (rubriqueId, sousDossierId, pieceId, updates) =>
        set((state) => ({
          dossiers: state.dossiers.map((dossier) =>
            dossier.rubrique.id === rubriqueId
              ? {
                  ...dossier,
                  sousDossiers: dossier.sousDossiers.map((sousDossier) =>
                    sousDossier.id === sousDossierId
                      ? {
                          ...sousDossier,
                          pieces: sousDossier.pieces.map((piece) =>
                            piece.id === pieceId
                              ? { ...piece, ...updates }
                              : piece
                          ),
                        }
                      : sousDossier
                  ),
                }
              : dossier
          ),
        })),

      // Ajout d'une pièce
      addPiece: (rubriqueId, sousDossierId, newPiece) =>
        set((state) => ({
          dossiers: state.dossiers.map((dossier) =>
            dossier.rubrique.id === rubriqueId
              ? {
                  ...dossier,
                  sousDossiers: dossier.sousDossiers.map((sousDossier) =>
                    sousDossier.id === sousDossierId
                      ? {
                          ...sousDossier,
                          pieces: [...sousDossier.pieces, newPiece],
                          piecesCount: sousDossier.piecesCount + 1,
                        }
                      : sousDossier
                  ),
                  totalPieces: dossier.totalPieces + 1,
                }
              : dossier
          ),
        })),

      // Suppression d'une pièce
      removePiece: (rubriqueId, sousDossierId, pieceId) =>
        set((state) => ({
          dossiers: state.dossiers.map((dossier) =>
            dossier.rubrique.id === rubriqueId
              ? {
                  ...dossier,
                  sousDossiers: dossier.sousDossiers.map((sousDossier) =>
                    sousDossier.id === sousDossierId
                      ? {
                          ...sousDossier,
                          pieces: sousDossier.pieces.filter(
                            (piece) => piece.id !== pieceId
                          ),
                          piecesCount: Math.max(0, sousDossier.piecesCount - 1),
                        }
                      : sousDossier
                  ),
                  totalPieces: Math.max(0, dossier.totalPieces - 1),
                }
              : dossier
          ),
        })),

      // Ajout d'un sous-dossier
      addSousDossier: (rubriqueId, newSousDossier) =>
        set((state) => ({
          dossiers: state.dossiers.map((dossier) =>
            dossier.rubrique.id === rubriqueId
              ? {
                  ...dossier,
                  sousDossiers: [...dossier.sousDossiers, newSousDossier],
                  totalSousDossiers: dossier.totalSousDossiers + 1,
                }
              : dossier
          ),
        })),

      // Suppression d'un sous-dossier
      removeSousDossier: (rubriqueId, sousDossierId) =>
        set((state) => ({
          dossiers: state.dossiers.map((dossier) =>
            dossier.rubrique.id === rubriqueId
              ? {
                  ...dossier,
                  sousDossiers: dossier.sousDossiers.filter(
                    (sousDossier) => sousDossier.id !== sousDossierId
                  ),
                  totalSousDossiers: Math.max(0, dossier.totalSousDossiers - 1),
                }
              : dossier
          ),
        })),
    }),
    {
      name: "dossiers-cache",
      partialize: (state) => ({
        dossiers: state.dossiers,
        agents: state.agents,
        rubriques: state.rubriques,
        agentsWithDossiers: state.agentsWithDossiers,
        lastFetch: state.lastFetch,
      }),
    }
  )
);
