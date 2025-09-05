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
  FolderOpen,
  UserCheck,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  File,
  Folder,
  Sparkles,
  Zap,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import SousDossierForm from "@/components/SousDossierForm";
import PieceForm from "@/components/PieceForm";
import { ToastContainer, useToast } from "@/components/Toast";
import { rubriquesService } from "@/services/rubriques";
import {
  sousDossiersService,
  SousDossier,
  SousDossierFormData,
} from "@/services/sous-dossiers";
import { piecesService } from "@/services/pieces";
import type { Piece, PieceFormData, PieceWithMetadata } from "@/types";
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
  const [activeTab, setActiveTab] = useState<"sous-dossiers" | "personnel">(
    "sous-dossiers"
  );
  const [showSuccessAnimation, setShowSuccessAnimation] = useState(false);
  const [expandedSousDossier, setExpandedSousDossier] = useState<string | null>(
    null
  );
  const [sousDossierPieces, setSousDossierPieces] = useState<
    Record<string, PieceWithMetadata[]>
  >({});
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

      // Rafraîchir les pièces du sous-dossier si il est ouvert
      if (expandedSousDossier === selectedSousDossier) {
        await loadSousDossierPieces(selectedSousDossier);
      }

      setShowPieceForm(false);
      setSelectedSousDossier(null);

      // Animation de succès
      setShowSuccessAnimation(true);
      setTimeout(() => setShowSuccessAnimation(false), 3000);

      success(
        "Pièce créée",
        `La pièce "${newPiece.nom}" a été créée avec succès.`
      );
    } catch (err) {
      console.error("Erreur lors de l'ajout de la pièce:", err);
      showError(
        "Erreur de création",
        "Impossible de créer la pièce. Veuillez réessayer."
      );
    }
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
                className="p-3 hover:bg-primary-100 rounded-xl transition-all group border border-primary-200"
                title="Retour aux rubriques"
              >
                <ArrowLeft className="w-5 h-5 text-primary-600 group-hover:text-primary-700 transition-colors" />
              </button>
              <div className="flex-1">
                <div className="flex items-center gap-4 mb-3">
                  <div className="w-12 h-12 bg-gradient-to-br from-primary-500 to-primary-600 rounded-xl flex items-center justify-center shadow-lg">
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
                      <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg">
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
                        <Calendar className="w-5 h-5 text-primary-600" />
                        <span className="text-gray-700 font-medium">
                          Créée le{" "}
                          {new Date(rubrique.createdAt).toLocaleDateString(
                            "fr-FR"
                          )}
                        </span>
                      </div>
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
                  {activeTab === "sous-dossiers" && (
                    <button
                      onClick={handleCreateSousDossier}
                      className="button-primary flex items-center gap-2 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Nouveau Sous-dossier
                    </button>
                  )}
                </div>
              </div>

              {/* Onglets de navigation */}
              <div className="flex space-x-3 bg-gradient-to-r from-gray-100 to-gray-50 rounded-2xl p-2 border border-gray-200/60">
                <button
                  onClick={() => setActiveTab("sous-dossiers")}
                  className={`group flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === "sous-dossiers"
                      ? "bg-white shadow-lg text-indigo-700 border border-indigo-200/60"
                      : "text-gray-600 hover:text-gray-800 hover:bg-white/70"
                  }`}
                >
                  <div
                    className={`transition-all duration-300 ${
                      activeTab === "sous-dossiers"
                        ? "text-indigo-600"
                        : "text-gray-500 group-hover:text-gray-700"
                    }`}
                  >
                    <FolderOpen className="w-5 h-5" />
                  </div>
                  <span>Sous-dossiers</span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all duration-300 ${
                      activeTab === "sous-dossiers"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                    }`}
                  >
                    {sousDossiers.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("personnel")}
                  className={`group flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-sm font-semibold transition-all duration-300 ${
                    activeTab === "personnel"
                      ? "bg-white shadow-lg text-indigo-700 border border-indigo-200/60"
                      : "text-gray-600 hover:text-gray-800 hover:bg-white/70"
                  }`}
                >
                  <div
                    className={`transition-all duration-300 ${
                      activeTab === "personnel"
                        ? "text-indigo-600"
                        : "text-gray-500 group-hover:text-gray-700"
                    }`}
                  >
                    <UserCheck className="w-5 h-5" />
                  </div>
                  <span>Personnel</span>
                  <span
                    className={`text-xs px-3 py-1 rounded-full font-medium transition-all duration-300 ${
                      activeTab === "personnel"
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-200 text-gray-600 group-hover:bg-gray-300"
                    }`}
                  >
                    0
                  </span>
                </button>
              </div>
            </div>

            <div className="p-8">
              {activeTab === "sous-dossiers" && (
                <>
                  {sousDossiers.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="relative mx-auto w-28 h-28 mb-8">
                        <div className="absolute inset-0 bg-gradient-to-br from-indigo-200 to-purple-200 rounded-3xl opacity-30 animate-pulse"></div>
                        <div className="relative w-full h-full bg-gradient-to-br from-indigo-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-xl">
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
                          className="group bg-white rounded-2xl border border-gray-200/60 overflow-hidden shadow-sm hover:shadow-lg transition-all duration-300 hover:border-accent-blue/30"
                        >
                          {/* Header du sous-dossier */}
                          <div
                            className="p-6 hover:bg-gradient-to-r hover:from-gray-50/50 hover:to-blue-50/30 transition-all duration-300 cursor-pointer"
                            onClick={() =>
                              toggleSousDossierExpansion(sousDossier.id)
                            }
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-5">
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
                                    <div className="w-14 h-14 bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300 group-hover:scale-105">
                                      <Folder className="w-7 h-7 text-white" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center shadow-md">
                                      <Sparkles className="w-3 h-3 text-white" />
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-1">
                                  <h4 className="text-xl font-bold text-gray-900 group-hover:text-indigo-700 transition-colors duration-300">
                                    {sousDossier.titre}
                                  </h4>
                                  <p className="text-sm text-gray-600 max-w-md">
                                    {sousDossier.description}
                                  </p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <Calendar className="w-3 h-3" />
                                    <span>
                                      Créé le{" "}
                                      {formatDate(sousDossier.createdAt)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-2 bg-gradient-to-r from-emerald-50 to-green-50 border border-emerald-200 px-4 py-2 rounded-xl shadow-sm">
                                  <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
                                  <FileText className="w-4 h-4 text-emerald-600" />
                                  <span className="text-emerald-700 font-semibold text-sm">
                                    {sousDossierPieces[sousDossier.id]
                                      ?.length || 0}{" "}
                                    pièce(s)
                                  </span>
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
                            <div className="border-t border-gray-200/60 bg-gradient-to-br from-gray-50/80 to-blue-50/30 animate-in slide-in-from-top-2 duration-500">
                              {sousDossierPieces[sousDossier.id]?.length ===
                              0 ? (
                                <div className="p-12 text-center">
                                  <div className="relative mx-auto w-20 h-20 mb-6">
                                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 rounded-2xl opacity-20"></div>
                                    <div className="relative w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center shadow-inner">
                                      <File className="w-10 h-10 text-gray-400" />
                                    </div>
                                  </div>
                                  <h3 className="text-lg font-semibold text-gray-700 mb-2">
                                    Aucune pièce dans ce sous-dossier
                                  </h3>
                                  <p className="text-sm text-gray-500 mb-4">
                                    Commencez par ajouter votre première pièce
                                  </p>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      handleCreatePiece(sousDossier.id);
                                    }}
                                    className="inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl text-sm font-semibold transition-all duration-300 shadow-md hover:shadow-lg hover:scale-105"
                                  >
                                    <Plus className="w-4 h-4" />
                                    Créer la première pièce
                                  </button>
                                </div>
                              ) : (
                                <div className="p-6 space-y-4">
                                  <div className="flex items-center gap-2 mb-4">
                                    <div className="w-1 h-6 bg-gradient-to-b from-indigo-500 to-purple-600 rounded-full"></div>
                                    <h3 className="text-lg font-semibold text-gray-800">
                                      Pièces (
                                      {sousDossierPieces[sousDossier.id]
                                        ?.length || 0}
                                      )
                                    </h3>
                                  </div>
                                  <div className="grid gap-4">
                                    {sousDossierPieces[sousDossier.id]?.map(
                                      (piece) => (
                                        <div
                                          key={piece.id}
                                          className="group/piece bg-white rounded-xl p-5 border border-gray-200/60 shadow-sm hover:shadow-md transition-all duration-300 hover:border-indigo-200/60"
                                        >
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              <div className="flex items-center gap-4 mb-3">
                                                <div className="relative">
                                                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center shadow-md group-hover/piece:shadow-lg transition-all duration-300 group-hover/piece:scale-105">
                                                    <File className="w-5 h-5 text-white" />
                                                  </div>
                                                  {piece.aMetadonnees && (
                                                    <div className="absolute -top-1 -right-1 w-4 h-4 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center">
                                                      <Sparkles className="w-2.5 h-2.5 text-white" />
                                                    </div>
                                                  )}
                                                </div>
                                                <div className="flex-1">
                                                  <h5 className="font-bold text-gray-900 text-lg group-hover/piece:text-indigo-700 transition-colors duration-300">
                                                    {piece.nom}
                                                  </h5>
                                                  {piece.description && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                      {piece.description}
                                                    </p>
                                                  )}
                                                </div>
                                              </div>

                                              {/* Métadonnées */}
                                              {piece.aMetadonnees &&
                                                piece.metadonnees &&
                                                piece.metadonnees.length >
                                                  0 && (
                                                  <div className="mt-4 ml-14">
                                                    <div className="flex items-center gap-2 mb-3">
                                                      <div className="w-2 h-2 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-full animate-pulse"></div>
                                                      <span className="text-sm font-semibold text-gray-700">
                                                        Modèle de métadonnées
                                                      </span>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                                      {piece.metadonnees.map(
                                                        (meta) => (
                                                          <div
                                                            key={meta.id}
                                                            className="bg-gradient-to-br from-gray-50 to-gray-100/50 border border-gray-200/60 rounded-lg p-3 hover:shadow-sm transition-all duration-300"
                                                          >
                                                            <div className="flex items-center gap-2 mb-1">
                                                              <span className="text-sm font-semibold text-gray-800">
                                                                {meta.nom}
                                                              </span>
                                                              <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                                                                {meta.type}
                                                              </span>
                                                              {meta.obligatoire && (
                                                                <span className="text-xs bg-red-100 text-red-600 px-1.5 py-0.5 rounded-full font-bold">
                                                                  *
                                                                </span>
                                                              )}
                                                            </div>
                                                            {meta.description && (
                                                              <p className="text-xs text-gray-600 leading-relaxed">
                                                                {
                                                                  meta.description
                                                                }
                                                              </p>
                                                            )}
                                                          </div>
                                                        )
                                                      )}
                                                    </div>
                                                  </div>
                                                )}
                                            </div>
                                            <div className="flex flex-col items-end gap-2">
                                              <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                                                {formatDate(piece.createdAt)}
                                              </div>
                                              {piece.aMetadonnees && (
                                                <div className="flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-lg">
                                                  <Sparkles className="w-3 h-3" />
                                                  <span className="font-medium">
                                                    Avec métadonnées
                                                  </span>
                                                </div>
                                              )}
                                            </div>
                                          </div>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "personnel" && (
                <div className="text-center py-20">
                  <div className="w-24 h-24 bg-gradient-to-br from-accent-purple to-accent-purple rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                    <UserCheck className="w-12 h-12 text-white" />
                  </div>
                  <h4 className="text-2xl font-bold text-primary-800 mb-4">
                    Gestion du Personnel
                  </h4>
                  <p className="text-gray-700 mb-10 max-w-lg mx-auto text-lg">
                    Bientôt disponible - Assignez et gérez le personnel pour
                    cette rubrique.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Create Sous-dossier Form Modal */}
        {showCreateForm && (
          <SousDossierForm
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleSubmitSousDossier}
            rubriqueId={rubriqueId}
            mode="create"
          />
        )}

        {/* Create Piece Form Modal */}
        {showPieceForm && selectedSousDossier && (
          <PieceForm
            isOpen={showPieceForm}
            onClose={() => {
              setShowPieceForm(false);
              setSelectedSousDossier(null);
            }}
            onSubmit={handleSubmitPiece}
            mode="create"
          />
        )}

        {/* Animation de succès */}
        {showSuccessAnimation && (
          <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
            <div className="bg-white rounded-full p-8 shadow-2xl animate-in zoom-in-50 duration-500">
              <div className="flex flex-col items-center gap-4">
                <div className="w-16 h-16 bg-accent-green rounded-full flex items-center justify-center animate-in scale-in-50 duration-300">
                  <CheckCircle className="w-10 h-10 text-white" />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-bold text-gray-900">
                    Pièce créée !
                  </h3>
                  <p className="text-sm text-gray-600">Avec succès</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
