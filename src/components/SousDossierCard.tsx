"use client";

import { useState, useEffect } from "react";
import {
  Folder,
  FileText,
  Calendar,
  Loader2,
  ChevronDown,
  Plus,
} from "lucide-react";
import { usePiecesStore } from "@/store/piecesStore";
import { piecesService } from "@/services/pieces";
import { notificationService } from "@/services/notificationService";
import type { SousDossier } from "@/services/sous-dossiers";
import type { Piece } from "@/types";

// Composant pour une carte de pièce avec animation
function PieceCard({ piece, index }: { piece: Piece; index: number }) {
  return (
    <div
      className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-300 transform hover:-translate-y-1 animate-in slide-in-from-bottom-3 fade-in-0"
      style={{
        animationDelay: `${index * 100}ms`,
        animationFillMode: "both",
      }}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-lg flex items-center justify-center shadow-sm">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h6 className="font-semibold text-slate-800 mb-1 line-clamp-1">
            {piece.nom}
          </h6>
          {piece.description && (
            <p className="text-sm text-slate-600 mb-2 line-clamp-2">
              {piece.description}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                Ajouté le{" "}
                {new Date(piece.createdAt).toLocaleDateString("fr-FR")}
              </span>
            </div>
            {piece.aMetadonnees && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
                <span>Avec métadonnées</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface SousDossierCardProps {
  sousDossier: SousDossier;
  onPieceCreated?: (piece: Piece) => void;
}

export default function SousDossierCard({ sousDossier }: SousDossierCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);

  // Store Zustand
  const pieces = usePiecesStore((state) => state.getPieces(sousDossier.id));
  const pieceCount = usePiecesStore((state) =>
    state.getPieceCount(sousDossier.id)
  );
  const isLoading = usePiecesStore((state) => state.isLoading(sousDossier.id));
  const setPieces = usePiecesStore((state) => state.setPieces);
  const setLoading = usePiecesStore((state) => state.setLoading);
  const setError = usePiecesStore((state) => state.setError);

  // Précharger le nombre de pièces au montage
  useEffect(() => {
    const preloadPieceCount = async () => {
      if (!hasLoadedOnce && pieceCount === 0) {
        try {
          const data = await piecesService.getAllPiecesBySousDossier(
            sousDossier.id
          );
          setPieces(sousDossier.id, data);
          setHasLoadedOnce(true);
        } catch (error) {
          console.error("Erreur lors du préchargement:", error);
        }
      }
    };

    preloadPieceCount();
  }, [sousDossier.id, pieceCount, hasLoadedOnce, setPieces]);

  const loadPieces = async () => {
    if (hasLoadedOnce) return; // Déjà chargé

    setLoading(sousDossier.id, true);
    try {
      const data = await piecesService.getAllPiecesBySousDossier(
        sousDossier.id
      );
      setPieces(sousDossier.id, data);
      setHasLoadedOnce(true);
    } catch (error) {
      console.error("Erreur lors du chargement des pièces:", error);
      setError("Erreur lors du chargement des pièces");
      notificationService.error("Impossible de charger les documents");
    } finally {
      setLoading(sousDossier.id, false);
    }
  };

  const handleToggle = async () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
      if (!hasLoadedOnce) {
        await loadPieces();
      }
    }
  };

  const renderPiecesContent = () => {
    if (isLoading && !hasLoadedOnce) {
      return (
        <div className="p-8 text-center animate-in fade-in-0 duration-300">
          <Loader2 className="w-8 h-8 text-slate-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-600 font-medium">
            Chargement des documents...
          </p>
        </div>
      );
    }

    if (pieces.length === 0) {
      return (
        <div className="p-8 text-center animate-in fade-in-0 duration-500">
          <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-semibold text-slate-800 mb-2">
            Aucun document
          </h4>
          <p className="text-slate-600 mb-4">
            Ce sous-dossier ne contient pas encore de documents.
          </p>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors duration-200 font-medium">
            <Plus className="w-4 h-4" />
            Ajouter un document
          </button>
        </div>
      );
    }

    return (
      <div className="p-6 animate-in fade-in-0 duration-500">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-6 bg-emerald-500 rounded-full"></div>
            <h5 className="text-lg font-semibold text-slate-800">
              Documents ({pieces.length})
            </h5>
          </div>
          <button className="inline-flex items-center gap-2 px-3 py-1.5 text-sm bg-emerald-50 text-emerald-700 rounded-lg hover:bg-emerald-100 transition-colors duration-200 border border-emerald-200">
            <Plus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
        <div className="grid gap-3">
          {pieces.map((piece, index) => (
            <PieceCard key={piece.id} piece={piece} index={index} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 transform hover:-translate-y-1">
      {/* Header du sous-dossier */}
      <div
        className="p-6 cursor-pointer hover:bg-slate-50 transition-colors duration-200"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Folder className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-slate-800 mb-1">
                {sousDossier.titre}
              </h4>
              {sousDossier.description && (
                <p className="text-slate-600 mb-3 leading-relaxed line-clamp-2">
                  {sousDossier.description}
                </p>
              )}
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Créé le{" "}
                    {new Date(sousDossier.createdAt).toLocaleDateString(
                      "fr-FR"
                    )}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span className="font-medium">
                    {isLoading && !hasLoadedOnce ? (
                      <span className="inline-flex items-center gap-1">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        Chargement...
                      </span>
                    ) : (
                      <>
                        {pieceCount} pièce{pieceCount !== 1 ? "s" : ""}
                      </>
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {/* Badge de statut avec animation */}
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200 animate-pulse">
              Actif
            </span>

            {/* Badge du nombre de pièces */}
            {pieceCount > 0 && (
              <span className="inline-flex items-center justify-center w-8 h-8 bg-blue-100 text-blue-800 rounded-full text-sm font-bold border-2 border-blue-200 animate-in zoom-in-0 duration-300">
                {pieceCount}
              </span>
            )}

            {/* Icône d'expansion */}
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-300 ${
                isExpanded
                  ? "bg-blue-100 text-blue-600 rotate-180"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <ChevronDown className="w-4 h-4" />
            </div>
          </div>
        </div>
      </div>

      {/* Contenu des pièces avec animation */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50/50 animate-in slide-in-from-top-2 duration-300">
          {renderPiecesContent()}
        </div>
      )}
    </div>
  );
}
