"use client";

import { useState } from "react";
import { FileText, Calendar } from "lucide-react";
import { piecesCheckService } from "@/services/pieces-check";
import type { PieceWithCheck } from "@/types";

interface PieceCardProps {
  piece: PieceWithCheck;
  agentId: string;
  onAvailabilityChange?: (pieceId: string, disponible: boolean) => void;
}

export default function PieceCard({
  piece,
  agentId,
  onAvailabilityChange,
}: PieceCardProps) {
  const [isDisponible, setIsDisponible] = useState<boolean | null>(
    piece.isDisponible ?? null
  );
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAvailabilityChange = async (disponible: boolean) => {
    setIsUpdating(true);
    try {
      await piecesCheckService.updatePieceAvailability({
        piece_id: piece.id,
        disponible,
        agent_id: agentId,
      });

      setIsDisponible(disponible);
      onAvailabilityChange?.(piece.id, disponible);
    } catch (error) {
      console.error(
        "Erreur lors de la mise à jour de la disponibilité:",
        error
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md transition-all duration-200">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h6 className="font-semibold text-slate-800 mb-1">{piece.nom}</h6>
          {piece.description && (
            <p className="text-sm text-slate-600 mb-2">{piece.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                Ajouté le {new Date(piece.createdAt).toLocaleDateString()}
              </span>
            </div>
            {piece.aMetadonnees && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Avec métadonnées</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex flex-col items-center gap-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={isDisponible === true}
              onChange={(e) => handleAvailabilityChange(e.target.checked)}
              disabled={isUpdating}
              className="w-5 h-5 text-primary-600 bg-white border-2 border-slate-300 rounded focus:ring-primary-500 focus:ring-2 disabled:opacity-50"
            />
            <span className="text-sm font-medium text-slate-700">
              {isDisponible === null
                ? "Non disponible"
                : isDisponible
                ? "Disponible"
                : "Non disponible"}
            </span>
          </label>

          {isUpdating && (
            <div className="flex items-center gap-1 text-xs text-slate-500">
              <div className="w-3 h-3 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin"></div>
              <span>Mise à jour...</span>
            </div>
          )}

          {piece.lastCheckDate && (
            <div className="text-xs text-slate-400">
              Vérifié le{" "}
              {new Date(piece.lastCheckDate).toLocaleDateString("fr-FR")}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

