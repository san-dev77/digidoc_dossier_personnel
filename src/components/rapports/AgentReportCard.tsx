"use client";

import { User, Building2, Eye, Folder } from "lucide-react";
import RubriqueSection from "./RubriqueSection";
import type { ConformityReport } from "./types";

interface AgentReportCardProps {
  report: ConformityReport;
  expandedRubriques: Set<string>;
  loadingRubriques: Set<string>;
  onToggleRubrique: (agentId: string, rubriqueId: string) => void;
  onGenerateFiche: (report: any) => void;
  onAvailabilityChange: (
    agentId: string,
    pieceId: string,
    disponible: boolean
  ) => void;
}

export default function AgentReportCard({
  report,
  expandedRubriques,
  loadingRubriques,
  onToggleRubrique,
  onGenerateFiche,
  onAvailabilityChange,
}: AgentReportCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-lg border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-500">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-800 mb-1">
                {report.agent.nom}
              </h3>
              <div className="flex items-center gap-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  <span>Matricule: {report.agent.matricule}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4" />
                  <span>{report.agent.fonction}</span>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => onGenerateFiche(report)}
            className="flex cursor-pointer items-center gap-2 px-4 py-2.5 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors shadow-md"
          >
            <Eye className="w-4 h-4" />
            Générer la fiche d&apos;état
          </button>
        </div>
      </div>

      <div className="p-6">
        {report.rubriques.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Folder className="w-8 h-8 text-slate-400" />
            </div>
            <h4 className="text-lg font-semibold text-slate-800 mb-2">
              Aucune rubrique assignée
            </h4>
            <p className="text-slate-600">
              Cet agent n&apos;est pas encore assigné à une rubrique.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {report.rubriques.map((rubrique) => {
              const key = `${report.agent.id}-${rubrique.rubrique.id}`;
              return (
                <RubriqueSection
                  key={rubrique.rubrique.id}
                  rubrique={rubrique}
                  agentId={report.agent.id}
                  isExpanded={expandedRubriques.has(key)}
                  isLoading={loadingRubriques.has(key)}
                  onToggle={() =>
                    onToggleRubrique(report.agent.id, rubrique.rubrique.id)
                  }
                  onAvailabilityChange={(pieceId, disponible) =>
                    onAvailabilityChange(report.agent.id, pieceId, disponible)
                  }
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

