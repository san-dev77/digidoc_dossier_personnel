"use client";

import {
  Folder,
  FileText,
  ChevronDown,
  ChevronRight,
  CreditCard,
} from "lucide-react";
import { isDossierCredit } from "@/utils/rubrique-utils";
import SousDossierCard from "./SousDossierCard";
import type { AgentWithDossiers } from "@/types";
import HighlightText from "@/components/ui/HighlightText";

const getStatusColor = (statut?: string) => {
  switch (statut) {
    case "ouvert":
      return "bg-success-50 text-success-700 border-success-200";
    case "ferme":
      return "bg-error-50 text-error-700 border-error-200";
    case "archive":
      return "bg-primary-100 text-primary-700 border-primary-200";
    default:
      return "bg-warning-50 text-warning-700 border-warning-200";
  }
};

/**
 * Thèmes de couleur pour distinguer visuellement les rubriques :
 * - Personnel : bleu/indigo
 * - Crédit   : émeraude/vert
 */
const THEME = {
  personnel: {
    card: "bg-white border-indigo-200 hover:border-indigo-400 hover:shadow-indigo-100",
    header: "border-2 border-indigo-200 hover:bg-indigo-50",
    icon: "bg-gradient-to-br from-indigo-500 to-indigo-700",
    badge: "px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full border border-indigo-200 shadow-sm",
    statBg: "bg-indigo-100 border-2 border-indigo-300",
    statIcon: "text-indigo-700",
    statText: "text-indigo-800",
    statLabel: "text-indigo-600",
    expandBtn: "bg-indigo-600 border-2 border-indigo-700 hover:bg-indigo-700",
    expandedBg: "border-t border-indigo-100 bg-gradient-to-br from-indigo-50/30 to-white",
    accentBar: "bg-gradient-to-r from-indigo-400 to-indigo-600",
  },
  credit: {
    card: "bg-white border-emerald-200 hover:border-emerald-400 hover:shadow-emerald-100",
    header: "border-2 border-emerald-200 hover:bg-emerald-50",
    icon: "bg-gradient-to-br from-emerald-500 to-teal-600",
    badge: "px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full border border-emerald-200 shadow-sm",
    statBg: "bg-emerald-100 border-2 border-emerald-300",
    statIcon: "text-emerald-700",
    statText: "text-emerald-800",
    statLabel: "text-emerald-600",
    expandBtn: "bg-emerald-600 border-2 border-emerald-700 hover:bg-emerald-700",
    expandedBg: "border-t border-emerald-100 bg-gradient-to-br from-emerald-50/30 to-white",
    accentBar: "bg-gradient-to-r from-emerald-400 to-teal-500",
  },
};

interface RubriqueCardProps {
  dossier: AgentWithDossiers["dossiers"][0];
  isExpanded: boolean;
  searchTerm?: string;
  onToggleExpansion: () => void;
  onCreditDossierClick?: (sousDossierId: number, rubriqueId: number, agentDossierId: number) => void;
  onPieceClick?: (piece: any) => void;
  onDeleteDossier?: (agentDossierId: number, sousDossierTitre: string) => void;
  refreshingPieces: Set<string>;
  onUploadClick: (data: { piece: any; sousDossier: any; rubriqueId: string }) => void;
  agentId: string;
  agentName: string;
}

export default function RubriqueCard({
  dossier,
  isExpanded,
  searchTerm = "",
  onToggleExpansion,
  onCreditDossierClick,
  onPieceClick,
  onDeleteDossier,
  refreshingPieces,
  onUploadClick,
  agentId,
  agentName,
}: RubriqueCardProps) {
  const isCredit = isDossierCredit(dossier.rubrique);
  const theme = isCredit ? THEME.credit : THEME.personnel;

  return (
    <div className={`rounded-xl border shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg ${theme.card}`}>
      {/* Barre d'accent colorée en haut */}
      <div className={`h-1.5 ${theme.accentBar}`}></div>

      {/* Header Rubrique */}
      <div
        className={`cursor-pointer transition-all rounded-lg duration-300 ${theme.header}`}
        onClick={onToggleExpansion}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              {/* Icon Container */}
              <div className="relative flex-shrink-0">
                <div className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${theme.icon}`}>
                  {isCredit ? (
                    <CreditCard className="w-7 h-7 text-white" />
                  ) : (
                    <Folder className="w-7 h-7 text-white" />
                  )}
                </div>
              </div>

              {/* Rubrique Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-3 mb-2">
                  <h4 className="text-xl font-bold text-gray-900">
                    <HighlightText text={dossier.rubrique.nom} searchTerm={searchTerm} />
                  </h4>
                  <span className={theme.badge}>
                    {isCredit ? "Dossier de crédit" : "Dossier personnel"}
                  </span>
                </div>
                {dossier.rubrique.description && (
                  <p className="text-sm text-gray-700 font-semibold mb-4 leading-relaxed">
                    {dossier.rubrique.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4">
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${theme.statBg}`}>
                    <Folder className={`w-4 h-4 ${theme.statIcon}`} />
                    <span className={`text-sm font-bold ${theme.statText}`}>
                      {dossier.sousDossiers.length}
                    </span>
                    <span className={`text-xs font-semibold ${theme.statLabel}`}>
                      sous-dossier
                      {dossier.sousDossiers.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${theme.statBg}`}>
                    <FileText className={`w-4 h-4 ${theme.statIcon}`} />
                    <span className={`text-sm font-bold ${theme.statText}`}>
                      {dossier.totalPieces}
                    </span>
                    <span className={`text-xs font-semibold ${theme.statLabel}`}>
                      pièce
                      {dossier.totalPieces > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expand Button */}
            <div className="flex-shrink-0">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-md transition-all duration-300 hover:scale-110 ${theme.expandBtn}`}>
                {isExpanded ? (
                  <ChevronDown className="w-5 h-5 text-white" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-white" />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Sous-dossiers de la rubrique - Expanded */}
      {(isExpanded || (searchTerm && searchTerm.trim() !== "")) && (
        <div className={theme.expandedBg}>
          <div className="p-6 space-y-4">
            {dossier.sousDossiers.map((sousDossier) => (
              <SousDossierCard
                key={sousDossier.id}
                sousDossier={sousDossier}
                isCredit={isCredit}
                rubriqueId={dossier.rubrique.id}
                agentId={agentId}
                agentName={agentName}
                rubriqueName={dossier.rubrique.nom}
                searchTerm={searchTerm}
                onCreditDossierClick={onCreditDossierClick}
                onPieceClick={onPieceClick}
                onDeleteDossier={onDeleteDossier}
                refreshingPieces={refreshingPieces}
                onUploadClick={onUploadClick}
                getStatusColor={getStatusColor}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
