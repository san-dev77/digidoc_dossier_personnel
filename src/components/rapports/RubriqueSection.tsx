"use client";

import { Folder, ChevronDown, ChevronRight } from "lucide-react";
import SousDossierAccordion from "./SousDossierAccordion";
import type { RubriqueConformity } from "./types";

interface RubriqueSectionProps {
  rubrique: RubriqueConformity;
  agentId: string;
  isExpanded: boolean;
  isLoading: boolean;
  onToggle: () => void;
  onAvailabilityChange: (pieceId: string, disponible: boolean) => void;
}

export default function RubriqueSection({
  rubrique,
  agentId,
  isExpanded,
  isLoading,
  onToggle,
  onAvailabilityChange,
}: RubriqueSectionProps) {
  return (
    <div className="border border-slate-500 rounded-xl overflow-hidden">
      <div
        className="p-4 bg-slate-50 cursor-pointer hover:bg-slate-300 transition-colors relative"
        onClick={onToggle}
      >
        {isLoading && (
          <div className="absolute right-4 top-4">
            <div className="w-5 h-5 border-2 border-slate-400 border-t-slate-600 rounded-full animate-spin"></div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
              <Folder className="w-5 h-5 text-primary-600" />
            </div>
            <div>
              <h4 className="text-lg font-semibold text-slate-800">
                {rubrique.rubrique.nom}
              </h4>
              <p className="text-sm text-slate-600">
                {isLoading
                  ? "Chargement..."
                  : rubrique.sousDossiers.length > 0
                  ? `${rubrique.sousDossiers.length} sous-dossier${
                      rubrique.sousDossiers.length > 1 ? "s" : ""
                    } • ${rubrique.totalPieces} pièce${
                      rubrique.totalPieces > 1 ? "s" : ""
                    }`
                  : "Cliquez pour charger les données"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {isExpanded ? (
              <ChevronDown className="w-5 h-5 text-slate-600" />
            ) : (
              <ChevronRight className="w-5 h-5 text-slate-600" />
            )}
          </div>
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 space-y-4">
          {rubrique.sousDossiers.map((sousDossier) => (
            <SousDossierAccordion
              key={sousDossier.id}
              sousDossier={sousDossier}
              agentId={agentId}
              onAvailabilityChange={onAvailabilityChange}
            />
          ))}
        </div>
      )}
    </div>
  );
}

