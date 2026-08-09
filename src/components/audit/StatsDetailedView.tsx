"use client";

import { useState } from "react";
import {
  Folder,
  Layers,
  FileX,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
} from "lucide-react";

const PAGE_SIZE = 6;

export interface StatsData {
  rubriques: Array<{ id: number; nom: string; nombreSousDossiers: number }>;
  sousDossiers: Array<{
    id: number;
    titre: string;
    rubrique: string;
    nombrePieces: number;
  }>;
  agentsAvecPieces: {
    disponibles: Array<{
      id: number;
      nom_complet: string;
      matricule: string;
      pieces_disponibles: number;
    }>;
    indisponibles: Array<{
      id: number;
      nom_complet: string;
      matricule: string;
      pieces_indisponibles: number;
      piecesManquantesDetail?: Array<{
        id: number;
        nom: string;
        rubrique: string;
        sousDossier: string;
      }>;
    }>;
  };
  totalFichiers: number;
  totalRubriques: number;
  totalSousDossiers: number;
  totalPieces: number;
}

interface StatsDetailedViewProps {
  stats: StatsData;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

export default function StatsDetailedView({ stats }: StatsDetailedViewProps) {
  const [openAgentId, setOpenAgentId] = useState<number | null>(
    stats.agentsAvecPieces.indisponibles[0]?.id ?? null
  );
  const [page, setPage] = useState(1);

  const agents = stats.agentsAvecPieces.indisponibles;
  const totalPages = Math.max(1, Math.ceil(agents.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedAgents = agents.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const goToPage = (next: number) => {
    setPage(Math.min(Math.max(next, 1), totalPages));
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b-2 border-gray-100">
        <h3 className="text-xl font-black text-gray-900">
          Agents avec pièces manquantes
        </h3>
        <p className="text-gray-600 font-semibold text-sm mt-1">
          {agents.length > 0
            ? `${agents.length} agent${agents.length > 1 ? "s" : ""} avec des pièces indisponibles`
            : "Tous les dossiers sont complets"}
        </p>
      </div>

      {agents.length === 0 ? (
        <div className="py-12 text-center">
          <CheckCircle2 className="h-10 w-10 text-accent-green mx-auto mb-3" />
          <p className="font-bold text-gray-900">Tous les dossiers sont complets</p>
          <p className="text-sm text-gray-500 mt-1">
            Aucune pièce manquante détectée
          </p>
        </div>
      ) : (
        <div>
          {pagedAgents.map((agent) => {
            const isOpen = openAgentId === agent.id;
            const missing = agent.piecesManquantesDetail || [];

            return (
              <div key={agent.id} className="border-b border-gray-100 last:border-b-0">
                <button
                  onClick={() => setOpenAgentId(isOpen ? null : agent.id)}
                  className="w-full flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-red-600 text-white flex items-center justify-center font-bold text-xs flex-shrink-0">
                    {initials(agent.nom_complet)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {agent.nom_complet}
                    </p>
                    <p className="text-xs text-gray-500">{agent.matricule}</p>
                  </div>
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold bg-red-50 text-red-700 border border-red-200 flex-shrink-0">
                    <FileX className="w-3.5 h-3.5" />
                    {agent.pieces_indisponibles} pièce
                    {agent.pieces_indisponibles > 1 ? "s" : ""} manquante
                    {agent.pieces_indisponibles > 1 ? "s" : ""}
                  </span>
                  <ChevronDown
                    className={`w-4 h-4 text-gray-500 flex-shrink-0 transition-transform ${
                      isOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {isOpen && missing.length > 0 && (
                  <div className="px-6 pb-4 pl-[4.5rem] space-y-2">
                    {missing.map((piece) => (
                      <div
                        key={piece.id}
                        className="flex items-center gap-3 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5"
                      >
                        <div className="w-7 h-7 rounded-lg bg-red-600 flex items-center justify-center flex-shrink-0">
                          <FileX className="w-3.5 h-3.5 text-white" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {piece.nom}
                          </p>
                          <div className="flex items-center gap-1.5 flex-wrap text-xs text-gray-500 mt-0.5">
                            <span className="inline-flex items-center gap-1">
                              <Folder className="w-3 h-3" />
                              {piece.rubrique}
                            </span>
                            <span className="text-gray-300">/</span>
                            <span className="inline-flex items-center gap-1">
                              <Layers className="w-3 h-3" />
                              {piece.sousDossier}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-6 py-4 border-t-2 border-gray-100">
              <p className="text-xs font-semibold text-gray-500">
                {(currentPage - 1) * PAGE_SIZE + 1}
                {"–"}
                {Math.min(currentPage * PAGE_SIZE, agents.length)} sur{" "}
                {agents.length} agents
              </p>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Page précédente"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className="text-sm font-bold text-gray-700 px-2">
                  Page {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-2 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title="Page suivante"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
