"use client";

import { useState, useMemo } from "react";
import {
  User,
  Folder,
  FileText,
  ChevronDown,
  ChevronRight,
  Upload,
  Mail,
  FolderOpen,
  Search,
} from "lucide-react";
import { useDossiersStore } from "@/store/dossiersStore";
import type { PieceData } from "@/services/agent-data";
import type { Agent } from "@/types";
import QuickUploadModal from "@/components/dossiers/QuickUploadModal";
import QuickCreateDossierModal from "@/components/dossiers/QuickCreateDossierModal";
import { DossiersOptimizedService } from "@/services/dossiers-optimized";
import RubriqueCard from "./AgentDataViewerOptimized/RubriqueCard";
import HighlightText from "@/components/ui/HighlightText";

interface AgentDataViewerOptimizedProps {
  searchTerm?: string;
  onPieceClick?: (piece: PieceData) => void;
  onCreditDossierClick?: (sousDossierId: number, rubriqueId: number, agentDossierId: number) => void;
  onDeleteDossier?: (agentDossierId: number, sousDossierTitre: string) => void;
}

export default function AgentDataViewerOptimized({
  searchTerm = "",
  onPieceClick,
  onCreditDossierClick,
  onDeleteDossier,
}: AgentDataViewerOptimizedProps) {
  // Utiliser des sélecteurs explicites pour forcer le re-render
  const allAgentsWithDossiers = useDossiersStore(
    (state) => state.agentsWithDossiers
  );
  const loading = useDossiersStore((state) => state.loading);

  // Filtrer les agents par le terme de recherche
  const agentsWithDossiers = useMemo(() => {
    if (!searchTerm.trim()) return allAgentsWithDossiers;
    const term = searchTerm.toLowerCase().trim();
    return allAgentsWithDossiers.filter((agentData) => {
      // Chercher dans le nom/prénom/email de l'agent
      const agentMatch =
        (agentData.agent.nom?.toLowerCase() || "").includes(term) ||
        (agentData.agent.prenom?.toLowerCase() || "").includes(term) ||
        `${agentData.agent.prenom} ${agentData.agent.nom}`.toLowerCase().includes(term) ||
        (agentData.agent.email?.toLowerCase() || "").includes(term);
      if (agentMatch) return true;

      // Chercher dans les noms de rubriques et sous-dossiers
      return agentData.dossiers.some((dossier) => {
        if (dossier.rubrique?.nom?.toLowerCase().includes(term)) return true;
        return dossier.sousDossiers?.some((sd) =>
          sd.titre?.toLowerCase().includes(term)
        );
      });
    });
  }, [allAgentsWithDossiers, searchTerm]);
  const [expandedAgents, setExpandedAgents] = useState<Set<string>>(new Set());
  const [expandedRubriques, setExpandedRubriques] = useState<Set<string>>(
    new Set()
  );
  const [showQuickUpload, setShowQuickUpload] = useState(false);
  const [selectedPieceForUpload, setSelectedPieceForUpload] = useState<{
    pieceData: PieceData;
    agentId: string;
    agentName: string;
    rubriqueId: string;
    rubriqueName: string;
    sousDossierId: string;
    sousDossierName: string;
    agentDossierId?: number;
  } | null>(null);
  // État pour suivre les pièces en cours de rafraîchissement
  const [refreshingPieces, setRefreshingPieces] = useState<Set<string>>(
    new Set()
  );
  // État pour la modale de création rapide
  const [showQuickCreate, setShowQuickCreate] = useState(false);
  const [selectedAgentForCreate, setSelectedAgentForCreate] =
    useState<Agent | null>(null);

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

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-4">
            <div className="absolute inset-0 border-4 border-primary-200 rounded-full"></div>
            <div className="absolute inset-0 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
          <p className="text-primary-800 font-semibold text-lg">
            Chargement des données...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Indicateur mode recherche */}
      {searchTerm.trim() && (
        <div className="flex items-center gap-3 px-5 py-3 bg-blue-50 border border-blue-200 rounded-xl animate-in fade-in slide-in-from-top-2 duration-300">
          <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center shadow-sm">
            <Search className="w-4 h-4 text-white" />
          </div>
          <p className="text-sm font-semibold text-blue-800">
            Recherche active : <span className="text-blue-600">&quot;{searchTerm.trim()}&quot;</span>
          </p>
          <span className="ml-auto px-3 py-1 bg-blue-500 text-white text-xs font-bold rounded-full">
            {agentsWithDossiers.length} résultat{agentsWithDossiers.length !== 1 ? "s" : ""}
          </span>
        </div>
      )}

      {/* Aucun résultat */}
      {searchTerm.trim() && agentsWithDossiers.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Search className="w-10 h-10 text-primary-300" />
          </div>
          <h4 className="text-lg font-bold text-primary-800 mb-1">Aucun résultat</h4>
          <p className="text-sm text-primary-500">Aucun agent ne correspond à &quot;{searchTerm.trim()}&quot;</p>
        </div>
      )}

      {/* Liste des agents */}
      {agentsWithDossiers.map((agentData) => {
        const totalPieces = agentData.dossiers.reduce(
          (sum, d) => sum + d.totalPieces,
          0
        );
        const totalSousDossiers = agentData.dossiers.reduce(
          (sum, d) => sum + d.totalSousDossiers,
          0
        );
        const isExpanded = searchTerm.trim()
          ? true  // Auto-expand agents en mode recherche
          : expandedAgents.has(agentData.agent.id);

        return (
          <div
            key={agentData.agent.id}
            className="group bg-white rounded-xl border border-slate-200 overflow-hidden transition-all duration-200 hover:shadow-lg hover:border-slate-300"
          >
            {/* Header Agent — Clean design */}
            <div
              className="relative cursor-pointer transition-colors hover:bg-slate-50"
              onClick={() => toggleAgentExpansion(agentData.agent.id)}
            >
              <div className="absolute top-0 left-0 right-0 h-0.5 bg-primary-600"></div>

              <div className="p-5">
                <div className="flex items-center justify-between gap-4">
                  {/* Left — Agent Info */}
                  <div className="flex items-center gap-4 flex-1 min-w-0">
                    {/* Avatar compact */}
                    <div className="relative flex-shrink-0">
                      <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white"></div>
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-bold text-slate-800 truncate">
                        <HighlightText text={`${agentData.agent.prenom} ${agentData.agent.nom}`} searchTerm={searchTerm} />
                      </h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Mail className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                        <p className="text-sm text-slate-500 truncate">
                          <HighlightText text={agentData.agent.email || "Aucun email"} searchTerm={searchTerm} />
                        </p>
                      </div>
                      {/* Inline stats */}
                      <div className="flex items-center gap-4 mt-2">
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <FolderOpen className="w-3.5 h-3.5 text-primary-500" />
                          <span className="font-semibold text-slate-700">{agentData.dossiers.length}</span> rubrique{agentData.dossiers.length > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <FileText className="w-3.5 h-3.5 text-blue-500" />
                          <span className="font-semibold text-slate-700">{totalPieces}</span> pièce{totalPieces > 1 ? "s" : ""}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-slate-500">
                          <Folder className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="font-semibold text-slate-700">{totalSousDossiers}</span> sous-dossier{totalSousDossiers > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right — Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAgentForCreate(agentData.agent);
                        setShowQuickCreate(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-xs font-semibold"
                      title="Créer rapidement un dossier"
                    >
                      <Upload className="w-3.5 h-3.5" /> Créer
                    </button>
                    <div className="w-9 h-9 bg-slate-100 rounded-lg flex items-center justify-center transition-colors hover:bg-slate-200">
                      {isExpanded ? (
                        <ChevronDown className="w-5 h-5 text-slate-500" />
                      ) : (
                        <ChevronRight className="w-5 h-5 text-slate-500" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded content */}
            {isExpanded && (
              <div className="border-t border-slate-100 bg-slate-50/50">
                <div className="p-5 space-y-4">
                  {agentData.dossiers.length === 0 ? (
                    <div className="text-center py-10">
                      <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                        <Folder className="w-7 h-7 text-slate-400" />
                      </div>
                      <h4 className="text-sm font-bold text-slate-700 mb-1">
                        Aucune rubrique avec des données
                      </h4>
                      <p className="text-xs text-slate-500">
                        Cet agent n&apos;a pas encore de données associées
                      </p>
                    </div>
                  ) : (
                    agentData.dossiers.map((dossier) => {
                      const isRubriqueExpanded = expandedRubriques.has(
                        dossier.rubrique.id
                      );

                      return (
                        <RubriqueCard
                          key={dossier.rubrique.id}
                          dossier={dossier}
                          isExpanded={isRubriqueExpanded}
                          searchTerm={searchTerm}
                          onToggleExpansion={() =>
                            toggleRubriqueExpansion(dossier.rubrique.id)
                          }
                          onCreditDossierClick={onCreditDossierClick}
                          onPieceClick={onPieceClick}
                          onDeleteDossier={onDeleteDossier}
                          refreshingPieces={refreshingPieces}
                          onUploadClick={({
                            piece,
                            sousDossier,
                            rubriqueId,
                          }) => {
                            const hasFiles =
                              piece.files && piece.files.length > 0;
                            setSelectedPieceForUpload({
                              pieceData: {
                                piece: {
                                  id: piece.id,
                                  nom: piece.nom,
                                  description: piece.description,
                                  has_meta: piece.aMetadonnees,
                                  createdAt: piece.createdAt,
                                  updatedAt: piece.updatedAt,
                                },
                                metadata: (piece.metadata || []).map(
                                  (meta: {
                                    id: string;
                                    meta_model_id: string;
                                    valeur: string;
                                    metadataModel?: {
                                      libelle: string;
                                      obligatoire: boolean;
                                    } | null;
                                    created_at: string;
                                  }) => ({
                                    id: meta.id,
                                    meta_model_id: meta.meta_model_id,
                                    valeur: meta.valeur,
                                    metadataModel: meta.metadataModel || null,
                                    created_at: meta.created_at,
                                  })
                                ),
                                files: (piece.files || []).map(
                                  (file: any) => {
                                    return {
                                      id: file.id,
                                      id_piece: file.piece_id || file.id_piece || file.pieceId,
                                      file_path: file.file_path || file.filePath || "",
                                      filePath: file.filePath || file.file_path || "", // On garde les deux pour être sûr
                                      created_at: file.created_at || file.createdAt,
                                      createdAt: file.createdAt || file.created_at,
                                      mimeType: file.mimeType || file.mime_type,
                                    };
                                  }
                                ),
                                hasFiles: hasFiles,
                                context: {
                                  agentId: agentData.agent.id,
                                  agentName: `${agentData.agent.prenom} ${agentData.agent.nom}`,
                                  rubriqueId: rubriqueId,
                                  rubriqueName: dossier.rubrique.nom,
                                  sousDossierId: sousDossier.id,
                                  sousDossierName: sousDossier.titre,
                                  agentDossierId: sousDossier.agentDossierId,
                                },
                              },
                              agentId: agentData.agent.id,
                              agentName: `${agentData.agent.prenom} ${agentData.agent.nom}`,
                              rubriqueId: rubriqueId,
                              rubriqueName: dossier.rubrique.nom,
                              sousDossierId: sousDossier.id,
                              sousDossierName: sousDossier.titre,
                              agentDossierId: sousDossier.agentDossierId,
                            });
                            setShowQuickUpload(true);
                          }}
                          agentId={agentData.agent.id}
                          agentName={`${agentData.agent.prenom} ${agentData.agent.nom}`}
                        />
                      );
                    })
                  )}
                </div>
              </div>
            )}
          </div>
        );
      })}

      {/* Empty State */}
      {agentsWithDossiers.length === 0 && !loading && (
        <div className="text-center py-20">
          <div className="w-32 h-32 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl border border-primary-300/50">
            <User className="w-16 h-16 text-primary-400" />
          </div>
          <h3 className="text-2xl font-bold text-primary-800 mb-3">
            Aucune donnée trouvée
          </h3>
          <p className="text-primary-800 font-semibold text-lg">
            Aucun agent n&apos;a encore de données associées.
          </p>
        </div>
      )}

      {/* Modal d'upload rapide */}
      {selectedPieceForUpload && (
        <QuickUploadModal
          isOpen={showQuickUpload}
          onClose={() => {
            setShowQuickUpload(false);
            setSelectedPieceForUpload(null);
          }}
          pieceData={selectedPieceForUpload.pieceData}
          agentId={selectedPieceForUpload.agentId}
          agentName={selectedPieceForUpload.agentName}
          rubriqueId={selectedPieceForUpload.rubriqueId}
          rubriqueName={selectedPieceForUpload.rubriqueName}
          sousDossierId={selectedPieceForUpload.sousDossierId}
          sousDossierName={selectedPieceForUpload.sousDossierName}
          agentDossierId={selectedPieceForUpload.agentDossierId}
          onUploadSuccess={async () => {
            // Rafraîchir uniquement les données de cette rubrique sans recharger toute la page
            const pieceId = selectedPieceForUpload.pieceData.piece.id;
            const rubriqueId = selectedPieceForUpload.rubriqueId;
            const agentId = selectedPieceForUpload.agentId;

            try {
              // Marquer la pièce comme en cours de rafraîchissement
              setRefreshingPieces((prev) => new Set(prev).add(pieceId));

              // S'assurer que la rubrique et l'agent sont ouverts pour voir la mise à jour
              // Mais seulement si ce n'était pas déjà le cas
              const wasRubriqueExpanded = expandedRubriques.has(rubriqueId);
              const wasAgentExpanded = expandedAgents.has(agentId);

              // Ouvrir l'agent et la rubrique si ce n'était pas déjà fait
              if (!wasAgentExpanded) {
                setExpandedAgents((prev) => new Set(prev).add(agentId));
              }
              if (!wasRubriqueExpanded) {
                setExpandedRubriques((prev) => new Set(prev).add(rubriqueId));
              }

              console.log("🔄 Début du rafraîchissement après upload...");
              await DossiersOptimizedService.reloadRubrique(rubriqueId);
              console.log("✅ Rafraîchissement terminé");

              // Forcer un re-render en récupérant les nouvelles données du store
              // Cela déclenchera un re-render car on utilise un sélecteur
              const { agentsWithDossiers: updated } =
                useDossiersStore.getState();
              console.log(
                "📊 agentsWithDossiers après mise à jour:",
                updated.length
              );

              // Attendre un peu pour laisser le temps au store de se mettre à jour
              await new Promise((resolve) => setTimeout(resolve, 100));

              // Retirer la pièce de la liste des pièces en cours de rafraîchissement
              setRefreshingPieces((prev) => {
                const newSet = new Set(prev);
                newSet.delete(pieceId);
                return newSet;
              });
            } catch (error) {
              console.error(
                "Erreur lors du rafraîchissement des données:",
                error
              );
              // Retirer la pièce même en cas d'erreur
              setRefreshingPieces((prev) => {
                const newSet = new Set(prev);
                newSet.delete(pieceId);
                return newSet;
              });
            }
          }}
        />
      )}

      {/* Modal de création rapide */}
      {selectedAgentForCreate && (
        <QuickCreateDossierModal
          isOpen={showQuickCreate}
          onClose={() => {
            setShowQuickCreate(false);
            setSelectedAgentForCreate(null);
          }}
          agent={selectedAgentForCreate}
          onSuccess={async () => {
            // Recharger tous les dossiers pour inclure les nouveaux agents
            await DossiersOptimizedService.loadDossiers(true);
          }}
        />
      )}
    </div>
  );
}
