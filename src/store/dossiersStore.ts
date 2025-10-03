import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { MetaValue, Agent, Rubrique } from "@/types";

// Types
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

interface CacheState {
  // Données mises en cache
  dossiers: DossierData[];
  agents: Agent[];
  rubriques: Rubrique[];

  // État de chargement
  loading: boolean;
  lastFetch: number;

  // Configuration du cache
  cacheExpiry: number; // en millisecondes (défaut: 5 minutes)

  // Actions
  setDossiers: (dossiers: DossierData[]) => void;
  setAgents: (agents: Agent[]) => void;
  setRubriques: (rubriques: Rubrique[]) => void;
  setLoading: (loading: boolean) => void;

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
      loading: false,
      lastFetch: 0,
      cacheExpiry: 5 * 60 * 1000, // 5 minutes

      // Actions de base
      setDossiers: (dossiers) =>
        set({
          dossiers,
          lastFetch: Date.now(),
          loading: false,
        }),

      setAgents: (agents) => set({ agents }),

      setRubriques: (rubriques) => set({ rubriques }),

      setLoading: (loading) => set({ loading }),

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
        lastFetch: state.lastFetch,
      }),
    }
  )
);
