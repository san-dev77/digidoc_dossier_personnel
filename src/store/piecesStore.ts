import { create } from "zustand";
import { devtools } from "zustand/middleware";
import type { Piece } from "@/types";

interface PiecesState {
  // État des pièces par sous-dossier
  piecesBySousDossier: Record<string, Piece[]>;
  loading: Record<string, boolean>;
  error: string | null;

  // Actions
  setPieces: (sousDossierId: string, pieces: Piece[]) => void;
  addPiece: (sousDossierId: string, piece: Piece) => void;
  removePiece: (sousDossierId: string, pieceId: string) => void;
  updatePiece: (sousDossierId: string, piece: Piece) => void;
  setLoading: (sousDossierId: string, loading: boolean) => void;
  setError: (error: string | null) => void;
  clearPieces: (sousDossierId: string) => void;

  // Getters
  getPieces: (sousDossierId: string) => Piece[];
  getPieceCount: (sousDossierId: string) => number;
  isLoading: (sousDossierId: string) => boolean;
}

export const usePiecesStore = create<PiecesState>()(
  devtools(
    (set, get) => ({
      piecesBySousDossier: {},
      loading: {},
      error: null,

      setPieces: (sousDossierId, pieces) =>
        set((state) => ({
          piecesBySousDossier: {
            ...state.piecesBySousDossier,
            [sousDossierId]: pieces,
          },
        })),

      addPiece: (sousDossierId, piece) =>
        set((state) => ({
          piecesBySousDossier: {
            ...state.piecesBySousDossier,
            [sousDossierId]: [
              piece,
              ...(state.piecesBySousDossier[sousDossierId] || []),
            ],
          },
        })),

      removePiece: (sousDossierId, pieceId) =>
        set((state) => ({
          piecesBySousDossier: {
            ...state.piecesBySousDossier,
            [sousDossierId]: (
              state.piecesBySousDossier[sousDossierId] || []
            ).filter((piece) => piece.id !== pieceId),
          },
        })),

      updatePiece: (sousDossierId, updatedPiece) =>
        set((state) => ({
          piecesBySousDossier: {
            ...state.piecesBySousDossier,
            [sousDossierId]: (
              state.piecesBySousDossier[sousDossierId] || []
            ).map((piece) =>
              piece.id === updatedPiece.id ? updatedPiece : piece
            ),
          },
        })),

      setLoading: (sousDossierId, loading) =>
        set((state) => ({
          loading: {
            ...state.loading,
            [sousDossierId]: loading,
          },
        })),

      setError: (error) => set({ error }),

      clearPieces: (sousDossierId) =>
        set((state) => {
          const newPiecesBySousDossier = { ...state.piecesBySousDossier };
          delete newPiecesBySousDossier[sousDossierId];

          const newLoading = { ...state.loading };
          delete newLoading[sousDossierId];

          return {
            piecesBySousDossier: newPiecesBySousDossier,
            loading: newLoading,
          };
        }),

      // Getters
      getPieces: (sousDossierId) =>
        get().piecesBySousDossier[sousDossierId] || [],
      getPieceCount: (sousDossierId) =>
        get().piecesBySousDossier[sousDossierId]?.length || 0,
      isLoading: (sousDossierId) => get().loading[sousDossierId] || false,
    }),
    {
      name: "pieces-store",
    }
  )
);
