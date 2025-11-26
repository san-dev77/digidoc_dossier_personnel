"use client";

import {
  FileText,
  FileCheck,
  Database,
  Upload,
  Eye,
  Calendar,
} from "lucide-react";
import PieceLoader from "@/components/ui/PieceLoader";
import type { PieceData } from "@/services/agent-data";

interface PieceCardProps {
  piece: {
    id: string;
    nom: string;
    description?: string;
    aMetadonnees: boolean;
    createdAt: string;
    updatedAt: string;
    files?: Array<{ id: string; piece_id: string; file_path: string; created_at: string }>;
    metadata?: Array<{
      id: string;
      meta_model_id: string;
      valeur: string;
      metadataModel?: { libelle: string; obligatoire: boolean } | null;
      created_at: string;
    }>;
  };
  isRefreshing: boolean;
  onUploadClick: () => void;
  onViewClick: () => void;
}

export default function PieceCard({
  piece,
  isRefreshing,
  onUploadClick,
  onViewClick,
}: PieceCardProps) {
  const hasFiles = piece.files && piece.files.length > 0;
  const hasMetadata = piece.metadata && piece.metadata.length > 0;

  return (
    <div
      className={`group/piece relative p-4 rounded-xl border transition-all duration-300 hover:shadow-lg hover:scale-[1.02] ${
        hasFiles
          ? "border-emerald-400 bg-gradient-to-br from-emerald-300 to-emerald-100/50 hover:border-emerald-300"
          : "border-slate-200 bg-gradient-to-br from-slate-50 to-white hover:border-slate-300"
      } ${
        isRefreshing ? "ring-2 ring-primary-500 ring-offset-2" : ""
      }`}
    >
      {/* Loader overlay si en cours de rafraîchissement */}
      {isRefreshing && (
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-xl flex items-center justify-center z-10">
          <div className="flex flex-col items-center gap-2">
            <PieceLoader size="md" />
            <span className="text-xs font-medium text-primary-700">
              Mise à jour...
            </span>
          </div>
        </div>
      )}

      {/* Status Indicator */}
      <div
        className={`absolute top-2 right-2 w-3 h-3 rounded-full ${
          hasFiles
            ? "bg-emerald-500 shadow-lg shadow-emerald-500/50"
            : "bg-slate-400"
        }`}
      ></div>

      {/* Icon & Title */}
      <div className="flex items-start gap-3 mb-3">
        <div
          className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md ${
            hasFiles
              ? "bg-gradient-to-br from-emerald-500 to-emerald-600"
              : "bg-gradient-to-br from-slate-400 to-slate-500"
          }`}
        >
          {hasFiles ? (
            <FileCheck className="w-5 h-5 text-white" />
          ) : (
            <FileText className="w-5 h-5 text-white" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h6 className="font-bold text-primary-900 text-sm mb-1 line-clamp-2">
            {piece.nom}
          </h6>
          {piece.description && (
            <p className="text-xs text-primary-800 font-medium line-clamp-2">
              {piece.description}
            </p>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 flex-wrap mb-3">
        {hasMetadata && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-[var(--color-accent-blue-light)] rounded-lg">
            <Database className="w-3.5 h-3.5 text-[var(--color-accent-blue)]" />
            <span className="text-xs font-semibold text-[var(--color-primary-700)]">
              {piece.metadata!.length}
            </span>
          </div>
        )}
        {hasFiles && (
          <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-100 rounded-lg">
            <Upload className="w-3.5 h-3.5 text-emerald-600" />
            <span className="text-xs font-semibold text-emerald-700">
              {piece.files!.length}
            </span>
          </div>
        )}
        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-primary-200 rounded-lg border border-primary-400">
          <Calendar className="w-3.5 h-3.5 text-primary-800" />
          <span className="text-xs font-semibold text-primary-900">
            {new Date(piece.createdAt).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
            })}
          </span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onUploadClick();
          }}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 shadow-lg hover:shadow-xl text-xs font-bold border-2 border-primary-700"
          title="Charger un fichier"
        >
          <Upload className="w-3.5 h-3.5 text-white" />
          Charger
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onViewClick();
          }}
          className="flex items-center justify-center gap-2 px-3 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-all duration-200 text-xs font-bold border-2 border-primary-700 shadow-lg hover:shadow-xl"
          title="Voir les détails"
        >
          <Eye className="w-3.5 h-3.5 text-white" />
          Voir
        </button>
      </div>
    </div>
  );
}

