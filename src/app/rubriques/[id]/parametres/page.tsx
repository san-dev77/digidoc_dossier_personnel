"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import {
  ArrowLeft,
  Plus,
  FolderPlus,
  Settings,
  FileText,
  Users,
  Calendar,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  File,
  Sparkles,
  Zap,
  FolderTree,
  Trash2,
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

// Composant réactif pour le badge de comptage des pièces
function PieceCountBadge({ sousDossierId }: { sousDossierId: string }) {
  const pieceCount = usePiecesStore((state) =>
    state.getPieceCount(sousDossierId)
  );

  return (
    <span className="text-emerald-700 font-semibold text-sm transition-all duration-300 transform">
      <span
        className="inline-block animate-in zoom-in-0 duration-300"
        key={pieceCount}
      >
        {pieceCount}{" "}
      </span>
      pièce{pieceCount !== 1 ? "s" : ""}
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
import { formatDate } from "@/utils/date";

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
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
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

      // Animation de succès discrète
      setTimeout(() => {
        setShowSuccessAnimation(true);
        setTimeout(() => setShowSuccessAnimation(false), 2000);
      }, 100);
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

  const handleAddMetadata = (piece: PieceWithMetadata) => {
    setSelectedPieceForMetadata(piece);
    setShowMetadataForm(true);
  };

  const handleSubmitMetadata = async (
    metadata: Omit<MetadataModel, "id" | "createdAt" | "updatedAt">[]
  ) => {
    if (!selectedPieceForMetadata) return;

    try {
      // Pour l'instant, on va juste rafraîchir les pièces
      // Plus tard, on pourra implémenter une API spécifique pour les métadonnées
      console.log("Métadonnées à ajouter:", metadata);

      // Rafraîchir les pièces du sous-dossier
      if (expandedSousDossier) {
        await loadSousDossierPieces(expandedSousDossier);
      }

      success(
        "Métadonnées ajoutées",
        `Les métadonnées ont été ajoutées à la pièce "${selectedPieceForMetadata.nom}".`
      );

      // Fermer la modale
      setShowMetadataForm(false);
      setSelectedPieceForMetadata(null);
    } catch (err) {
      console.error("Erreur lors de l'ajout des métadonnées:", err);
      showError(
        "Erreur d'ajout",
        "Impossible d'ajouter les métadonnées. Veuillez réessayer."
      );
    }
  };

  // Composant pour une carte de pièce
  const PieceCard = ({
    piece,
    onEdit,
    onDelete,
    onViewDetails,
    onAddMetadata,
  }: {
    piece: PieceWithMetadata;
    onEdit: (piece: PieceWithMetadata) => void;
    onDelete: (piece: PieceWithMetadata) => void;
    onViewDetails: (piece: PieceWithMetadata) => void;
    onAddMetadata: (piece: PieceWithMetadata) => void;
  }) => {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm hover:shadow-lg transition-all duration-300 group hover:border-accent-blue/30 overflow-hidden">
        {/* Header principal du document */}
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4 flex-1">
              <div className="relative">
                <div className="w-12 h-12 bg-gradient-to-br from-accent-green to-green-600 rounded-xl flex items-center justify-center shadow-md group-hover:shadow-lg transition-all duration-300">
                  <File className="w-6 h-6 text-white" />
                </div>
                {piece.aMetadonnees && (
                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-warning-500 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-gray-900 text-lg group-hover:text-accent-blue transition-colors duration-300 mb-2">
                  {piece.nom}
                </h4>
                {piece.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2 leading-relaxed">
                    {piece.description}
                  </p>
                )}
                <div className="flex items-center gap-4 flex-wrap">
                  <div className="flex items-center gap-2 text-xs text-gray-500 bg-gray-50 px-3 py-1.5 rounded-lg">
                    <Calendar className="w-3 h-3" />
                    <span className="font-medium">
                      Ajouté le {formatDate(piece.createdAt)}
                    </span>
                  </div>
                  {piece.aMetadonnees && (
                    <div className="flex items-center gap-2 text-xs text-accent-green bg-accent-green-light px-3 py-1.5 rounded-lg font-semibold">
                      <Sparkles className="w-3 h-3" />
                      <span>
                        {piece.metadonnees?.length || 0} champ(s)
                        personnalisé(s)
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onViewDetails(piece)}
                className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all duration-200"
                title="Voir les détails"
              >
                <FileText className="w-4 h-4" />
              </button>
              {!piece.aMetadonnees && (
                <button
                  onClick={() => onAddMetadata(piece)}
                  className="p-2 text-gray-400 hover:text-purple-600 hover:bg-purple-50 rounded-lg transition-all duration-200"
                  title="Ajouter des métadonnées"
                >
                  <Sparkles className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={() => onEdit(piece)}
                className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg transition-all duration-200"
                title="Modifier"
              >
                <Settings className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(piece)}
                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all duration-200"
                title="Supprimer"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Section des champs personnalisés */}
        {piece.aMetadonnees &&
          piece.metadonnees &&
          piece.metadonnees.length > 0 && (
            <div className="border-t border-gray-200 bg-gradient-to-r from-accent-green-light/20 to-blue-50/30 p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-3 h-3 bg-accent-green rounded-full animate-pulse"></div>
                <h5 className="text-sm font-bold text-gray-800">
                  Champs personnalisés pour ce document
                </h5>
                <div className="flex-1 h-px bg-gradient-to-r from-accent-green/30 to-transparent"></div>
              </div>
              <div className="grid gap-3">
                {piece.metadonnees.map((meta) => (
                  <div
                    key={meta.id}
                    className="flex items-center justify-between bg-white rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-8 h-8 bg-gradient-to-br from-accent-green to-green-600 rounded-lg flex items-center justify-center shadow-sm">
                        <span className="text-xs font-bold text-white">
                          {meta.type.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div>
                        <span className="text-sm font-semibold text-gray-900">
                          {meta.nom}
                        </span>
                        {meta.description && (
                          <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                            {meta.description}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-gray-100 text-gray-700 px-3 py-1.5 rounded-lg font-medium">
                        {meta.type}
                      </span>
                      {meta.obligatoire && (
                        <span className="text-xs bg-red-100 text-red-700 px-3 py-1.5 rounded-lg font-bold">
                          Obligatoire
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
      </div>
    );
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
        <div className="p-8 text-center animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
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
      <div className="p-6 space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-500">
        <div className="flex items-center justify-between animate-in slide-in-from-left-4 duration-300">
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
          <div className="flex items-center gap-2 animate-in slide-in-from-right-4 duration-300">
            <div className="text-xs text-gray-500 bg-gray-100 px-3 py-1.5 rounded-lg transition-all duration-300">
              {pieces.filter((p) => p.aMetadonnees).length} avec métadonnées
            </div>
          </div>
        </div>
        <div className="grid gap-4">
          {pieces.map((piece, index) => (
            <div
              key={piece.id}
              className="animate-in slide-in-from-bottom-3 fade-in-0"
              style={{
                animationDelay: `${index * 100}ms`,
                animationFillMode: "both",
              }}
            >
              <PieceCard
                piece={piece}
                onEdit={handleEditPiece}
                onDelete={handleDeletePiece}
                onViewDetails={handleViewPieceDetails}
                onAddMetadata={handleAddMetadata}
              />
            </div>
          ))}
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
        <div className="p-6 bg-gradient-to-br from-primary-50 to-white min-h-screen">
          {/* Header avec navigation */}
          <div className="mb-8">
            <div className="flex items-center gap-4 mb-6">
              <button
                onClick={() => router.push("/rubriques")}
                className="p-3 hover:bg-primary-100 rounded-xl transition-all group border border-gray-900"
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
                      Paramètres
                    </h1>
                    <p className="text-primary-600 font-semibold text-lg">
                      {rubrique.nom}
                    </p>
                  </div>
                </div>
                <p className="text-gray-700 max-w-2xl text-lg">
                  {rubrique.description}
                </p>
              </div>
              <button
                onClick={handleCreateSousDossier}
                className="button-primary flex items-center gap-2 text-sm font-medium"
              >
                <FolderPlus className="w-4 h-4 text-white" />
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
                        <p className="text-gray-700 text-lg">
                          {rubrique.description}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-8 text-sm">
                      <div className="flex items-center gap-3 bg-white/70 px-4 py-2 rounded-xl">
                        <FolderPlus className="w-5 h-5 text-primary-600" />
                        <span className="text-gray-700 font-medium">
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
                  <p className="text-sm text-gray-600">
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
                  <p className="text-sm text-gray-600">
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
                    Agents Assignés
                  </p>
                  <p className="text-4xl font-bold text-primary-800 mb-1">0</p>
                  <p className="text-sm text-gray-600">Aucun assigné</p>
                </div>
                <div className="bg-accent-purple-light p-4 rounded-2xl">
                  <Users className="w-8 h-8 text-accent-purple" />
                </div>
              </div>
            </div>
          </div>

          {/* Navigation par onglets */}
          <div className="card-elevated">
            {/* Header avec onglets */}
            <div className="p-8 border-b border-primary-200">
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h3 className="text-2xl font-bold text-primary-800">
                    Gestion de la Rubrique
                  </h3>
                  <p className="text-gray-700 mt-2 text-lg">
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
                    <div className="absolute inset-0 bg-primary-200 rounded-3xl opacity-30 animate-pulse"></div>
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
                    className="group bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-10 py-4 rounded-2xl font-semibold transition-all duration-300 flex items-center gap-3 mx-auto shadow-lg hover:shadow-xl hover:scale-105 active:scale-95 text-lg"
                  >
                    <FolderPlus className="w-6 h-6 group-hover:rotate-12 transition-transform duration-300" />
                    <span>Créer le premier sous-dossier</span>
                    <Zap className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </div>
              ) : (
                <div className="space-y-6">
                  {sousDossiers.map((sousDossier) => (
                    <div
                      key={sousDossier.id}
                      className="group bg-white rounded-2xl border border-gray-500 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:border-accent-blue/30"
                    >
                      {/* Header du sous-dossier */}
                      <div
                        className="p-6 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-blue-50/30 transition-all duration-300 cursor-pointer"
                        onClick={() =>
                          toggleSousDossierExpansion(sousDossier.id)
                        }
                      >
                        <div className="flex items-center justify-between ">
                          <div className="flex items-center gap-5 rounded-2xl p-2">
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                {expandedSousDossier === sousDossier.id ? (
                                  <div className="w-6 h-6 bg-gradient-to-br from-accent-blue to-blue-600 rounded-lg flex items-center justify-center shadow-md transform rotate-180 transition-all duration-300">
                                    <ChevronDown className="w-4 h-4 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-6 h-6 bg-gradient-to-br from-gray-400 to-gray-500 rounded-lg flex items-center justify-center shadow-sm group-hover:from-accent-blue group-hover:to-blue-600 transition-all duration-300">
                                    <ChevronRight className="w-4 h-4 text-white" />
                                  </div>
                                )}
                              </div>
                              <div className="relative">
                                <div className="w-14 h-14 bg-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                                  <FolderTree className="w-7 h-7 text-white" />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <h4 className="text-xl font-bold text-gray-900 group-hover:text-primary-700 transition-colors duration-300">
                                {sousDossier.titre}
                              </h4>
                              <p className="text-sm text-gray-600 max-w-md">
                                {sousDossier.description}
                              </p>
                              <div className="flex items-center gap-2 text-xs text-gray-500">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  Créé le {formatDate(sousDossier.createdAt)}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 px-4 py-2 rounded-xl shadow-sm">
                              <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                              <FileText className="w-4 h-4 text-emerald-600" />
                              <PieceCountBadge sousDossierId={sousDossier.id} />
                            </div>
                            <div className="flex items-center gap-2">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleCreatePiece(sousDossier.id);
                                }}
                                className="group/btn bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300 flex items-center gap-2 shadow-md hover:shadow-lg hover:scale-105 active:scale-95"
                                title="Ajouter une pièce"
                              >
                                <Plus className="w-4 h-4 group-hover/btn:rotate-90 transition-transform duration-300" />
                                <span>Ajouter</span>
                                <Zap className="w-3 h-3 opacity-0 group-hover/btn:opacity-100 transition-opacity duration-300" />
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

        {/* Create Piece Form Modal */}
        <PieceForm
          isOpen={showPieceForm && !!selectedSousDossier}
          onClose={() => {
            setShowPieceForm(false);
            setSelectedSousDossier(null);
          }}
          onSubmit={handleSubmitPiece}
          mode="create"
        />

        {/* Edit Piece Form Modal */}
        <PieceForm
          isOpen={showEditPieceForm && !!selectedPiece}
          onClose={() => {
            setShowEditPieceForm(false);
            setSelectedPiece(null);
          }}
          onSubmit={handleSubmitPiece}
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

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
