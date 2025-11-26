"use client";

import { useState, useEffect } from "react";
import {
  User,
  Folder,
  FileText,
  ChevronDown,
  ChevronRight,
  Database,
  Upload,
  Calendar,
} from "lucide-react";
import {
  agentDataService,
  type AgentData,
  type RubriqueData,
  type SousDossierData,
  type PieceData,
} from "@/services/agent-data";

interface AgentDataViewerProps {
  onPieceClick?: (piece: PieceData) => void;
}

export default function AgentDataViewer({
  onPieceClick,
}: AgentDataViewerProps) {
  const [agentsData, setAgentsData] = useState<AgentData[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentData | null>(null);
  const [selectedRubrique, setSelectedRubrique] = useState<RubriqueData | null>(
    null
  );
  const [selectedSousDossier, setSelectedSousDossier] =
    useState<SousDossierData | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [expandedRubriques, setExpandedRubriques] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    loadAgentsData();
  }, []);

  const loadAgentsData = async () => {
    try {
      setLoading(true);
      const data = await agentDataService.getAllAgentsData();
      setAgentsData(data);
    } catch (error) {
      console.error("Erreur lors du chargement des données:", error);
    } finally {
      setLoading(false);
    }
  };

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
      {agentsData.map((agentData) => (
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
                      <span>{agentData.rubriques.length} rubrique(s)</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <FileText className="w-4 h-4" />
                      <span>
                        {agentData.rubriques.reduce(
                          (sum, r) => sum + r.totalPieces,
                          0
                        )}{" "}
                        pièce(s)
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Upload className="w-4 h-4" />
                      <span>
                        {agentData.rubriques.reduce(
                          (sum, r) => sum + r.totalFiles,
                          0
                        )}{" "}
                        fichier(s)
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
              {agentData.rubriques.length === 0 ? (
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
                agentData.rubriques.map((rubriqueData) => (
                  <div
                    key={rubriqueData.rubrique.id}
                    className="bg-slate-50 rounded-lg p-4 border-2 border-slate-200 shadow-sm"
                  >
                    {/* Header Rubrique */}
                    <div
                      className="cursor-pointer hover:bg-slate-200 rounded-lg p-3 transition-colors border-2 border-slate-300"
                      onClick={() =>
                        toggleRubriqueExpansion(rubriqueData.rubrique.id)
                      }
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center">
                            <Folder className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-slate-900">
                              {rubriqueData.rubrique.nom}
                            </h4>
                            <p className="text-sm text-slate-700 font-medium">
                              {rubriqueData.rubrique.description}
                            </p>
                            <div className="flex items-center gap-3 mt-1 text-xs text-slate-600 font-medium">
                              <span>
                                {rubriqueData.sousDossiers.length}{" "}
                                sous-dossier(s)
                              </span>
                              <span>{rubriqueData.totalPieces} pièce(s)</span>
                              <span>{rubriqueData.totalFiles} fichier(s)</span>
                            </div>
                          </div>
                        </div>
                        <div className="w-8 h-8 bg-slate-300 rounded-lg flex items-center justify-center border-2 border-slate-400">
                          {expandedRubriques.has(rubriqueData.rubrique.id) ? (
                            <ChevronDown className="w-4 h-4 text-slate-800" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-800" />
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Sous-dossiers de la rubrique */}
                    {expandedRubriques.has(rubriqueData.rubrique.id) && (
                      <div className="mt-3 space-y-2">
                        {rubriqueData.sousDossiers.map((sousDossierData) => (
                          <div
                            key={sousDossierData.sousDossier.id}
                            className="bg-white rounded-lg p-3 border-2 border-slate-300 shadow-sm"
                          >
                            {/* Header Sous-dossier */}
                            <div className="flex items-center justify-between mb-3">
                              <div className="flex items-center gap-2">
                                <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-md flex items-center justify-center">
                                  <FileText className="w-3 h-3 text-white" />
                                </div>
                                <div>
                                  <h5 className="font-semibold text-slate-900">
                                    {sousDossierData.sousDossier.titre}
                                  </h5>
                                  <p className="text-xs text-slate-700 font-medium">
                                    {sousDossierData.sousDossier.description}
                                  </p>
                                </div>
                              </div>
                              <span
                                className={`px-3 py-1 rounded-full text-xs font-bold border-2 ${getStatusColor(
                                  sousDossierData.sousDossier.statut
                                )}`}
                              >
                                {sousDossierData.sousDossier.statut}
                              </span>
                            </div>

                            {/* Pièces du sous-dossier */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                              {sousDossierData.pieces.map((pieceData) => (
                                <div
                                  key={pieceData.piece.id}
                                  className={`p-3 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                                    pieceData.hasFiles
                                      ? "border-green-300 bg-green-50 hover:bg-green-100"
                                      : "border-slate-300 bg-slate-50 hover:bg-slate-100"
                                  }`}
                                  onClick={() => onPieceClick?.(pieceData)}
                                >
                                  <div className="flex items-center gap-2 mb-2">
                                    <div
                                      className={`w-4 h-4 rounded-full flex items-center justify-center ${
                                        pieceData.hasFiles
                                          ? "bg-green-500"
                                          : "bg-slate-400"
                                      }`}
                                    >
                                      {pieceData.hasFiles ? (
                                        <Upload className="w-2 h-2 text-white" />
                                      ) : (
                                        <FileText className="w-2 h-2 text-white" />
                                      )}
                                    </div>
                                    <h6 className="font-semibold text-slate-900 text-sm">
                                      {pieceData.piece.nom}
                                    </h6>
                                  </div>
                                  {pieceData.piece.description && (
                                    <p className="text-xs text-slate-700 mb-2 font-medium">
                                      {pieceData.piece.description}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-2 text-xs text-slate-600 font-medium">
                                    {pieceData.metadata.length > 0 && (
                                      <div className="flex items-center gap-1">
                                        <Database className="w-3 h-3" />
                                        <span>{pieceData.metadata.length}</span>
                                      </div>
                                    )}
                                    {pieceData.hasFiles && (
                                      <div className="flex items-center gap-1">
                                        <Upload className="w-3 h-3" />
                                        <span>{pieceData.files.length}</span>
                                      </div>
                                    )}
                                    <div className="flex items-center gap-1">
                                      <Calendar className="w-3 h-3" />
                                      <span>
                                        {new Date(
                                          pieceData.piece.createdAt
                                        ).toLocaleDateString()}
                                      </span>
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
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

      {agentsData.length === 0 && !loading && (
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
