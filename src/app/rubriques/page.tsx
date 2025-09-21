"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Plus,
  Search,
  Filter,
  Eye,
  Edit,
  Trash2,
  Settings,
  FileText,
  RefreshCw,
} from "lucide-react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import RubriqueForm from "@/components/RubriqueForm";
import { ToastContainer, useToast } from "@/components/Toast";
import { rubriquesService } from "@/services/rubriques";
import { Rubrique, RubriqueFormData } from "@/types";

export default function RubriquesPage() {
  const router = useRouter();
  const [rubriques, setRubriques] = useState<Rubrique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRubrique, setEditingRubrique] = useState<Rubrique | null>(null);
  const [showEditForm, setShowEditForm] = useState(false);
  const { toasts, removeToast, success, error: showError } = useToast();

  useEffect(() => {
    loadRubriques();
  }, []);

  const loadRubriques = async () => {
    try {
      setLoading(true);
      const data = await rubriquesService.getAllRubriques();
      setRubriques(data);
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
      setRubriques([newRubrique, ...rubriques]);
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
        setRubriques(
          rubriques.map((r) =>
            r.id === editingRubrique.id ? updatedRubrique : r
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

  const handleDeleteRubrique = async (id: string) => {
    const rubriqueToDelete = rubriques.find((r) => r.id === id);
    if (confirm("Êtes-vous sûr de vouloir supprimer cette rubrique ?")) {
      try {
        await rubriquesService.deleteRubrique(id);
        setRubriques(rubriques.filter((r) => r.id !== id));
        success(
          "Rubrique supprimée",
          `La rubrique "${rubriqueToDelete?.nom}" a été supprimée avec succès.`
        );
      } catch (err) {
        console.error("Error in handleDeleteRubrique:", err);
        showError(
          "Erreur de suppression",
          "Impossible de supprimer la rubrique. Veuillez réessayer."
        );
      }
    }
  };

  const handleEditClick = (rubrique: Rubrique) => {
    setEditingRubrique(rubrique);
    setShowEditForm(true);
  };

  const handleViewContent = (rubrique: Rubrique) => {
    // TODO: Implémenter la navigation vers le contenu de la rubrique
    console.log("Voir le contenu de:", rubrique.nom);
  };

  const handleSettings = (rubrique: Rubrique) => {
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
            <div className="bg-primary-700 mb-5 rounded-2xl shadow-2xl overflow-hidden">
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
                            0 documents archivés
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
              <div className="flex-1 relative">
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
                <span className="text-sm text-gray-600">
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

          {/* Rubriques Table */}
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            {filteredRubriques.length === 0 ? (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Filter className="w-10 h-10 text-gray-400" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  Aucune rubrique trouvée
                </h3>
                <p className="text-gray-600 mb-6 max-w-md mx-auto">
                  {searchQuery
                    ? "Aucune rubrique ne correspond à votre recherche. Essayez avec d'autres mots-clés."
                    : "Commencez par créer votre première rubrique pour organiser vos documents."}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-lg text-sm font-medium transition-colors shadow-lg hover:shadow-xl"
                  >
                    <Plus className="w-4 h-4 inline mr-2" />
                    Créer ma première rubrique
                  </button>
                )}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Nom
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>

                      <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredRubriques.map((rubrique) => (
                      <tr key={rubrique.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {rubrique.nom}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 max-w-xs truncate">
                            {rubrique.description}
                          </div>
                        </td>

                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleViewContent(rubrique)}
                              className="bg-blue-50 hover:bg-blue-100 text-blue-600 hover:text-blue-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                              title="Voir le contenu"
                            >
                              <Eye className="w-3 h-3" />
                              Voir
                            </button>
                            <button
                              onClick={() => handleSettings(rubrique)}
                              className="bg-purple-50 hover:bg-purple-100 text-purple-600 hover:text-purple-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                              title="Paramètres et sous-dossiers"
                            >
                              <Settings className="w-3 h-3" />
                              Paramètres
                            </button>
                            <button
                              onClick={() => handleEditClick(rubrique)}
                              className="bg-gray-50 hover:bg-gray-100 text-gray-600 hover:text-gray-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                              title="Modifier"
                            >
                              <Edit className="w-3 h-3" />
                              Modifier
                            </button>
                            <button
                              onClick={() => handleDeleteRubrique(rubrique.id)}
                              className="bg-red-50 hover:bg-red-100 text-red-600 hover:text-red-700 px-3 py-2 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                              title="Supprimer"
                            >
                              <Trash2 className="w-3 h-3" />
                              Supprimer
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
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
