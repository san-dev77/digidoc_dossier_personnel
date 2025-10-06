"use client";

import { useState } from "react";
import {
  User,
  Folder,
  FileText,
  ChevronDown,
  ChevronRight,
  Database,
  Upload,
  Eye,
  Calendar,
  CreditCard,
} from "lucide-react";
import { useDossiersStore } from "@/store/dossiersStore";
import { isDossierCredit } from "@/utils/rubrique-utils";
import type { PieceData } from "@/services/agent-data";

interface AgentDataViewerOptimizedProps {
  onPieceClick?: (piece: PieceData) => void;
  onCreditDossierClick?: (sousDossierId: number, rubriqueId: number) => void;
}

export default function AgentDataViewerOptimized({
  onPieceClick,
  onCreditDossierClick,
}: AgentDataViewerOptimizedProps) {
  const { dossiers, agents, loading } = useDossiersStore();
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [expandedRubriques, setExpandedRubriques] = useState<Set<string>>(
    new Set()
  );

  const toggleAgentExpansion = (agentId: string) => {
    setExpandedAgents((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(agentId)) {
        newSet.delete(agentId);
      } else {
        newSet.add(agentId);
      }
      return newSet;
    });
  };

  const toggleRubriqueExpansion = (rubriqueId: string) => {
    setExpandedRubriques((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(rubriqueId)) {
        newSet.delete(rubriqueId);
      } else {
        newSet.add(rubriqueId);
      }
      return newSet;
    });
  };

  const getStatusColor = (statut?: string) => {
    switch (statut) {
      case "ouvert":
        return "bg-green-100 text-green-800 border-green-200";
      case "ferme":
        return "bg-red-100 text-red-800 border-red-200";
      case "archive":
        return "bg-gray-100 text-gray-800 border-gray-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  // Grouper les dossiers par agent (pour l'instant, on affiche tous les dossiers)
  // Dans une vraie implémentation, on aurait besoin de lier les dossiers aux agents
  const agentsWithData = agents.map((agent) => ({
    agent,
    dossiers: dossiers, // Pour l'instant, tous les dossiers pour tous les agents
  }));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-600"></div>
        <span className="ml-2 text-slate-600">Chargement des données...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Liste des agents */}
      {agentsWithData.map((agentData) => (
        <div
          key={agentData.agent.id}
          className="bg-white rounded-xl shadow-md border-2 border-slate-200"
        >
          {/* Header Agent */}
          <div
            className="p-6 cursor-pointer hover:bg-slate-100 transition-colors border-b-2 border-slate-200"
            onClick={() => toggleAgentExpansion(agentData.agent.id)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">
                    {agentData.agent.prenom} {agentData.agent.nom}
                  </h3>
                  <p className="text-slate-700 font-medium">
                    {agentData.agent.email}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-slate-600 font-medium">
                    <div className="flex items-center gap-1">
                      <Folder className="w-4 h-4" />
                      <span>{agentData.dossiers.length} rubrique(s)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>
                        {agentData.dossiers.reduce(
                          (sum, d) => sum + d.totalPieces,
                          0
                        )}{" "}
                        pièce(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Upload className="w-4 h-4" />
                      <span>
                        {agentData.dossiers.reduce(
                          (sum, d) => sum + d.totalSousDossiers,
                          0
                        )}{" "}
                        sous-dossier(s)
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <div className="w-10 h-10 bg-slate-200 rounded-xl flex items-center justify-center border-2 border-slate-300">
                {expandedAgents.has(agentData.agent.id) ? (
                  <ChevronDown className="w-5 h-5 text-slate-800" />
                ) : (
                  <ChevronRight className="w-5 h-5 text-slate-800" />
                )}
              </div>
            </div>
          </div>

          {/* Rubriques de l'agent */}
          {expandedAgents.has(agentData.agent.id) && (
            <div className="border-t-2 border-slate-200 p-6 space-y-4">
              {agentData.dossiers.length === 0 ? (
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-slate-200 rounded-xl flex items-center justify-center mx-auto mb-4 border-2 border-slate-300">
                    <Folder className="w-8 h-8 text-slate-600" />
                  </div>
                  <p className="text-slate-700 font-semibold">
                    Aucune rubrique avec des données
                  </p>
                  <p className="text-sm text-slate-600 font-medium">
                    Cet agent n&apos;a pas encore de données associées
                  </p>
                </div>
              ) : (
                agentData.dossiers.map((dossier) => (
                  <div
                    key={dossier.rubrique.id}
                    className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200 shadow-sm"
                  >
                    {/* Header Rubrique */}
                    <div
                      className="cursor-pointer hover:bg-slate-200 rounded-lg p-3 transition-colors border-2 border-slate-300"
                      onClick={() =>
                        toggleRubriqueExpansion(dossier.rubrique.id)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            {isDossierCredit(dossier.rubrique) ? (
                              <CreditCard className="w-4 h-4 text-white" />
                            ) : (
                              <Folder className="w-4 h-4 text-white" />
                            )}
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">
                              {dossier.rubrique.nom}
                            </h4>
                            <p className="text-sm text-slate-700 font-medium">
                              {dossier.rubrique.description}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 font-medium">
                              <span>
                                {dossier.sousDossiers.length} sous-dossier(s)
                              </span>
                              <span>{dossier.totalPieces} pièce(s)</span>
                              {isDossierCredit(dossier.rubrique) && (
                                <span className="px-2 py-1 bg-emerald-100 text-emerald-800 text-xs font-medium rounded-full">
                                  Dossier de crédit
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="w-8 h-8 bg-slate-300 rounded-lg flex items-center justify-center border-2 border-slate-400">
                          {expandedRubriques.has(dossier.rubrique.id) ? (
                            <ChevronDown className="w-4 h-4 text-slate-800" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-800" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sous-dossiers de la rubrique */}
                    {expandedRubriques.has(dossier.rubrique.id) && (
                      <div className="mt-3 space-y-2">
                        {dossier.sousDossiers.map((sousDossier) => (
                          <div
                            key={sousDossier.id}
                            className={`bg-white rounded-lg p-3 border-2 border-slate-300 shadow-sm ${
                              isDossierCredit(dossier.rubrique)
                                ? "cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all duration-200"
                                : ""
                            }`}
                            onClick={() => {
                              if (isDossierCredit(dossier.rubrique)) {
                                onCreditDossierClick?.(
                                  parseInt(sousDossier.id),
                                  parseInt(dossier.rubrique.id)
                                );
                              }
                            }}
                          >
                            {/* Header Sous-dossier */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-md flex items-center justify-center">
                                  {isDossierCredit(dossier.rubrique) ? (
                                    <CreditCard className="w-3 h-3 text-white" />
                                  ) : (
                                    <FileText className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <div>
                                  <h5 className="font-semibold text-slate-900">
                                    {sousDossier.titre}
                                  </h5>
                                  <p className="text-xs text-slate-700 font-medium">
                                    {sousDossier.description}
                                  </p>
                                </div>
                              </div>
                              <div className="flex items-center gap-2">
                                {sousDossier.statut && (
                                  <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(
                                      sousDossier.statut
                                    )}`}
                                  >
                                    {sousDossier.statut}
                                  </span>
                                )}
                                {isDossierCredit(dossier.rubrique) ? (
                                  <div className="flex items-center gap-1 px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg text-xs">
                                    <Eye className="w-3 h-3" />
                                    Cliquer pour voir
                                  </div>
                                ) : (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onPieceClick?.({
                                        piece: {
                                          id: sousDossier.id,
                                          nom: sousDossier.titre,
                                          description: sousDossier.description,
                                          has_meta:
                                            sousDossier.piecesWithMetadataCount >
                                            0,
                                          createdAt: sousDossier.createdAt,
                                          updatedAt: sousDossier.updatedAt,
                                        },
                                        metadata: [],
                                        files: [],
                                        hasFiles: sousDossier.pieces.some(
                                          (p) => p.files && p.files.length > 0
                                        ),
                                      });
                                    }}
                                    className="flex items-center gap-1 px-3 py-1 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs"
                                  >
                                    <Eye className="w-3 h-3" />
                                    Voir contenu
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Pièces du sous-dossier */}
                            {!isDossierCredit(dossier.rubrique) && (
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {sousDossier.pieces.map((piece) => (
                                  <div
                                    key={piece.id}
                                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                                      piece.files && piece.files.length > 0
                                        ? "border-green-300 bg-green-50 hover:bg-green-100"
                                        : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                                    }`}
                                    onClick={() =>
                                      onPieceClick?.({
                                        piece: {
                                          id: piece.id,
                                          nom: piece.nom,
                                          description: piece.description,
                                          has_meta: piece.aMetadonnees,
                                          createdAt: piece.createdAt,
                                          updatedAt: piece.updatedAt,
                                        },
                                        metadata: (piece.metadata || []).map(
                                          (meta) => ({
                                            id: meta.id,
                                            meta_model_id: meta.meta_model_id,
                                            valeur: meta.valeur,
                                            metadataModel:
                                              meta.metadataModel || null,
                                            created_at: meta.created_at,
                                          })
                                        ),
                                        files: (piece.files || []).map(
                                          (file) => ({
                                            id: file.id,
                                            id_piece: file.piece_id,
                                            file_path: file.file_path,
                                            created_at: file.created_at,
                                          })
                                        ),
                                        hasFiles:
                                          piece.files && piece.files.length > 0,
                                      })
                                    }
                                  >
                                    <div className="flex items-center gap-2 mb-2">
                                      <div
                                        className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                          piece.files && piece.files.length > 0
                                            ? "bg-green-500"
                                            : "bg-slate-400"
                                        }`}
                                      >
                                        {piece.files &&
                                        piece.files.length > 0 ? (
                                          <Upload className="w-2 h-2 text-white" />
                                        ) : (
                                          <FileText className="w-2 h-2 text-white" />
                                        )}
                                      </div>
                                      <h6 className="font-semibold text-slate-900 text-sm">
                                        {piece.nom}
                                      </h6>
                                    </div>
                                    {piece.description && (
                                      <p className="text-xs text-slate-700 mb-2 font-medium">
                                        {piece.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                      {piece.metadata &&
                                        piece.metadata.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            <Database className="w-3 h-3" />
                                            <span>{piece.metadata.length}</span>
                                          </div>
                                        )}
                                      {piece.files &&
                                        piece.files.length > 0 && (
                                          <div className="flex items-center gap-1">
                                            <Upload className="w-3 h-3" />
                                            <span>{piece.files.length}</span>
                                          </div>
                                        )}
                                      <div className="flex items-center gap-1">
                                        <Calendar className="w-3 h-3" />
                                        <span>
                                          {new Date(
                                            piece.createdAt
                                          ).toLocaleDateString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            {/* Pour les dossiers de crédit, afficher un message informatif */}
                            {isDossierCredit(dossier.rubrique) && (
                              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                                <div className="flex items-center gap-2">
                                  <CreditCard className="w-4 h-4 text-emerald-600" />
                                  <p className="text-sm text-emerald-800 font-medium">
                                    Dossier de crédit - Cliquez sur &quot;Voir
                                    données&quot; pour consulter les métadonnées
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      ))}

      {agentsWithData.length === 0 && !loading && (
        <div className="text-center py-12">
          <div className="w-24 h-24 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <User className="w-12 h-12 text-slate-400" />
          </div>
          <h3 className="text-xl font-semibold text-slate-800 mb-2">
            Aucune donnée trouvée
          </h3>
          <p className="text-slate-600">
            Aucun agent n&apos;a encore de données associées.
          </p>
        </div>
      )}
    </div>
  );
}
