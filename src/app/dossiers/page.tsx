"use client";

import { useState, useEffect, useCallback, startTransition } from "react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { type PieceData, type PieceContext } from "@/services/agent-data";
import { DossiersOptimizedService } from "@/services/dossiers-optimized";
import { useDossiersStore } from "@/store/dossiersStore";
import { agentDossiersService } from "@/services/agent-dossiers";
import AgentDataViewerOptimized from "@/components/AgentDataViewerOptimized";
import PieceViewerModal from "@/components/PieceViewerModal";
import type { Rubrique, Agent } from "@/types";
import type { SousDossier } from "@/services/sous-dossiers";
import DossiersHeader from "@/components/dossiers/DossiersHeader";
import DossiersSearchBar from "@/components/dossiers/DossiersSearchBar";
import DeleteConfirmModal from "@/components/dossiers/DeleteConfirmModal";
import NouveauSousDossierModal from "@/components/dossiers/NouveauDossierModal";
import CreditDossierModal from "@/components/dossiers/CreditDossierModal";

interface ModalData {
  agent: Agent | null;
  rubrique: Rubrique | null;
  sousDossier: SousDossier | null;
  pieces: unknown[];
}

// Composant principal pour les dossiers
export default function DossiersPage() {
  // Utiliser le store Zustand au lieu du state local
  const { dossiers, loading, setDossiers } = useDossiersStore();

  const [searchTerm, setSearchTerm] = useState("");
  // const [expandedRubriques, setExpandedRubriques] = useState<Set<string>>(
  //   new Set()
  // );
  const [showNouveauModal, setShowNouveauModal] = useState(false);
  const [showPieceViewer, setShowPieceViewer] = useState(false);
  const [selectedPieceData, setSelectedPieceData] = useState<PieceData | null>(
    null
  );
  const [selectedPieceContext, setSelectedPieceContext] =
    useState<PieceContext | null>(null);
  const [showCreditViewer, setShowCreditViewer] = useState(false);
  const [selectedCreditSousDossier, setSelectedCreditSousDossier] = useState<{
    id: number;
    rubriqueId: number;
    agentDossierId: number;
  } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [dossierToDelete, setDossierToDelete] = useState<{
    id: number;
    titre: string;
  } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadDossiers = useCallback(
    async (forceRefresh: boolean = false) => {
      try {
        const dossiersData = await DossiersOptimizedService.loadDossiers(
          forceRefresh
        );
        setDossiers(dossiersData);
      } catch (error) {
        console.error("❌ Erreur lors du chargement des dossiers:", error);
      }
    },
    [setDossiers]
  );

  useEffect(() => {
    // Nettoyer l'ancien cache localStorage (migration: on n'utilise plus persist)
    try { localStorage.removeItem("dossiers-cache"); } catch (e) { /* ignore */ }
    // Vider le cache en mémoire au premier chargement pour toujours avoir les données fraîches
    const { clearCache } = useDossiersStore.getState();
    clearCache();
    loadDossiers(true); // Force refresh
  }, [loadDossiers]);

  // const toggleRubrique = (rubriqueId: string) => {
  //   const newExpanded = new Set(expandedRubriques);
  //   if (newExpanded.has(rubriqueId)) {
  //     newExpanded.delete(rubriqueId);
  //   } else {
  //     newExpanded.add(rubriqueId);
  //   }
  //   setExpandedRubriques(newExpanded);
  // };

  // const handleEditSousDossier = (sousDossier: SousDossierWithStats) => {
  //   // TODO: Implémenter l'édition du sous-dossier
  //   console.log("Éditer le sous-dossier:", sousDossier);
  // };

  // const handleDeleteSousDossier = (sousDossier: SousDossierWithStats) => {
  //   // TODO: Implémenter la suppression du sous-dossier
  //   console.log("Supprimer le sous-dossier:", sousDossier);
  // };

  // const handleViewSousDossier = (sousDossier: SousDossierWithStats) => {
  //   // TODO: Implémenter la vue détaillée du sous-dossier
  //   console.log("Voir le sous-dossier:", sousDossier);
  // };

  const handleRefresh = () => {
    console.log("🔄 Rafraîchissement forcé des dossiers...");
    loadDossiers(true);
  };

  const handleNouveauSousDossier = () => {
    setShowNouveauModal(true);
  };

  const handleCloseNouveauModal = () => {
    setShowNouveauModal(false);
  };

  const handleSaveNouveauSousDossier = (data: ModalData) => {
    console.log("Sauvegarder les données:", data);
    setShowNouveauModal(false);
  };

  const handlePieceClick = (pieceData: PieceData) => {
    setSelectedPieceData(pieceData);
    setSelectedPieceContext(pieceData.context || null);
    setShowPieceViewer(true);
  };
  const handlePieceFilesChanged = useCallback(
    async ({
      files,
      context,
    }: {
      files: PieceData["files"];
      context?: PieceContext | null;
    }) => {
      // Utiliser startTransition pour éviter l'erreur "Cannot update during render"
      startTransition(() => {
        setSelectedPieceData((prev) =>
          prev ? { ...prev, files, hasFiles: files.length > 0 } : prev
        );
      });

      if (context?.rubriqueId) {
        try {
          await DossiersOptimizedService.reloadRubrique(context.rubriqueId);
        } catch (error) {
          console.error(
            "Erreur lors du rafraîchissement après suppression de fichier:",
            error
          );
        }
      }
    },
    []
  );

  const handleCreditDossierClick = (
    sousDossierId: number,
    rubriqueId: number,
    agentDossierId: number
  ) => {
    setSelectedCreditSousDossier({ id: sousDossierId, rubriqueId, agentDossierId });
    setShowCreditViewer(true);
  };

  const handleDeleteDossier = (
    agentDossierId: number,
    sousDossierTitre: string
  ) => {
    setDossierToDelete({ id: agentDossierId, titre: sousDossierTitre });
    setShowDeleteConfirm(true);
  };

  const confirmDeleteDossier = async () => {
    if (!dossierToDelete) return;

    setIsDeleting(true);
    try {
      await agentDossiersService.deleteAgentDossier(
        dossierToDelete.id.toString()
      );
      // Rafraîchir les données
      await loadDossiers(true);
      setShowDeleteConfirm(false);
      setDossierToDelete(null);
    } catch (error) {
      console.error("Erreur lors de la suppression du dossier:", error);
      alert("Erreur lors de la suppression du dossier");
    } finally {
      setIsDeleting(false);
    }
  };

  // Utiliser le store pour obtenir l'état du cache
  const { isCacheValid, lastFetch } = useDossiersStore();

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="min-h-screen bg-gradient-to-br from-slate-100 via-white to-slate-200 flex items-center justify-center">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-slate-300 border-t-slate-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-600 font-medium">
                Chargement des dossiers...
              </p>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  const totalSousDossiers = dossiers.reduce(
    (sum, d) => sum + d.totalSousDossiers,
    0
  );
  const totalPieces = dossiers.reduce((sum, d) => sum + d.totalPieces, 0);
  const totalMetadata = dossiers.reduce((sum, d) => sum + d.totalMetadata, 0);

  return (
    <AuthGuard>
      <DashboardLayout>
        <DossiersHeader
          totalSousDossiers={totalSousDossiers}
          totalPieces={totalPieces}
          totalMetadata={totalMetadata}
          isCacheValid={isCacheValid()}
          lastFetch={lastFetch}
          onRefresh={handleRefresh}
        />

        <DossiersSearchBar
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          onNewDossier={handleNouveauSousDossier}
        />

        {/* Liste des dossiers */}
        <div className="space-y-6">
          <AgentDataViewerOptimized
            searchTerm={searchTerm}
            onPieceClick={handlePieceClick}
            onCreditDossierClick={handleCreditDossierClick}
            onDeleteDossier={handleDeleteDossier}
          />
        </div>

        {/* Modal Nouveau Sous-dossier */}
        <NouveauSousDossierModal
          isOpen={showNouveauModal}
          onClose={handleCloseNouveauModal}
          onSave={handleSaveNouveauSousDossier}
          onReset={loadDossiers}
        />

        {/* Modal de consultation des pièces */}
        <PieceViewerModal
          isOpen={showPieceViewer}
          onClose={() => {
            setShowPieceViewer(false);
            setSelectedPieceContext(null);
          }}
          pieceData={selectedPieceData}
          pieceContext={selectedPieceContext}
          onFilesChanged={handlePieceFilesChanged}
        />

        {showCreditViewer && selectedCreditSousDossier && (
          <CreditDossierModal
            isOpen={showCreditViewer}
            sousDossierId={selectedCreditSousDossier.id}
            rubriqueId={selectedCreditSousDossier.rubriqueId}
            agentDossierId={selectedCreditSousDossier.agentDossierId}
            onClose={() => {
              setShowCreditViewer(false);
              setSelectedCreditSousDossier(null);
            }}
          />
        )}

        <DeleteConfirmModal
          isOpen={showDeleteConfirm}
          dossierTitle={dossierToDelete?.titre || ""}
          isDeleting={isDeleting}
          onConfirm={confirmDeleteDossier}
          onCancel={() => {
            setShowDeleteConfirm(false);
            setDossierToDelete(null);
          }}
        />

      </DashboardLayout>
    </AuthGuard>
  );
}
