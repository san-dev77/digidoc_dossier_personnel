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
  Grid3X3,
  List,
  FolderOpen,
  File,
  UserCheck,
  Download,
  Trash2,
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
import { piecesService, Piece, PieceFormData } from "@/services/pieces";
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
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [activeTab, setActiveTab] = useState<
    "sous-dossiers" | "pieces" | "personnel"
  >("sous-dossiers");
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

  const handleSubmitPiece = async (formData: PieceFormData) => {
    if (!selectedSousDossier) return;

    try {
      const newPiece = await piecesService.createPiece(
        selectedSousDossier,
        formData
      );
      setPieces([newPiece, ...pieces]);
      setShowPieceForm(false);
      setSelectedSousDossier(null);
      success(
        "Pièce ajoutée",
        `La pièce "${newPiece.nom}" a été ajoutée avec succès.`
      );
    } catch (err) {
      console.error("Erreur lors de l'ajout de la pièce:", err);
      showError(
        "Erreur d'ajout",
        "Impossible d'ajouter la pièce. Veuillez réessayer."
      );
    }
  };

  const handleDeletePiece = async (id: string) => {
    const pieceToDelete = pieces.find((p) => p.id === id);
    if (confirm("Êtes-vous sûr de vouloir supprimer cette pièce ?")) {
      try {
        await piecesService.deletePiece(id);
        setPieces(pieces.filter((p) => p.id !== id));
        success(
          "Pièce supprimée",
          `La pièce "${pieceToDelete?.nom}" a été supprimée avec succès.`
        );
      } catch (err) {
        console.error("Erreur lors de la suppression de la pièce:", err);
        showError(
          "Erreur de suppression",
          "Impossible de supprimer la pièce. Veuillez réessayer."
        );
      }
    }
  };

  const handleDownloadPiece = async (piece: Piece) => {
    try {
      await piecesService.downloadPiece(piece);
    } catch (err) {
      console.error("Erreur lors du téléchargement:", err);
      showError(
        "Erreur de téléchargement",
        "Impossible de télécharger le fichier. Veuillez réessayer."
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
                    <>
                      <div className="flex items-center bg-primary-100 rounded-xl p-1">
                        <button
                          onClick={() => setViewMode("grid")}
                          className={`p-3 rounded-lg transition-all ${
                            viewMode === "grid"
                              ? "bg-white shadow-sm text-primary-600"
                              : "text-primary-500 hover:text-primary-700"
                          }`}
                        >
                          <Grid3X3 className="w-5 h-5" />
                        </button>
                        <button
                          onClick={() => setViewMode("list")}
                          className={`p-3 rounded-lg transition-all ${
                            viewMode === "list"
                              ? "bg-white shadow-sm text-primary-600"
                              : "text-primary-500 hover:text-primary-700"
                          }`}
                        >
                          <List className="w-5 h-5" />
                        </button>
                      </div>
                      <button
                        onClick={handleCreateSousDossier}
                        className="button-primary flex items-center gap-2 text-sm font-medium"
                      >
                        <Plus className="w-4 h-4" />
                        Nouveau Sous-dossier
                      </button>
                    </>
                  )}
                  {activeTab === "pieces" && sousDossiers.length > 0 && (
                    <button
                      onClick={() => {
                        if (sousDossiers.length === 1) {
                          handleCreatePiece(sousDossiers[0].id);
                        } else {
                          // TODO: Afficher un modal pour choisir le sous-dossier
                          handleCreatePiece(sousDossiers[0].id);
                        }
                      }}
                      className="button-primary flex items-center gap-2 text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Ajouter une Pièce
                    </button>
                  )}
                </div>
              </div>

              {/* Onglets de navigation */}
              <div className="flex space-x-2 bg-primary-100 rounded-2xl p-2">
                <button
                  onClick={() => setActiveTab("sous-dossiers")}
                  className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "sous-dossiers"
                      ? "tab-active"
                      : "text-primary-600 hover:text-primary-700 hover:bg-white/50"
                  }`}
                >
                  <FolderOpen className="w-5 h-5" />
                  Sous-dossiers
                  <span className="bg-primary-200 text-primary-700 text-xs px-3 py-1 rounded-full font-medium">
                    {sousDossiers.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("pieces")}
                  className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "pieces"
                      ? "tab-active"
                      : "text-primary-600 hover:text-primary-700 hover:bg-white/50"
                  }`}
                >
                  <File className="w-5 h-5" />
                  Pièces
                  <span className="bg-primary-200 text-primary-700 text-xs px-3 py-1 rounded-full font-medium">
                    {pieces.length}
                  </span>
                </button>
                <button
                  onClick={() => setActiveTab("personnel")}
                  className={`flex-1 flex items-center justify-center gap-3 px-6 py-4 rounded-xl text-sm font-semibold transition-all ${
                    activeTab === "personnel"
                      ? "tab-active"
                      : "text-primary-600 hover:text-primary-700 hover:bg-white/50"
                  }`}
                >
                  <UserCheck className="w-5 h-5" />
                  Personnel
                  <span className="bg-primary-200 text-primary-700 text-xs px-3 py-1 rounded-full font-medium">
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
                      <div className="w-24 h-24 bg-gradient-to-br from-primary-500 to-primary-600 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                        <FolderPlus className="w-12 h-12 text-white" />
                      </div>
                      <h4 className="text-2xl font-bold text-primary-800 mb-4">
                        Aucun sous-dossier créé
                      </h4>
                      <p className="text-gray-700 mb-10 max-w-lg mx-auto text-lg">
                        Créez votre premier sous-dossier pour organiser les
                        documents de cette rubrique.
                      </p>
                      <button
                        onClick={handleCreateSousDossier}
                        className="button-primary text-base px-10 py-4"
                      >
                        <FolderPlus className="w-5 h-5 inline mr-3" />
                        Créer le premier sous-dossier
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {sousDossiers.map((sousDossier) => (
                        <div
                          key={sousDossier.id}
                          className="card-elevated p-6 group cursor-pointer"
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-4 mb-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-accent-blue to-accent-blue rounded-xl flex items-center justify-center shadow-md">
                                  <FolderPlus className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                  <h4 className="text-xl font-bold text-primary-800 mb-1">
                                    {sousDossier.titre}
                                  </h4>
                                  <p className="text-sm text-primary-600 font-medium">
                                    Créé le{" "}
                                    {new Date(
                                      sousDossier.createdAt
                                    ).toLocaleDateString("fr-FR")}
                                  </p>
                                </div>
                              </div>
                              <p className="text-gray-700 mb-4 text-lg">
                                {sousDossier.description}
                              </p>
                              <div className="flex items-center gap-6 text-sm">
                                <div className="flex items-center gap-2 bg-accent-green-light px-3 py-2 rounded-lg">
                                  <FileText className="w-4 h-4 text-accent-green" />
                                  <span className="text-accent-green font-medium">
                                    {sousDossier.documentsCount || 0} documents
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                              <button className="text-accent-blue hover:text-accent-blue p-3 hover:bg-accent-blue-light rounded-xl transition-colors">
                                <FileText className="w-5 h-5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              )}

              {activeTab === "pieces" && (
                <>
                  {pieces.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-24 h-24 bg-gradient-to-br from-accent-green to-accent-green rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-lg">
                        <File className="w-12 h-12 text-white" />
                      </div>
                      <h4 className="text-2xl font-bold text-primary-800 mb-4">
                        Aucune pièce ajoutée
                      </h4>
                      <p className="text-gray-700 mb-10 max-w-lg mx-auto text-lg">
                        Commencez par créer des sous-dossiers, puis ajoutez des
                        pièces pour organiser vos documents.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      {pieces.map((piece) => {
                        const sousDossier = sousDossiers.find(
                          (sd) => sd.id === piece.sousDossierId
                        );
                        return (
                          <div
                            key={piece.id}
                            className="card-elevated p-6 group"
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-4 mb-4">
                                  <div className="w-12 h-12 bg-gradient-to-br from-accent-green to-accent-green rounded-xl flex items-center justify-center shadow-md">
                                    <File className="w-6 h-6 text-white" />
                                  </div>
                                  <div>
                                    <h4 className="text-xl font-bold text-primary-800 mb-1">
                                      {piece.nom}
                                    </h4>
                                    <p className="text-sm text-primary-600 font-medium">
                                      Dans:{" "}
                                      {sousDossier?.titre ||
                                        "Sous-dossier inconnu"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-6 text-sm mb-4">
                                  <div className="flex items-center gap-2 bg-accent-blue-light px-3 py-2 rounded-lg">
                                    <FileText className="w-4 h-4 text-accent-blue" />
                                    <span className="text-accent-blue font-medium">
                                      {piece.typeFichier}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-2 bg-accent-purple-light px-3 py-2 rounded-lg">
                                    <Calendar className="w-4 h-4 text-accent-purple" />
                                    <span className="text-accent-purple font-medium">
                                      {new Date(
                                        piece.dateAjout
                                      ).toLocaleDateString("fr-FR")}
                                    </span>
                                  </div>
                                  <div
                                    className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                                      piece.statut === "valide"
                                        ? "bg-green-100 text-green-700"
                                        : piece.statut === "en_attente"
                                        ? "bg-yellow-100 text-yellow-700"
                                        : "bg-red-100 text-red-700"
                                    }`}
                                  >
                                    <div
                                      className={`w-2 h-2 rounded-full ${
                                        piece.statut === "valide"
                                          ? "bg-green-500"
                                          : piece.statut === "en_attente"
                                          ? "bg-yellow-500"
                                          : "bg-red-500"
                                      }`}
                                    />
                                    <span className="font-medium capitalize">
                                      {piece.statut.replace("_", " ")}
                                    </span>
                                  </div>
                                </div>
                              </div>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => handleDownloadPiece(piece)}
                                  className="text-accent-green hover:text-accent-green p-3 hover:bg-accent-green-light rounded-xl transition-colors"
                                  title="Télécharger"
                                >
                                  <Download className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleDeletePiece(piece.id)}
                                  className="text-red-500 hover:text-red-600 p-3 hover:bg-red-50 rounded-xl transition-colors"
                                  title="Supprimer"
                                >
                                  <Trash2 className="w-5 h-5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
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
            sousDossierId={selectedSousDossier}
            mode="create"
          />
        )}

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
