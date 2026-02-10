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

interface RubriqueCardProps {
  dossier: AgentWithDossiers["dossiers"][0];
  isExpanded: boolean;
  searchTerm?: string;
  onToggleExpansion: () => void;
  onCreditDossierClick?: (sousDossierId: number, rubriqueId: number) => void;
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

  return (
    <div className="bg-white rounded-xl border border-primary-200/80 shadow-md overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-primary-300">
      {/* Header Rubrique */}
      <div
        className="cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-primary-50 hover:to-white"
        onClick={onToggleExpansion}
      >
        <div className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex items-start gap-4 flex-1">
              {/* Icon Container */}
              <div className="relative flex-shrink-0">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                    isCredit
                      ? "bg-gradient-to-br from-success-500 to-success-600"
                      : "bg-gradient-to-br from-[var(--color-accent-purple)] to-[var(--color-primary-600)]"
                  }`}
                >
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
                  <h4 className="text-xl font-bold text-primary-900">
                    <HighlightText text={dossier.rubrique.nom} searchTerm={searchTerm} />
                  </h4>
                  {isCredit && (
                    <span className="px-3 py-1 bg-gradient-to-r from-success-100 to-success-50 text-success-700 text-xs font-bold rounded-full border border-success-200 shadow-sm">
                      Dossier de crédit
                    </span>
                  )}
                </div>
                {dossier.rubrique.description && (
                  <p className="text-sm text-primary-800 font-semibold mb-4 leading-relaxed">
                    {dossier.rubrique.description}
                  </p>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary-200 rounded-lg border-2 border-primary-400">
                    <Folder className="w-4 h-4 text-primary-800" />
                    <span className="text-sm font-bold text-primary-900">
                      {dossier.sousDossiers.length}
                    </span>
                    <span className="text-xs font-semibold text-primary-800">
                      sous-dossier
                      {dossier.sousDossiers.length > 1 ? "s" : ""}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 px-4 py-2 bg-primary-200 rounded-lg border-2 border-primary-400">
                    <FileText className="w-4 h-4 text-primary-800" />
                    <span className="text-sm font-bold text-primary-900">
                      {dossier.totalPieces}
                    </span>
                    <span className="text-xs font-semibold text-primary-800">
                      pièce
                      {dossier.totalPieces > 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Expand Button */}
            <div className="flex-shrink-0">
              <div className="w-10 h-10 bg-primary-600 rounded-lg flex items-center justify-center border-2 border-primary-700 shadow-md transition-all duration-300 hover:bg-primary-700 hover:scale-110">
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
        <div className="border-t border-primary-100 bg-gradient-to-br from-primary-50/30 to-white">
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

