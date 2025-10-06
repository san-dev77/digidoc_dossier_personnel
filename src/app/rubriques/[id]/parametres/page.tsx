"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  FolderPlus,
  Settings,
  FileText,
  ChevronDown,
  ChevronRight,
  File,
  Sparkles,
  Zap,
  FolderTree,
  Trash2,
  DatabaseZap,
  Edit,
  Eye,
  Database,
  SquarePen,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import SousDossierForm from "@/components/SousDossierForm";
import PieceForm from "@/components/PieceForm";
import MetadataForm from "@/components/MetadataForm";
import MetadataViewer from "@/components/MetadataViewer";
import { ToastContainer, useToast } from "@/components/Toast";
import { usePiecesStore } from "@/store/piecesStore";
import { rubriquesService } from "@/services/rubriques";
import CreditMetadataManager from "@/components/CreditMetadataManager";
import { isDossierCredit } from "@/utils/rubrique-utils";
import { MetadataService } from "@/services/metadata";

// Composant réactif pour le badge de comptage des pièces
function PieceCountBadge({ sousDossierId }: { sousDossierId: string }) {
  const pieceCount = usePiecesStore((state) =>
    state.getPieceCount(sousDossierId)
  );

  return (
    <span className="text-emerald-700 font-semibold text-sm transition-all duration-300 transform">
      <span className="inline-block" key={pieceCount}>
        {pieceCount}
        {"    "}
      </span>
      {"    "} pièce{pieceCount !== 1 ? "s" : ""}
    </span>
  );
}

import {
  sousDossiersService,
  SousDossier,
  SousDossierFormData,
} from "@/services/sous-dossiers";
import { piecesService } from "@/services/pieces";
import type {
  Piece,
  PieceFormData,
  PieceWithMetadata,
  MetadataModel,
} from "@/types";
import { Rubrique } from "@/types";

