"use client";

import { useState } from "react";
import {
  Folder,
  BadgeCheck,
  AlertCircle,
  X,
  Info,
  ChevronDown,
  ChevronRight,
  FileText,
  Calendar,
} from "lucide-react";
import PieceCard from "./PieceCard";
import type { PieceWithCheck } from "@/types";

interface SousDossier {
  id: string;
  titre: string;
  description: string;
  createdAt: string;
  pieces: PieceWithCheck[];
  conformityPercentage: number;
  checkedCount: number;
  totalPieces: number;
  status: "all_checked" | "partial_checked" | "none_checked" | "no_pieces";
}

interface SousDossierAccordionProps {
  sousDossier: SousDossier;
  agentId: string;
  onAvailabilityChange?: (pieceId: string, disponible: boolean) => void;
}

function calculateSousDossierStatus(pieces: PieceWithCheck[]): {
  status: "all_checked" | "partial_checked" | "none_checked" | "no_pieces";
  checkedCount: number;
  totalPieces: number;
} {
  if (pieces.length === 0) {
    return { status: "no_pieces", checkedCount: 0, totalPieces: 0 };
  }

  const checkedCount = pieces.filter((piece) => piece.isDisponible === true)
    .length;
  const verifiedCount = pieces.filter(
    (piece) => piece.isDisponible !== null
  ).length;
  const totalPieces = pieces.length;

  if (verifiedCount === 0) {
    return { status: "none_checked", checkedCount: 0, totalPieces };
  } else if (checkedCount === totalPieces && verifiedCount === totalPieces) {
    return { status: "all_checked", checkedCount, totalPieces };
  } else if (checkedCount > 0 && checkedCount < totalPieces) {
    return { status: "partial_checked", checkedCount, totalPieces };
  } else if (verifiedCount === totalPieces && checkedCount === 0) {
    return { status: "none_checked", checkedCount: 0, totalPieces };
  } else {
    return { status: "partial_checked", checkedCount, totalPieces };
  }
}

export default function SousDossierAccordion({
  sousDossier,
  agentId,
  onAvailabilityChange,
}: SousDossierAccordionProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pieces, setPieces] = useState<PieceWithCheck[]>(
    sousDossier.pieces || []
  );

  const statusData = calculateSousDossierStatus(pieces);

  const getStatusStyles = (status: string) => {
    switch (status) {
      case "all_checked":
        return {
          cardClass:
            "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200",
          headerClass: "bg-gradient-to-r from-green-100 to-emerald-100",
          iconClass: "text-green-600 bg-green-100",
          badgeClass: "bg-green-500 text-white",
          borderClass: "border-green-300",
        };
      case "partial_checked":
        return {
          cardClass:
            "bg-gradient-to-r from-yellow-50 to-amber-50 border-yellow-200",
          headerClass: "bg-gradient-to-r from-yellow-100 to-amber-100",
          iconClass: "text-yellow-600 bg-yellow-100",
          badgeClass: "bg-yellow-500 text-white",
          borderClass: "border-yellow-300",
        };
      case "none_checked":
        return {
          cardClass: "bg-gradient-to-r from-red-50 to-rose-50 border-red-200",
          headerClass: "bg-gradient-to-r from-red-100 to-rose-100",
          iconClass: "text-red-600 bg-red-100",
          badgeClass: "bg-red-500 text-white",
          borderClass: "border-red-300",
        };
      case "no_pieces":
        return {
          cardClass:
            "bg-gradient-to-r from-gray-50 to-slate-50 border-gray-200",
          headerClass: "bg-gradient-to-r from-gray-100 to-slate-100",
          iconClass: "text-gray-600 bg-gray-100",
          badgeClass: "bg-gray-500 text-white",
          borderClass: "border-gray-300",
        };
      default:
        return {
          cardClass: "bg-white border-gray-200",
          headerClass: "bg-gray-50",
          iconClass: "text-gray-600 bg-gray-100",
          badgeClass: "bg-gray-500 text-white",
          borderClass: "border-gray-300",
        };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "all_checked":
        return <BadgeCheck className="w-5 h-5" />;
      case "partial_checked":
        return <AlertCircle className="w-5 h-5" />;
      case "none_checked":
        return <X className="w-5 h-5" />;
      case "no_pieces":
        return <Info className="w-5 h-5" />;
      default:
        return <Folder className="w-5 h-5" />;
    }
  };

  const getStatusText = (
    status: string,
    checkedCount: number,
    totalPieces: number
  ) => {
    const verifiedCount = pieces.filter((p) => p.isDisponible !== null).length;

    switch (status) {
      case "all_checked":
        return `${checkedCount}/${totalPieces} disponibles`;
      case "partial_checked":
        if (verifiedCount === totalPieces && checkedCount === 0) {
          return `${totalPieces} pièces vérifiées (aucune disponible)`;
        } else {
          return `${checkedCount}/${totalPieces} disponibles`;
        }
      case "none_checked":
        return `${totalPieces} pièces non vérifiées`;
      case "no_pieces":
        return "Aucune pièce";
      default:
        return "";
    }
  };

  const styles = getStatusStyles(statusData.status);

  const handlePieceAvailabilityChange = (
    pieceId: string,
    disponible: boolean
  ) => {
    setPieces((prevPieces) =>
      prevPieces.map((piece) =>
        piece.id === pieceId
          ? {
              ...piece,
              isDisponible: disponible,
              lastCheckDate: new Date().toISOString(),
            }
          : piece
      )
    );
    onAvailabilityChange?.(pieceId, disponible);
  };

  return (
    <div
      className={`${styles.cardClass} border-2 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300 ${styles.borderClass}`}
    >
      <div
        className={`p-6 cursor-pointer hover:opacity-90 transition-all duration-200 ${styles.headerClass}`}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg ${styles.iconClass}`}
            >
              {getStatusIcon(statusData.status)}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h4 className="text-xl font-bold text-slate-800">
                  {sousDossier.titre}
                </h4>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${styles.badgeClass}`}
                >
                  {getStatusText(
                    statusData.status,
                    statusData.checkedCount,
                    statusData.totalPieces
                  )}
                </span>
              </div>
              {sousDossier.description && (
                <p className="text-slate-600 mb-3 leading-relaxed">
                  {sousDossier.description}
                </p>
              )}
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Créé le{" "}
                    {new Date(sousDossier.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>
                    {pieces.length} pièce{pieces.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="w-10 h-10 bg-white/50 rounded-xl flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-600" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="border-t border-slate-200">
          {pieces.length === 0 ? (
            <div className="p-8 text-center">
              <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-slate-400" />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-2">
                Aucun document
              </h4>
              <p className="text-slate-600">
                Ce sous-dossier ne contient pas encore de pièces.
              </p>
            </div>
          ) : (
            <div className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <div
                  className={`w-2 h-6 rounded-full ${
                    statusData.status === "all_checked"
                      ? "bg-green-500"
                      : statusData.status === "partial_checked"
                      ? "bg-yellow-500"
                      : statusData.status === "none_checked"
                      ? "bg-red-500"
                      : "bg-gray-500"
                  }`}
                ></div>
                <h5 className="text-lg font-semibold text-slate-800">
                  Documents dans ce sous-dossier
                </h5>
              </div>
              <div className="grid gap-3">
                {pieces.map((piece) => (
                  <PieceCard
                    key={piece.id}
                    piece={piece}
                    agentId={agentId}
                    onAvailabilityChange={handlePieceAvailabilityChange}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

