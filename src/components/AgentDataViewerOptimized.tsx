"use client";

import { useState } from "react";
import {
  User,
  Folder,
  FileText,
  ChevronDown,
  ChevronRight,
  Upload,
  Mail,
  FolderOpen,
} from "lucide-react";
import { useDossiersStore } from "@/store/dossiersStore";
import type { PieceData } from "@/services/agent-data";
import type { Agent } from "@/types";
import QuickUploadModal from "@/components/dossiers/QuickUploadModal";
import QuickCreateDossierModal from "@/components/dossiers/QuickCreateDossierModal";
import { DossiersOptimizedService } from "@/services/dossiers-optimized";
import RubriqueCard from "./AgentDataViewerOptimized/RubriqueCard";

interface AgentDataViewerOptimizedProps {
  onPieceClick?: (piece: PieceData) => void;
  onCreditDossierClick?: (sousDossierId: number, rubriqueId: number) => void;
  onDeleteDossier?: (agentDossierId: number, sousDossierTitre: string) => void;
}

export default function AgentDataViewerOptimized({
  onPieceClick,
  onCreditDossierClick,
  onDeleteDossier,
}: AgentDataViewerOptimizedProps) {
  // Utiliser des sélecteurs explicites pour forcer le re-render
  const agentsWithDossiers = useDossiersStore(
    (state) => state.agentsWithDossiers
  );
  const loading = useDossiersStore((state) => state.loading);
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
        const isExpanded = expandedAgents.has(agentData.agent.id);

        return (
          <div
            key={agentData.agent.id}
            className="group bg-white rounded-2xl shadow-lg border border-primary-200/80 overflow-hidden transition-all duration-300 hover:shadow-2xl hover:border-primary-300"
          >
            {/* Header Agent - Design Premium */}
            <div
              className="relative cursor-pointer transition-all duration-300 hover:bg-gradient-to-r hover:from-primary-50 hover:to-white"
              onClick={() => toggleAgentExpansion(agentData.agent.id)}
            >
              {/* Gradient Accent Line */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[var(--color-accent-blue)] via-[var(--color-accent-purple)] to-[var(--color-accent-red)]"></div>

              <div className="p-8">
                <div className="flex items-start justify-between gap-6">
                  {/* Left Section - Agent Info */}
                  <div className="flex items-start gap-6 flex-1">
                    {/* Avatar Container */}
                    <div className="relative flex-shrink-0">
                      <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-accent-blue)] via-[var(--color-primary-600)] to-[var(--color-primary-700)] rounded-2xl flex items-center justify-center shadow-xl shadow-[var(--color-accent-blue)]/30 transform transition-transform duration-300 group-hover:scale-105 group-hover:rotate-3">
                        <User className="w-10 h-10 text-white" />
                      </div>
                      <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-success-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                        <div className="w-2 h-2 bg-white rounded-full"></div>
                      </div>
                    </div>

                    {/* Agent Details */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-primary-900 tracking-tight">
                          {agentData.agent.prenom} {agentData.agent.nom}
                        </h3>
                      </div>

                      {/* Email */}
                      <div className="flex items-center gap-2 mb-4">
                        <Mail className="w-4 h-4 text-primary-700 flex-shrink-0" />
                        <p className="text-primary-800 font-semibold text-sm truncate">
                          {agentData.agent.email || "Aucun email"}
                        </p>
                      </div>

                      {/* Stats Grid */}
                      <div className="grid grid-cols-3 gap-4">
                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[var(--color-accent-purple-light)] to-[var(--color-accent-purple-light)]/50 rounded-xl border border-[var(--color-accent-purple)]/20">
                          <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-accent-purple)] to-[var(--color-primary-600)] rounded-lg flex items-center justify-center shadow-md">
                            <FolderOpen className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-primary-800 font-semibold">
                              Rubriques
                            </p>
                            <p className="text-lg font-bold text-primary-900">
                              {agentData.dossiers.length}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-br from-[var(--color-accent-blue-light)] to-[var(--color-accent-blue-light)]/50 rounded-xl border border-[var(--color-accent-blue)]/20">
                          <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-accent-blue)] to-[var(--color-primary-600)] rounded-lg flex items-center justify-center shadow-md">
                            <FileText className="w-4 h-4 text-white" />
                          </div>
                          <div>
                            <p className="text-xs text-primary-800 font-semibold">
                              Pièces
                            </p>
                            <p className="text-lg font-bold text-primary-900">
                              {totalPieces}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 px-4 py-2.5  bg-primary-500 rounded-xl border border-success-200/50">
                          <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center shadow-md">
                            <Folder className="w-4 h-4 text-primary-700" />
                          </div>
                          <div>
                            <p className="text-xs text-primary-100 font-semibold">
                              Sous-dossiers
                            </p>
                            <p className="text-lg font-bold text-primary-100">
                              {totalSousDossiers}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Right Section - Actions */}
                  <div className="flex-shrink-0 flex items-center gap-3">
                    {/* Bouton Créer rapidement */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedAgentForCreate(agentData.agent);
                        setShowQuickCreate(true);
                      }}
                      className="flex items-center gap-2 px-5 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 text-sm font-bold border-2 border-primary-700"
                      title="Créer rapidement un dossier"
                    >
                      <Upload className="w-4 h-4 text-white" /> Créer
                    </button>
                    {/* Expand Button */}
                    <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center border-2 border-primary-700 shadow-lg transition-all duration-300 hover:bg-primary-700 hover:shadow-xl hover:scale-110">
                      {isExpanded ? (
                        <ChevronDown className="w-6 h-6 text-white transition-transform duration-300" />
                      ) : (
                        <ChevronRight className="w-6 h-6 text-white transition-transform duration-300" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Rubriques de l'agent - Expanded Content */}
            {isExpanded && (
              <div className="border-t border-primary-200 bg-gradient-to-br from-primary-50/50 to-white">
                <div className="p-8 space-y-6">
                  {agentData.dossiers.length === 0 ? (
                    <div className="text-center py-16">
                      <div className="w-24 h-24 bg-gradient-to-br from-primary-100 to-primary-200 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-lg border border-primary-300/50">
                        <Folder className="w-12 h-12 text-primary-400" />
                      </div>
                      <h4 className="text-xl font-bold text-primary-900 mb-2">
                        Aucune rubrique avec des données
                      </h4>
                      <p className="text-primary-800 font-semibold">
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
                                  (file: {
                                    id: string;
                                    piece_id: string;
                                    file_path: string;
                                    created_at: string;
                                  }) => ({
                                    id: file.id,
                                    id_piece: file.piece_id,
                                    file_path: file.file_path,
                                    created_at: file.created_at,
                                  })
                                ),
                                hasFiles: hasFiles,
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
