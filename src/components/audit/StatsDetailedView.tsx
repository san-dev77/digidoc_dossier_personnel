"use client";

import { useState } from "react";
import { Folder, Check, X, ChevronDown, ChevronUp } from "lucide-react";

interface StatsData {
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

export default function StatsDetailedView({ stats }: StatsDetailedViewProps) {
  const [isRubriquesOpen, setIsRubriquesOpen] = useState(false);
  const [isAgentsOpen, setIsAgentsOpen] = useState(false);

  return (
    <div className="space-y-6">
      {/* Rubriques avec sous-dossiers - Accordion */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6">
        <button
          onClick={() => setIsRubriquesOpen(!isRubriquesOpen)}
          className="w-full flex items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-gray-100 hover:border-primary-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <Folder className="h-10 w-10 text-primary-700" />
            <div className="text-left">
              <h3 className="text-2xl font-black text-gray-900">
                Rubriques & Sous-Dossiers
              </h3>
              <p className="text-gray-600 font-semibold">
                {stats.totalRubriques} rubriques organisent{" "}
                {stats.totalSousDossiers} sous-dossiers
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {isRubriquesOpen ? (
              <ChevronUp className="h-6 w-6 text-gray-600" />
            ) : (
              <ChevronDown className="h-6 w-6 text-gray-600" />
            )}
          </div>
        </button>

        {isRubriquesOpen && (
          <div className="space-y-6">
            {stats.rubriques.map((r) => {
              const sousDossiersRubrique = stats.sousDossiers.filter(
                (sd) => sd.rubrique === r.nom
              );
              return (
                <div
                  key={r.id}
                  className="p-5 bg-primary-50 rounded-xl border-2 border-primary-200"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-xl font-bold text-gray-900">{r.nom}</h4>
                    <span className="px-4 py-2 bg-primary-700 text-white font-bold rounded-xl">
                      {r.nombreSousDossiers} sous-dossier(s)
                    </span>
                  </div>

                  {/* Liste des sous-dossiers */}
                  {sousDossiersRubrique.length > 0 && (
                    <div className="space-y-2 mt-3">
                      {sousDossiersRubrique.map((sd) => (
                        <div
                          key={sd.id}
                          className="flex items-center justify-between p-3 bg-white rounded-lg border border-primary-200"
                        >
                          <p className="font-semibold text-gray-800">
                            {sd.titre}
                          </p>
                          <span className="text-sm text-gray-600 font-medium">
                            {sd.nombrePieces} pièce(s)
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Agents avec Pièces Manquantes - Accordion */}
      <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 p-6">
        <button
          onClick={() => setIsAgentsOpen(!isAgentsOpen)}
          className="w-full flex items-center justify-between gap-4 mb-6 pb-4 border-b-2 border-gray-100 hover:border-primary-300 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-800 rounded-xl flex items-center justify-center">
              <X className="h-7 w-7 text-white" />
            </div>
            <div className="text-left">
              <h3 className="text-2xl font-black text-gray-900">
                Agents avec Pièces Manquantes
              </h3>
              <p className="text-gray-600 font-semibold">
                {stats.agentsAvecPieces.indisponibles.length} agent(s) ont des
                pièces indisponibles
                {stats.agentsAvecPieces.indisponibles.length > 0 &&
                  " - Action requise !"}
              </p>
            </div>
          </div>
          <div className="flex-shrink-0">
            {isAgentsOpen ? (
              <ChevronUp className="h-6 w-6 text-gray-600" />
            ) : (
              <ChevronDown className="h-6 w-6 text-gray-600" />
            )}
          </div>
        </button>

        {isAgentsOpen && (
          <>
            {stats.agentsAvecPieces.indisponibles.length > 0 ? (
              <div className="space-y-3">
                {stats.agentsAvecPieces.indisponibles.map((agent) => (
                  <div
                    key={agent.id}
                    className="p-5 bg-primary-100 rounded-xl border-2 border-primary-300"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <p className="text-lg font-bold text-gray-900">
                          {agent.nom_complet}
                        </p>
                        <p className="text-sm text-gray-600 font-medium mt-1">
                          Matricule:{" "}
                          <span className="font-bold">{agent.matricule}</span>
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="px-4 py-2 bg-primary-800 text-white font-black rounded-xl text-lg">
                          {agent.pieces_indisponibles}
                        </span>
                        <p className="text-xs text-gray-600 font-semibold mt-1">
                          pièce(s) manquante(s)
                        </p>
                      </div>
                    </div>

                    {/* Liste des pièces manquantes */}
                    {agent.piecesManquantesDetail &&
                      agent.piecesManquantesDetail.length > 0 && (
                        <div className="mt-4 pt-4 border-t-2 border-primary-200">
                          <p className="text-sm font-bold text-gray-700 mb-3">
                            📋 Détail des pièces manquantes :
                          </p>
                          <div className="space-y-2">
                            {agent.piecesManquantesDetail.map((piece) => (
                              <div
                                key={piece.id}
                                className="p-3 bg-white rounded-lg border border-primary-300 hover:border-primary-400 hover:shadow-sm transition-all cursor-pointer"
                              >
                                <div className="flex items-start gap-2">
                                  <span className="text-primary-700 font-bold text-sm">
                                    📄
                                  </span>
                                  <div className="flex-1">
                                    <p className="font-bold text-gray-900 mb-2">
                                      Pièce :{" "}
                                      <span className="text-primary-800">
                                        {piece.nom}
                                      </span>
                                    </p>
                                    <div className="space-y-1 text-xs">
                                      <div className="flex items-center gap-2 text-gray-700">
                                        <span className="font-semibold text-gray-600">
                                          Rubrique :
                                        </span>
                                        <span className="font-bold bg-primary-50 px-2 py-1 rounded">
                                          📁 {piece.rubrique}
                                        </span>
                                      </div>
                                      <div className="flex items-center gap-2 text-gray-700">
                                        <span className="font-semibold text-gray-600">
                                          Sous-dossier :
                                        </span>
                                        <span className="font-bold bg-primary-50 px-2 py-1 rounded">
                                          📂 {piece.sousDossier}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-primary-50 rounded-xl">
                <Check className="h-12 w-12 text-primary-700 mx-auto mb-3" />
                <p className="text-lg font-bold text-primary-900">
                  Tous les dossiers sont complets !
                </p>
                <p className="text-sm text-gray-600 mt-1">
                  Aucune pièce manquante détectée
                </p>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
