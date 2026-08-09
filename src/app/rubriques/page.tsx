"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Eye,
  Edit,
  Trash2,
  FileText,
  RefreshCw,
  FolderPlus,
  File,
  Sparkles,
  ArrowRight,
  Calendar,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import RubriqueForm from "@/components/RubriqueForm";
import { ToastContainer, useToast } from "@/components/Toast";
import { rubriquesService } from "@/services/rubriques";
import { Rubrique, RubriqueFormData } from "@/types";

interface RubriqueStats {
  sousDossiersCount: number;
  piecesCount: number;
  piecesWithMetadataCount: number;
}

interface RubriqueWithStats extends Rubrique {
  stats: RubriqueStats;
}

export default function RubriquesPage() {
  const router = useRouter();
  const [rubriques, setRubriques] = useState<RubriqueWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRubrique, setEditingRubrique] = useState<Rubrique | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const {
    toasts,
    removeToast,
    success,
    error: showError,
    confirm: confirmToast,
  } = useToast();

  useEffect(() => {
    loadRubriques();
  }, []);

  const loadRubriques = async () => {
    try {
      setLoading(true);
      const data = await rubriquesService.getAllRubriques();

      // Charger les statistiques pour chaque rubrique
      const rubriquesWithStats = await Promise.all(
        data.map(async (rubrique) => {
          try {
            const stats = await rubriquesService.getRubriqueStats(rubrique.id);
            return { ...rubrique, stats };
          } catch (err) {
            console.error(
              `Erreur lors du chargement des stats pour ${rubrique.id}:`,
              err
            );
            return {
              ...rubrique,
              stats: {
                sousDossiersCount: 0,
                piecesCount: 0,
                piecesWithMetadataCount: 0,
              },
            };
          }
        })
      );

      setRubriques(rubriquesWithStats);
    } catch (err) {
      console.error("Erreur lors du chargement des rubriques:", err);
      setError("Erreur lors du chargement des rubriques");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRubrique = async (formData: RubriqueFormData) => {
    try {
      const newRubrique = await rubriquesService.createRubrique(formData);
      const newRubriqueWithStats = {
        ...newRubrique,
        stats: {
          sousDossiersCount: 0,
          piecesCount: 0,
          piecesWithMetadataCount: 0,
        },
      };
      setRubriques([newRubriqueWithStats, ...rubriques]);
      setShowCreateForm(false);
      success(
        "Rubrique créée",
        `La rubrique "${newRubrique.nom}" a été créée avec succès.`
      );
    } catch (err) {
      console.error("Error in handleCreateRubrique:", err);
      showError(
        "Erreur de création",
        "Impossible de créer la rubrique. Veuillez réessayer."
      );
    }
  };

  const handleUpdateRubrique = async (formData: RubriqueFormData) => {
    if (editingRubrique) {
      try {
        const updatedRubrique = await rubriquesService.updateRubrique(
          editingRubrique.id,
          formData
        );

        // Garder les stats existantes lors de la mise à jour
        const existingRubrique = rubriques.find(
          (r) => r.id === editingRubrique.id
        );
        const updatedRubriqueWithStats = {
          ...updatedRubrique,
          stats: existingRubrique?.stats || {
            sousDossiersCount: 0,
            piecesCount: 0,
            piecesWithMetadataCount: 0,
          },
        };

        setRubriques(
          rubriques.map((r) =>
            r.id === editingRubrique.id ? updatedRubriqueWithStats : r
          )
        );
        setShowEditForm(false);
        setEditingRubrique(null);
        success(
          "Rubrique modifiée",
          `La rubrique "${updatedRubrique.nom}" a été modifiée avec succès.`
        );
      } catch (err) {
        console.error("Error in handleUpdateRubrique:", err);
        showError(
          "Erreur de modification",
          "Impossible de modifier la rubrique. Veuillez réessayer."
        );
      }
    }
  };

  const handleDeleteRubrique = (id: string) => {
    const rubriqueToDelete = rubriques.find((r) => r.id === id);
    if (!rubriqueToDelete) return;

    confirmToast(
      "Supprimer la rubrique ?",
      `« ${rubriqueToDelete.nom} » sera définitivement supprimée.`,
      async () => {
        try {
          await rubriquesService.deleteRubrique(id);
          setRubriques(rubriques.filter((r) => r.id !== id));
          success(
            "Rubrique supprimée",
            `La rubrique "${rubriqueToDelete.nom}" a été supprimée avec succès.`
          );
        } catch (err) {
          console.error("Error in handleDeleteRubrique:", err);
          showError(
            "Erreur de suppression",
            "Impossible de supprimer la rubrique. Veuillez réessayer."
          );
        }
      }
    );
  };

  const handleEditClick = (rubrique: Rubrique) => {
    setEditingRubrique(rubrique);
    setShowEditForm(true);
  };

  const handleViewContent = (rubrique: Rubrique) => {
    router.push(`/rubriques/${rubrique.id}/parametres`);
  };

  const filteredRubriques = rubriques.filter(
    (rubrique) =>
      rubrique.nom.toLowerCase().includes(searchQuery.toLowerCase()) ||
      rubrique.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

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

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="p-6">
          {/* Header Card */}
          <div className="mb-8">
            <div className="bg-primary-700 mb-5 rounded-2xl shadow-primary-xl overflow-hidden">
              <div className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                      <FileText className="w-12 h-12 text-white" />
                    </div>
                    <div>
                      <h1 className="text-4xl font-bold text-white mb-2">
                        Gestion des Rubriques
                      </h1>
                      <p className="text-primary-100 text-lg">
                        Organisez et gérez les catégories de documents de
                        manière centralisée
                      </p>
                      <div className="flex items-center space-x-4 mt-4">
                        <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                          <div className="w-2 h-2 bg-accent-green rounded-full"></div>
                          <span className="text-white text-sm font-medium">
                            {rubriques.length} rubriques créées
                          </span>
                        </div>
                        <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                          <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                          <span className="text-white text-sm font-medium">
                            {rubriques.reduce(
                              (acc, r) => acc + r.stats.piecesCount,
                              0
                            )}{" "}
                            documents archivés
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col space-y-3">
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={loadRubriques}
                        disabled={loading}
                        className="p-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 backdrop-blur-sm disabled:opacity-50"
                        title="Actualiser"
                      >
                        <RefreshCw
                          className={`w-5 h-5 text-white ${
                            loading ? "animate-spin" : ""
                          }`}
                        />
                      </button>
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="px-8 py-4 bg-white text-primary-700 rounded-xl hover:bg-primary-50 transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl font-semibold text-lg"
                      >
                        <Plus className="w-6 h-6" />
                        <span>Nouvelle Rubrique</span>
                      </button>
                    </div>
                    <div className="text-center">
                      <div className="text-white/80 text-sm">
                        Total des rubriques
                      </div>
                      <div className="text-2xl font-bold text-white">
                        {rubriques.length}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress bar */}
              <div className="h-1 bg-white/20">
                <div
                  className="h-full bg-accent-green transition-all duration-1000 ease-out"
                  style={{
                    width: `${
                      rubriques.length > 0
                        ? Math.min((rubriques.length / 10) * 100, 100)
                        : 0
                    }%`,
                  }}
                ></div>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="bg-white rounded-xl shadow-md p-6 mb-6 border border-gray-100">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative text-primary-700">
                <Search className="w-5 h-5 text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Rechercher une rubrique par nom ou description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                />
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-primary-700">
                  {filteredRubriques.length} rubrique
                  {filteredRubriques.length > 1 ? "s" : ""}
                </span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
              {error}
            </div>
          )}

          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <nav className="flex items-center space-x-2 text-sm">
              <span className="text-gray-500">Accueil</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="text-gray-500">Rubriques</span>
              <ArrowRight className="w-4 h-4 text-gray-400" />
              <span className="text-primary-700 font-medium">
                Gestion des rubriques
              </span>
            </nav>
            <p className="text-xs text-gray-500 mt-1">
              Gérez et organisez vos rubriques de documents
            </p>
          </div>

          {/* Rubriques Cards Grid */}
          {filteredRubriques.length === 0 ? (
            <div className="text-center py-16">
              <div className="relative mx-auto w-32 h-32 mb-8">
                <div className="absolute inset-0 bg-primary-200 rounded-3xl opacity-30"></div>
                <div className="relative w-full h-full bg-primary-600 rounded-3xl flex items-center justify-center shadow-xl">
                  <FileText className="w-16 h-16 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-8 h-8 bg-gradient-to-br from-warning-400 to-warning-500 rounded-full flex items-center justify-center shadow-lg">
                  <Sparkles className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className="text-3xl font-bold text-gray-800 mb-4">
                {searchQuery
                  ? "Aucune rubrique trouvée"
                  : "Aucune rubrique créée"}
              </h3>
              <p className="text-gray-600 mb-10 max-w-lg mx-auto text-lg leading-relaxed">
                {searchQuery
                  ? "Aucune rubrique ne correspond à votre recherche. Essayez avec d'autres mots-clés."
                  : "Commencez par créer votre première rubrique pour organiser vos documents de manière structurée."}
              </p>
              {!searchQuery && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="group button-primary px-10 py-4 rounded-2xl font-semibold flex items-center gap-3 mx-auto shadow-lg text-lg transition-all duration-300 hover:scale-105"
                >
                  <FileText className="w-6 h-6" />
                  <span>Créer la première rubrique</span>
                  <Plus className="w-5 h-5" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {filteredRubriques.map((rubrique) => (
                <div
                  key={rubrique.id}
                  className="group card-elevated hover:border-primary-300 transition-all duration-300"
                >
                  <div className="p-6">
                    <div className="flex items-center justify-between">
                      {/* Informations principales */}
                      <div className="flex items-center gap-6 flex-1 min-w-0">
                        {/* Icône */}
                        <div className="w-14 h-14 bg-primary-600 rounded-xl flex items-center justify-center shadow-lg flex-shrink-0">
                          <FileText className="w-7 h-7 text-white" />
                        </div>

                        {/* Contenu principal */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-4 mb-2">
                            <h3 className="text-xl font-bold text-primary-800 group-hover:text-primary-700 transition-colors duration-300">
                              {rubrique.nom}
                            </h3>
                            {rubrique.created_at && (
                              <div className="flex items-center gap-1 text-xs text-primary-500 bg-primary-100 px-2 py-1 rounded-lg">
                                <Calendar className="w-3 h-3" />
                                <span>
                                  {new Date(
                                    rubrique.created_at
                                  ).toLocaleDateString("fr-FR")}
                                </span>
                              </div>
                            )}
                          </div>
                          <p className="text-primary-600 mb-4 line-clamp-2">
                            {rubrique.description}
                          </p>

                          {/* Statistiques en ligne */}
                          <div className="flex items-center gap-8">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-accent-blue-light rounded-lg flex items-center justify-center">
                                <FolderPlus className="w-5 h-5 text-accent-blue" />
                              </div>
                              <div>
                                <div className="text-xl font-bold text-primary-800">
                                  {rubrique.stats.sousDossiersCount}
                                </div>
                                <div className="text-sm text-primary-600">
                                  Sous-dossiers
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-accent-green-light rounded-lg flex items-center justify-center">
                                <File className="w-5 h-5 text-accent-green" />
                              </div>
                              <div>
                                <div className="text-xl font-bold text-primary-800">
                                  {rubrique.stats.piecesCount}
                                </div>
                                <div className="text-sm text-primary-600">
                                  Pièces
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-3 flex-shrink-0">
                        <button
                          onClick={() => handleViewContent(rubrique)}
                          className="button-primary cursor-pointer	 px-6 py-3 rounded-xl font-semibold flex items-center gap-2 transition-all duration-300 hover:scale-105 shadow-lg hover:shadow-xl"
                        >
                          <Eye className="w-4 h-4" />
                          Voir le contenu
                        </button>

                        <button
                          onClick={() => handleEditClick(rubrique)}
                          className="px-4 py-3 bg-primary-50 text-primary-700 hover:bg-primary-100 rounded-xl border border-primary-500 cursor-pointer transition-all duration-300"
                          title="Modifier"
                        >
                          <Edit className="w-4 h-4" />
                        </button>

                        <button
                          onClick={() => handleDeleteRubrique(rubrique.id)}
                          className="px-4 py-3 text-primary-500 bg-error-50 text-error-700 hover:bg-error-100 rounded-xl border border-error-500 cursor-pointer transition-all duration-300"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Create Form Modal */}
        {showCreateForm && (
          <RubriqueForm
            isOpen={showCreateForm}
            onClose={() => setShowCreateForm(false)}
            onSubmit={handleCreateRubrique}
            mode="create"
          />
        )}

        {/* Edit Form Modal */}
        {showEditForm && editingRubrique && (
          <RubriqueForm
            isOpen={showEditForm}
            onClose={() => {
              setShowEditForm(false);
              setEditingRubrique(null);
            }}
            onSubmit={handleUpdateRubrique}
            rubrique={editingRubrique}
            mode="edit"
          />
        )}

        {/* Toast Notifications */}
        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}