export default function RubriqueParametresPage() {
  const router = useRouter();
  const params = useParams();
  const rubriqueId = params.id as string;

  const [rubrique, setRubrique] = useState<Rubrique | null>(null);
  const [sousDossiers, setSousDossiers] = useState<SousDossier[]>([]);
  const [pieces, setPieces] = useState<Piece[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showPieceForm, setShowPieceForm] = useState(false);
  const [selectedSousDossier, setSelectedSousDossier] = useState<string | null>(
    null
  );
  const [expandedSousDossier, setExpandedSousDossier] = useState<string | null>(
    null
  );
  const [sousDossierPieces, setSousDossierPieces] = useState<
    Record<string, PieceWithMetadata[]>
  >({});
  const [selectedPiece, setSelectedPiece] = useState<PieceWithMetadata | null>(
    null
  );
  const [showEditPieceForm, setShowEditPieceForm] = useState(false);
  const [showMetadataForm, setShowMetadataForm] = useState(false);
  const [selectedPieceForMetadata, setSelectedPieceForMetadata] =
    useState<PieceWithMetadata | null>(null);
  const [showMetadataViewer, setShowMetadataViewer] = useState(false);
  const [selectedPieceForView, setSelectedPieceForView] =
    useState<PieceWithMetadata | null>(null);
  const [selectedMetadata, setSelectedMetadata] =
    useState<MetadataModel | null>(null);
  const [showEditMetadataForm, setShowEditMetadataForm] = useState(false);
  const [selectedSousDossierForEdit, setSelectedSousDossierForEdit] =
    useState<SousDossier | null>(null);
  const [showEditSousDossierForm, setShowEditSousDossierForm] = useState(false);
  const [showCreditMetadataManager, setShowCreditMetadataManager] =
    useState(false);
  const [selectedSousDossierForMetadata, setSelectedSousDossierForMetadata] =
    useState<string | null>(null);
  const { toasts, removeToast, success, error: showError } = useToast();

  useEffect(() => {
    if (rubriqueId) {
      loadRubrique();
      loadSousDossiers();
      loadPieces();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rubriqueId]);

  const loadRubrique = async () => {
    try {
      const data = await rubriquesService.getRubriqueById(rubriqueId);
      if (data) {
        setRubrique(data);
      } else {
        setError("Rubrique non trouvée");
      }
    } catch (err) {
      console.error("Erreur lors du chargement de la rubrique:", err);
      setError("Erreur lors du chargement de la rubrique");
    }
  };

  const loadSousDossiers = async () => {
    try {
      setLoading(true);
      const data = await sousDossiersService.getAllSousDossiersByRubrique(
        rubriqueId
      );
      setSousDossiers(data);

      // Précharger les compteurs de pièces pour chaque sous-dossier
      for (const sousDossier of data) {
        try {
          const pieces = await piecesService.getAllPiecesBySousDossier(
            sousDossier.id
          );
          usePiecesStore.getState().setPieces(sousDossier.id, pieces);
        } catch (err) {
          console.error(
            `Erreur lors du préchargement des pièces pour ${sousDossier.id}:`,
            err
          );
        }
      }
    } catch (err) {
      console.error("Erreur lors du chargement des sous-dossiers:", err);
      setError("Erreur lors du chargement des sous-dossiers");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSousDossier = () => {
    setShowCreateForm(true);
  };

  const handleEditSousDossier = (sousDossier: SousDossier) => {
    setSelectedSousDossierForEdit(sousDossier);
    setShowEditSousDossierForm(true);
  };

  const handleManageCreditMetadata = (sousDossierId: string) => {
    setSelectedSousDossierForMetadata(sousDossierId);
    setShowCreditMetadataManager(true);
  };

  const handleDeleteSousDossier = async (sousDossier: SousDossier) => {
    if (
      !confirm(
        `Êtes-vous sûr de vouloir supprimer le sous-dossier "${sousDossier.titre}" et toutes ses pièces ?`
      )
    ) {
      return;
    }

    try {
      console.log("🗑️ Suppression du sous-dossier:", sousDossier);

      await sousDossiersService.deleteSousDossier(sousDossier.id);

      // Mettre à jour la liste des sous-dossiers
      setSousDossiers(sousDossiers.filter((sd) => sd.id !== sousDossier.id));

      // Nettoyer le store Zustand
      usePiecesStore.getState().clearPieces(sousDossier.id);

      // Fermer l'expansion si c'était ce sous-dossier
      if (expandedSousDossier === sousDossier.id) {
        setExpandedSousDossier(null);
      }

      success(
        "Sous-dossier supprimé",
        `Le sous-dossier "${sousDossier.titre}" a été supprimé avec succès.`
      );
    } catch (err) {
      console.error("❌ Erreur lors de la suppression du sous-dossier:", err);
      showError(
        "Erreur de suppression",
        "Impossible de supprimer le sous-dossier. Veuillez réessayer."
      );
    }
  };

  const loadPieces = async () => {
    try {
      const data = await piecesService.getAllPiecesByRubrique(rubriqueId);
      setPieces(data);
    } catch (err) {
      console.error("Erreur lors du chargement des pièces:", err);
    }
  };

  const handleSubmitSousDossier = async (formData: SousDossierFormData) => {
    try {
      const newSousDossier = await sousDossiersService.createSousDossier(
        formData
      );
      setSousDossiers([newSousDossier, ...sousDossiers]);
      setShowCreateForm(false);
      success(
        "Sous-dossier créé",
        `Le sous-dossier "${newSousDossier.titre}" a été créé avec succès.`
      );
    } catch (err) {
      console.error("Erreur lors de la création du sous-dossier:", err);
      showError(
        "Erreur de création",
        "Impossible de créer le sous-dossier. Veuillez réessayer."
      );
    }
  };

  const handleSubmitEditSousDossier = async (formData: SousDossierFormData) => {
    if (!selectedSousDossierForEdit) return;

    try {
      console.log(
        "🔧 Modification du sous-dossier:",
        selectedSousDossierForEdit
      );
      console.log("📝 Nouvelles données:", formData);

      const updatedSousDossier = await sousDossiersService.updateSousDossier(
        selectedSousDossierForEdit.id,
        formData
      );

      // Mettre à jour la liste des sous-dossiers
      setSousDossiers(
        sousDossiers.map((sd) =>
          sd.id === selectedSousDossierForEdit.id ? updatedSousDossier : sd
        )
      );

      // Fermer la modal
      setShowEditSousDossierForm(false);
      setSelectedSousDossierForEdit(null);

      success(
        "Sous-dossier modifié",
        `Le sous-dossier "${updatedSousDossier.titre}" a été mis à jour avec succès.`
      );
    } catch (err) {
      console.error("❌ Erreur lors de la modification du sous-dossier:", err);
      showError(
        "Erreur de modification",
        "Impossible de modifier le sous-dossier. Veuillez réessayer."
      );
    }
  };

  const handleCreatePiece = (sousDossierId: string) => {
    setSelectedSousDossier(sousDossierId);
    setShowPieceForm(true);
  };

  const loadSousDossierPieces = async (sousDossierId: string) => {
    try {
      const pieces = await piecesService.getPiecesWithMetadata(sousDossierId);
      setSousDossierPieces((prev) => ({
        ...prev,
        [sousDossierId]: pieces,
      }));
    } catch (err) {
      console.error("Erreur lors du chargement des pièces:", err);
    }
  };

  const toggleSousDossierExpansion = async (sousDossierId: string) => {
    if (expandedSousDossier === sousDossierId) {
      setExpandedSousDossier(null);
    } else {
      setExpandedSousDossier(sousDossierId);
      if (!sousDossierPieces[sousDossierId]) {
        await loadSousDossierPieces(sousDossierId);
      }
    }
  };

  const handleSubmitPiece = async (formData: PieceFormData) => {
    if (!selectedSousDossier) return;

    try {
      const newPiece = await piecesService.createPiece(
        selectedSousDossier,
        formData
      );

      setPieces([newPiece, ...pieces]);

      // Mettre à jour le store Zustand pour le badge
      usePiecesStore.getState().addPiece(selectedSousDossier, newPiece);

      // Rafraîchir les pièces du sous-dossier si il est ouvert
      if (expandedSousDossier === selectedSousDossier) {
        await loadSousDossierPieces(selectedSousDossier);
      }

      // Fermer le modal d'abord
      setShowPieceForm(false);
      setSelectedSousDossier(null);

      // Animation de succès discrète - géré par les notifications
    } catch (err) {
      console.error("Erreur lors de l'ajout de la pièce:", err);
      showError(
        "Erreur de création",
        "Impossible de créer la pièce. Veuillez réessayer."
      );
    }
  };

  const handleEditPiece = (piece: PieceWithMetadata) => {
    setSelectedPiece(piece);
    setShowEditPieceForm(true);
  };

  const handleSubmitEditPiece = async (formData: PieceFormData) => {
    if (!selectedPiece) return;

    try {
      console.log("🔧 Modification de la pièce:", selectedPiece);
      console.log("📝 Nouvelles données:", formData);

      const updatedPiece = await piecesService.updatePiece(selectedPiece.id, {
        nom: formData.nom,
        description: formData.description,
        aMetadonnees: formData.has_meta,
      });

      console.log("✅ Pièce mise à jour:", updatedPiece);

      // Mettre à jour la liste des pièces
      setPieces(
        pieces.map((p) => (p.id === selectedPiece.id ? updatedPiece : p))
      );

      // Mettre à jour le store Zustand si on a le sousDossierId
      const sousDossierId = selectedPiece.sousDossierId || expandedSousDossier;
      if (sousDossierId) {
        usePiecesStore.getState().updatePiece(sousDossierId, updatedPiece);
      }

      // Rafraîchir les pièces du sous-dossier si il est ouvert
      if (expandedSousDossier) {
        await loadSousDossierPieces(expandedSousDossier);
      }

      // Fermer le modal
      setShowEditPieceForm(false);
      setSelectedPiece(null);

      success(
        "Pièce modifiée",
        `La pièce "${updatedPiece.nom}" a été mise à jour avec succès.`
      );
    } catch (err) {
      console.error("❌ Erreur lors de la modification de la pièce:", err);
      showError(
        "Erreur de modification",
        "Impossible de modifier la pièce. Veuillez réessayer."
      );
    }
  };

  const handleDeletePiece = async (piece: PieceWithMetadata) => {
    if (
      !confirm(`Êtes-vous sûr de vouloir supprimer la pièce "${piece.nom}" ?`)
    ) {
      return;
    }

    try {
      await piecesService.deletePiece(piece.id);

      // Rafraîchir les pièces du sous-dossier
      if (expandedSousDossier) {
        await loadSousDossierPieces(expandedSousDossier);
      }

      success(
        "Pièce supprimée",
        `La pièce "${piece.nom}" a été supprimée avec succès.`
      );
    } catch (err) {
      console.error("Erreur lors de la suppression de la pièce:", err);
      showError(
        "Erreur de suppression",
        "Impossible de supprimer la pièce. Veuillez réessayer."
      );
    }
  };

  const handleViewPieceDetails = (piece: PieceWithMetadata) => {
    setSelectedPieceForView(piece);
    setShowMetadataViewer(true);
  };

  const handleSubmitEditMetadata = async (
    formData: Omit<MetadataModel, "id" | "createdAt" | "updatedAt">[]
  ) => {
    if (!selectedMetadata) return;

    try {
      console.log("🔧 Modification de la métadonnée:", selectedMetadata);
      console.log("📝 Nouvelles données:", formData[0]); // Prendre le premier élément

      await MetadataService.updateMetadata(parseInt(selectedMetadata.id), {
        nom_meta: formData[0].nom,
        type_meta: formData[0].type,
      });

      // Rafraîchir les pièces du sous-dossier
      if (expandedSousDossier) {
        await loadSousDossierPieces(expandedSousDossier);
      }

      success(
        "Métadonnée modifiée",
        `La métadonnée "${formData[0].nom}" a été mise à jour avec succès.`
      );

      // Fermer la modale
      setShowEditMetadataForm(false);
      setSelectedMetadata(null);
    } catch (err) {
      console.error("❌ Erreur lors de la modification de la métadonnée:", err);
      showError(
        "Erreur de modification",
        "Impossible de modifier la métadonnée. Veuillez réessayer."
      );
    }
  };

  const handleAddMetadata = (piece: PieceWithMetadata) => {
    setSelectedPieceForMetadata(piece);
    setShowMetadataForm(true);
  };

  const handleSubmitMetadata = async (
    metadata: Omit<MetadataModel, "id" | "createdAt" | "updatedAt">[]
  ) => {
    if (!selectedPieceForMetadata) return;

    try {
      console.log("💾 Sauvegarde des métadonnées:", metadata);
      console.log("📄 Pour la pièce:", selectedPieceForMetadata);

      // Créer l'API call pour sauvegarder les modèles de métadonnées
      const response = await fetch(
        `/api/pieces/${selectedPieceForMetadata.id}/metadata-models`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ metadataModels: metadata }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message ||
            "Erreur lors de la sauvegarde des modèles de métadonnées"
        );
      }

      const result = await response.json();
      console.log("✅ Modèles de métadonnées sauvegardés:", result);

      // Rafraîchir les pièces du sous-dossier
      if (expandedSousDossier) {
        await loadSousDossierPieces(expandedSousDossier);
      }

      success(
        "Modèles de métadonnées créés",
        `${
          result.models?.length || 0
        } modèle(s) de métadonnées configuré(s) pour "${
          selectedPieceForMetadata.nom
        }"`
      );

      // Fermer la modale
      setShowMetadataForm(false);
      setSelectedPieceForMetadata(null);
    } catch (err) {
      console.error(
        "❌ Erreur lors de l'ajout des modèles de métadonnées:",
        err
      );
      showError(
        "Erreur d'ajout",
        err instanceof Error
          ? err.message
          : "Impossible d'ajouter les modèles de métadonnées. Veuillez réessayer."
      );
    }
  };

  // Composant pour le contenu des pièces d'un sous-dossier
  const SousDossierPiecesContent = ({
    sousDossierId,
    pieces,
    onCreatePiece,
  }: {
    sousDossierId: string;
    pieces: PieceWithMetadata[];
    onCreatePiece: (id: string) => void;
  }) => {
    if (pieces.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="relative mx-auto w-16 h-16 mb-6">
            <div className="w-full h-full bg-primary-100 rounded-xl flex items-center justify-center">
              <File className="w-8 h-8 text-primary-500" />
            </div>
          </div>
          <h3 className="text-lg font-semibold text-primary-800 mb-2">
            Aucun document dans ce dossier
          </h3>
          <p className="text-sm text-neutral-600 mb-6 max-w-md mx-auto">
            Ce dossier est vide. Ajoutez votre premier document pour commencer à
            organiser vos fichiers.
          </p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onCreatePiece(sousDossierId);
            }}
            className="button-primary inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold hover:scale-105 transition-transform duration-200"
          >
            <Plus className="w-4 h-4" />
            Ajouter le premier document
          </button>
        </div>
      );
    }

    return (
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-3 h-8 bg-gradient-to-b from-accent-blue to-blue-600 rounded-full"></div>
            <div>
              <h3 className="text-xl font-bold text-gray-900">
                Documents dans ce dossier
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                {pieces.length} document{pieces.length !== 1 ? "s" : ""} trouvé
                {pieces.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-xs text-primary-600 bg-primary-100 px-3 py-1.5 rounded-lg">
              {pieces.filter((p) => p.aMetadonnees).length} avec métadonnées
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onCreatePiece(sousDossierId);
              }}
              className="button-primary btn-sm gap-2"
            >
              <Plus className="w-4 h-4" />
              Ajouter un document
            </button>
          </div>
        </div>
        <div className="overflow-x-auto content-scrollbar">
          <table className="table table-zebra w-full">
            <thead>
              <tr className="bg-primary-50 border-b border-primary-600">
                <th className="text-primary-700 font-semibold">#</th>
                <th className="text-primary-700 font-semibold">
                  Nom du document
                </th>
                <th className="text-primary-700 font-semibold">Description</th>
                <th className="text-primary-700 font-semibold">Métadonnées</th>
                <th className="text-primary-700 font-semibold">
                  Date de création
                </th>
                <th className="text-primary-700 font-semibold text-center">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {pieces.map((piece, index) => (
                <tr
                  key={piece.id}
                  className="hover:bg-primary-25 border-b border-primary-600 bg-primary-100"
                >
                  <td>
                    <div className="w-8 h-8 bg-primary-200 rounded-lg flex items-center justify-center text-sm font-bold text-primary-700">
                      {index + 1}
                    </div>
                  </td>
                  <td>
                    <div className="font-semibold text-primary-900 flex items-center gap-2">
                      <File className="w-4 h-4 text-primary-600" />
                      {piece.nom}
                    </div>
                  </td>
                  <td>
                    <div className="text-primary-700 text-sm max-w-xs truncate">
                      {piece.description || "-"}
                    </div>
                  </td>
                  <td>
                    <span
                      className={`badge badge-outline ${
                        piece.aMetadonnees
                          ? "bg-success-50 text-success-700 border-success-300"
                          : "bg-warning-50 text-warning-700 border-warning-300"
                      }`}
                    >
                      {piece.aMetadonnees
                        ? "Avec métadonnées"
                        : "Sans métadonnées"}
                    </span>
                  </td>
                  <td>
                    <span className="text-primary-600 text-sm">
                      {new Date(piece.createdAt).toLocaleDateString("fr-FR")}
                    </span>
                  </td>
                  <td>
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleViewPieceDetails(piece)}
                        className="btn btn-ghost btn-sm hover:bg-primary-100"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4 text-primary-600" />
                      </button>
                      <button
                        onClick={() => handleEditPiece(piece)}
                        className="btn btn-ghost btn-sm hover:bg-primary-100"
                        title="Modifier"
                      >
                        <Edit className="w-4 h-4 text-primary-600" />
                      </button>
                      {/* Bouton métadonnées des pièces - caché pour les dossiers de crédit */}
                      {rubrique && !isDossierCredit(rubrique) && (
                        <button
                          onClick={() => handleAddMetadata(piece)}
                          className="btn btn-ghost btn-sm hover:bg-accent-purple-light"
                          title="Gérer métadonnées"
                        >
                          <Database className="w-4 h-4 text-accent-purple" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDeletePiece(piece)}
                        className="btn btn-ghost btn-sm hover:bg-accent-red-light"
                        title="Supprimer"
                      >
                        <Trash2 className="w-4 h-4 text-accent-red" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  if (error || !rubrique) {
    return (
      <AuthGuard>
        <DashboardLayout>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {error || "Rubrique non trouvée"}
              </h3>
              <p className="text-gray-600 mb-4">
                La rubrique que vous recherchez n&apos;existe pas ou a été
                supprimée.
              </p>
              <button
                onClick={() => router.push("/rubriques")}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors"
              >
                Retour aux rubriques
              </button>
            </div>
          </div>
        </DashboardLayout>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          {/* Header avec navigation */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push("/rubriques")}
                className="p-3 hover:bg-primary-100 rounded-xl transition-all group border border-primary-200"
                title="Retour aux rubriques"
              >
                <ArrowLeft className="w-5 h-5 text-primary-600 group-hover:text-primary-700 transition-colors" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-primary-800">
                      Configuration
                    </h1>
                    <p className="text-primary-600 font-semibold text-lg">
                      {rubrique.nom}
                    </p>
                  </div>
                </div>
                <p className="text-neutral-600 max-w-2xl text-lg">
                  {rubrique.description}
                </p>
              </div>
              <button
                onClick={handleCreateSousDossier}
                className="button-primary flex items-center gap-2 text-sm font-medium"
              >
                <FolderPlus className="w-4 h-4" />
                Nouveau Sous-dossier
              </button>
            </div>

            {/* Informations de la rubrique */}
            <div className="card-accent p-8 mb-8 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-primary-200 to-primary-300 rounded-full -translate-y-20 translate-x-20 opacity-50"></div>
              <div className="relative">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-6 mb-6">
                      <div className="w-16 h-16 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
                        <FileText className="w-8 h-8 text-white" />
                      </div>
                      <div>
                        <h2 className="text-2xl font-bold text-primary-800 mb-2">
                          {rubrique.nom}
                        </h2>
                        <p className="text-neutral-700 text-lg">
                          {rubrique.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                      <div className="flex items-center gap-3 bg-white/70 px-4 py-2 rounded-xl">
                        <FolderPlus className="w-5 h-5 text-primary-600" />
                        <span className="text-neutral-700 font-medium">
                          {sousDossiers.length} sous-dossier
                          {sousDossiers.length > 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Statistiques */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-primary-600 mb-2">
                    Sous-dossiers
                  </p>
                  <p className="text-4xl font-bold text-primary-800 mb-1">
                    {sousDossiers.length}
                  </p>
                  <p className="text-sm text-neutral-600">
                    {sousDossiers.length === 0 ? "Aucun créé" : "Total créés"}
                  </p>
                </div>
                <div className="bg-accent-blue-light p-4 rounded-2xl">
                  <FolderPlus className="w-8 h-8 text-accent-blue" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-accent-green mb-2">
                    Documents
                  </p>
                  <p className="text-4xl font-bold text-primary-800 mb-1">
                    {pieces.length}
                  </p>
                  <p className="text-sm text-neutral-600">
                    Dans tous les dossiers
                  </p>
                </div>
                <div className="bg-accent-green-light p-4 rounded-2xl">
                  <FileText className="w-8 h-8 text-accent-green" />
                </div>
              </div>
            </div>

            <div className="stat-card">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-accent-purple mb-2">
                    Avec métadonnées
                  </p>
                  <p className="text-4xl font-bold text-primary-800 mb-1">
                    {pieces.filter((p) => p.aMetadonnees).length}
                  </p>
                  <p className="text-sm text-neutral-600">Documents enrichis</p>
                </div>
                <div className="bg-accent-purple-light p-4 rounded-2xl">
                  <Sparkles className="w-8 h-8 text-accent-purple" />
                </div>
              </div>
            </div>
          </div>

          {/* Section des sous-dossiers */}
          <div className="card-elevated">
            {/* Header avec titre */}
            <div className="p-8 border-b border-primary-200">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-primary-800">
                    Gestion de la Rubrique
                  </h3>
                  <p className="text-neutral-700 mt-2 text-lg">
                    Organisez les sous-dossiers, pièces et personnel
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleCreateSousDossier}
                    className="button-primary flex items-center gap-2 text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Nouveau Sous-dossier
                  </button>
                </div>
              </div>
            </div>

            <div className="p-8">
              {sousDossiers.length === 0 ? (
                <div className="text-center py-20">
                  <div className="relative mx-auto w-28 h-28 mb-8">
                    <div className="absolute inset-0 bg-primary-200 rounded-3xl opacity-30"></div>
                    <div className="relative w-full h-full bg-primary-600 rounded-3xl flex items-center justify-center shadow-xl">
                      <FolderPlus className="w-14 h-14 text-white" />
                    </div>
                    <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-lg">
                      <Sparkles className="w-4 h-4 text-white" />
                    </div>
                  </div>
                  <h4 className="text-3xl font-bold text-gray-800 mb-4">
                    Aucun sous-dossier créé
                  </h4>
                  <p className="text-gray-600 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
                    Créez votre premier sous-dossier pour organiser les
                    documents de cette rubrique de manière structurée.
                  </p>
                  <button
                    onClick={handleCreateSousDossier}
                    className="group bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-10 py-4 rounded-2xl font-semibold flex items-center gap-3 mx-auto shadow-lg text-lg"
                  >
                    <FolderPlus className="w-6 h-6" />
                    <span>Créer le premier sous-dossier</span>
                    <Zap className="w-5 h-5" />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {sousDossiers.map((sousDossier) => (
                    <div
                      key={sousDossier.id}
                      className="card-elevated hover:shadow-primary-lg"
                    >
                      {/* Header du sous-dossier */}
                      <div
                        className="p-4 bg-primary-300 hover:bg-primary-600 transition-all duration-300 hover:text-white rounded-lg cursor-pointer"
                        onClick={() =>
                          toggleSousDossierExpansion(sousDossier.id)
                        }
                      >
                        <div className="flex items-center justify-between relative z-10">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            {/* Chevron compact */}
                            <div className="flex-shrink-0">
                              {expandedSousDossier === sousDossier.id ? (
                                <div className="w-5 h-5 bg-primary-700 rounded flex items-center justify-center shadow-sm transform rotate-180">
                                  <ChevronDown className="w-3 h-3 text-white" />
                                </div>
                              ) : (
                                <div className="w-5 h-5 bg-primary-400 rounded flex items-center justify-center shadow-sm group-hover:bg-primary-600">
                                  <ChevronRight className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>

                            {/* Icône compacte */}
                            <div className="flex-shrink-0">
                              <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg">
                                <FolderTree className="w-5 h-5 text-white" />
                              </div>
                            </div>

                            {/* Contenu principal */}
                            <div className="flex-1 min-w-0">
                              <h4 className="text-base font-semibold text-primary-800 group-hover:text-primary-700 truncate">
                                {sousDossier.titre}
                              </h4>
                              <p className="text-xs text-neutral-600 truncate">
                                {sousDossier.description}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 flex-shrink-0">
                            {/* Badge compact */}
                            <div className="flex items-center gap-1 bg-accent-green-light border border-accent-green px-2 py-1 rounded-lg text-xs">
                              <FileText className="w-3 h-3 text-accent-green" />
                              <PieceCountBadge sousDossierId={sousDossier.id} />
                            </div>

                            {/* Boutons d'action compacts */}
                            <div className="flex items-center gap-1 opacity-100">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreatePiece(sousDossier.id);
                                }}
                                className="p-1.5 bg-green-50 text-green-700 hover:bg-green-100 rounded border border-green-200"
                                title="Ajouter une pièce"
                              >
                                <Plus className="w-4 h-4" />
                              </button>

                              {/* Bouton métadonnées de crédit - seulement pour les dossiers de crédit */}
                              {rubrique && isDossierCredit(rubrique) && (
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleManageCreditMetadata(sousDossier.id);
                                  }}
                                  className="p-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 rounded border border-slate-200"
                                  title="Gérer les métadonnées de crédit"
                                >
                                  <DatabaseZap className="w-4 h-4" />
                                </button>
                              )}

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleEditSousDossier(sousDossier);
                                }}
                                className="p-1.5 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded border border-blue-200"
                                title="Modifier"
                              >
                                <SquarePen className="w-4 h-4" />
                              </button>

                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeleteSousDossier(sousDossier);
                                }}
                                className="p-1.5 bg-red-50 text-red-700 hover:bg-red-100 rounded border border-red-200"
                                title="Supprimer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Contenu des pièces (expandable) */}
                      {expandedSousDossier === sousDossier.id && (
                        <div
                          key={`pieces-${sousDossier.id}`}
                          className="border-t border-primary-200 bg-primary-50/20"
                        >
                          <SousDossierPiecesContent
                            sousDossierId={sousDossier.id}
                            pieces={sousDossierPieces[sousDossier.id] || []}
                            onCreatePiece={handleCreatePiece}
                          />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Sous-dossier Form Modal */}
        <SousDossierForm
          isOpen={showCreateForm}
          onClose={() => setShowCreateForm(false)}
          onSubmit={handleSubmitSousDossier}
          rubriqueId={rubriqueId}
          mode="create"
        />

        {/* Edit Sous-dossier Form Modal */}
        <SousDossierForm
          isOpen={showEditSousDossierForm}
          onClose={() => {
            setShowEditSousDossierForm(false);
            setSelectedSousDossierForEdit(null);
          }}
          onSubmit={handleSubmitEditSousDossier}
          rubriqueId={rubriqueId}
          mode="edit"
          sousDossier={
            selectedSousDossierForEdit
              ? {
                  id: selectedSousDossierForEdit.id,
                  titre: selectedSousDossierForEdit.titre,
                  description: selectedSousDossierForEdit.description,
                  rubrique_id: selectedSousDossierForEdit.rubrique_id,
                  createdAt: selectedSousDossierForEdit.createdAt,
                  updatedAt: selectedSousDossierForEdit.updatedAt,
                }
              : undefined
          }
        />

        {/* Create Piece Form Modal */}
        <PieceForm
          isOpen={showPieceForm && !!selectedSousDossier}
          onClose={() => {
            setShowPieceForm(false);
            setSelectedSousDossier(null);
          }}
          onSubmit={handleSubmitPiece}
          mode="create"
          rubriqueId={rubriqueId}
          sousDossierId={selectedSousDossier || undefined}
        />

        {/* Edit Piece Form Modal */}
        <PieceForm
          isOpen={showEditPieceForm && !!selectedPiece}
          onClose={() => {
            setShowEditPieceForm(false);
            setSelectedPiece(null);
          }}
          onSubmit={handleSubmitEditPiece}
          mode="edit"
          piece={
            selectedPiece
              ? {
                  nom: selectedPiece.nom,
                  description: selectedPiece.description,
                  has_meta: selectedPiece.aMetadonnees || false,
                  metadonnees: selectedPiece.metadonnees?.map((meta) => ({
                    nom: meta.nom,
                    type: meta.type,
                    obligatoire: meta.obligatoire,
                    description: meta.description,
                  })),
                }
              : undefined
          }
          rubriqueId={rubriqueId}
          sousDossierId={selectedPiece?.sousDossierId}
        />

        {/* Metadata Form Modal */}
        {showMetadataForm && selectedPieceForMetadata && (
          <MetadataForm
            isOpen={showMetadataForm}
            onClose={() => {
              setShowMetadataForm(false);
              setSelectedPieceForMetadata(null);
            }}
            onSubmit={handleSubmitMetadata}
            pieceName={selectedPieceForMetadata.nom}
          />
        )}

        {/* Edit Metadata Form Modal */}
        {showEditMetadataForm && selectedMetadata && (
          <MetadataForm
            isOpen={showEditMetadataForm}
            onClose={() => {
              setShowEditMetadataForm(false);
              setSelectedMetadata(null);
            }}
            onSubmit={handleSubmitEditMetadata}
            pieceName={`Modification de "${selectedMetadata.nom}"`}
            initialMetadata={[
              {
                nom: selectedMetadata.nom,
                type: selectedMetadata.type,
                obligatoire: selectedMetadata.obligatoire,
                description: selectedMetadata.description,
              },
            ]}
          />
        )}

        {/* Metadata Viewer Modal */}
        {showMetadataViewer && selectedPieceForView && (
          <MetadataViewer
            isOpen={showMetadataViewer}
            onClose={() => {
              setShowMetadataViewer(false);
              setSelectedPieceForView(null);
            }}
            piece={selectedPieceForView}
          />
        )}

        {/* Credit Metadata Manager Modal */}
        {showCreditMetadataManager && selectedSousDossierForMetadata && (
          <CreditMetadataManager
            isOpen={showCreditMetadataManager}
            onClose={() => {
              setShowCreditMetadataManager(false);
              setSelectedSousDossierForMetadata(null);
            }}
            sousDossierId={selectedSousDossierForMetadata}
          />
        )}

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
