"use client";

import { useState, useEffect } from "react";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  Users,
  UserPlus,
  X,
  Loader2,
  RefreshCw,
} from "lucide-react";
import { Agent, AgentFormData } from "@/types";
import AgentForm from "@/components/AgentForm";
import { agentsService } from "@/services/agents";
import {
  testSupabaseConnection,
  createAgentsTable,
} from "@/utils/test-supabase";

export default function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<Agent | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<Agent | null>(null);

  // Charger les agents depuis Supabase
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentsService.getAllAgents();
      setAgents(data);
    } catch (err) {
      setError("Erreur lors du chargement des agents");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Filtrage des agents
  const filteredAgents = agents.filter((agent) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      agent.nom.toLowerCase().includes(searchLower) ||
      agent.prenom.toLowerCase().includes(searchLower) ||
      agent.matricule.toLowerCase().includes(searchLower) ||
      agent.fonction.toLowerCase().includes(searchLower)
    );
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleViewAgent = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleEditAgent = (agent: Agent) => {
    setEditingAgent(agent);
    setShowEditForm(true);
  };

  const handleDeleteAgent = (agent: Agent) => {
    setAgentToDelete(agent);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (agentToDelete) {
      try {
        await agentsService.deleteAgent(agentToDelete.id);
        setAgents(agents.filter((agent) => agent.id !== agentToDelete.id));
        setShowDeleteConfirm(false);
        setAgentToDelete(null);
      } catch (err) {
        setError("Erreur lors de la suppression de l'agent");
        console.error(err);
      }
    }
  };

  const handleCreateAgent = async (formData: AgentFormData) => {
    try {
      const newAgent = await agentsService.createAgent(formData);
      setAgents([newAgent, ...agents]);
      setShowCreateForm(false);
    } catch (err) {
      console.error("Error in handleCreateAgent:", err);
      setError("Erreur lors de la création de l'agent");
    }
  };

  const handleUpdateAgent = async (formData: AgentFormData) => {
    if (editingAgent) {
      try {
        const updatedAgent = await agentsService.updateAgent(
          editingAgent.id,
          formData
        );
        setAgents(
          agents.map((agent) =>
            agent.id === editingAgent.id ? updatedAgent : agent
          )
        );
        setShowEditForm(false);
        setEditingAgent(null);
      } catch (err) {
        setError("Erreur lors de la mise à jour de l'agent");
        console.error(err);
      }
    }
  };

  const testConnection = async () => {
    console.log("🧪 Test de connexion Supabase...");
    const result = await testSupabaseConnection();
    if (result) {
      alert("✅ Connexion Supabase OK !");
    } else {
      alert("❌ Problème de connexion Supabase. Vérifiez la console.");
    }
  };

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header de la page */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center shadow-sm">
                <Users className="w-6 h-6 text-primary-700" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Gestion des Agents
                </h1>
                <p className="text-gray-600">
                  Gérez les informations de vos collaborateurs
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={loadAgents}
                disabled={loading}
                className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors disabled:opacity-50"
                title="Actualiser"
              >
                <RefreshCw
                  className={`w-4 h-4 text-gray-600 ${
                    loading ? "animate-spin" : ""
                  }`}
                />
              </button>

              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-primary-700 hover:bg-primary-800 text-white px-6 py-2.5 rounded-lg flex items-center space-x-2 transition-colors shadow-sm"
              >
                <UserPlus className="w-4 h-4" />
                <span>Nouvel Agent</span>
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="text-sm text-gray-600">
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Chargement...</span>
                </div>
              ) : (
                `${filteredAgents.length} agent${
                  filteredAgents.length !== 1 ? "s" : ""
                } trouvé${filteredAgents.length !== 1 ? "s" : ""}`
              )}
            </div>
            {error && (
              <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-200">
                {error}
              </div>
            )}
          </div>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-xl shadow-md border border-gray-300 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom, matricule ou fonction..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-gray-50"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="px-4 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors flex items-center space-x-2"
            >
              <Filter className="w-4 h-4 text-gray-600" />
              <span className="text-primary-700">Filtres</span>
            </button>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-slate-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-gray-50">
                  <option value="">Toutes les fonctions</option>
                  <option value="manager">Manager</option>
                  <option value="developpeur">Développeur</option>
                  <option value="analyste">Analyste</option>
                  <option value="designer">Designer</option>
                </select>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-gray-50">
                  <option value="">Tous les sexes</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-gray-50">
                  <option value="">Toutes les situations</option>
                  <option value="Celibataire">Célibataire</option>
                  <option value="Marie">Marié(e)</option>
                  <option value="Divorce">Divorcé(e)</option>
                  <option value="Veuf">Veuf/Veuve</option>
                </select>
              </div>
            </div>
          )}
        </div>

        {/* Tableau des agents */}
        <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">
                    Matricule
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">
                    Fonction
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-primary-700 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-4 text-right text-xs font-semibold text-primary-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex flex-col items-center space-y-4">
                        <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center">
                          <Users className="w-8 h-8 text-slate-400" />
                        </div>
                        <div>
                          <h3 className="text-lg font-medium text-gray-900">
                            {searchQuery
                              ? "Aucun agent trouvé"
                              : "Aucun agent enregistré"}
                          </h3>
                          <p className="text-gray-500 mt-1">
                            {searchQuery
                              ? "Aucun agent ne correspond à vos critères de recherche."
                              : "Commencez par ajouter votre premier agent."}
                          </p>
                        </div>
                        {!searchQuery && (
                          <button
                            onClick={() => setShowCreateForm(true)}
                            className="mt-2 bg-primary-700 hover:bg-primary-800 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                          >
                            <UserPlus className="w-4 h-4" />
                            <span>Ajouter un agent</span>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center shadow-sm border border-slate-200">
                            <span className="text-sm font-semibold text-primary-700">
                              {agent.prenom.charAt(0)}
                              {agent.nom.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-semibold text-gray-900">
                              {agent.prenom} {agent.nom}
                            </div>
                            <div className="text-sm text-gray-600">
                              {agent.dateNaissance} • {agent.lieuNaissance}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-primary-100 text-primary-700">
                          {agent.matricule}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.fonction}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        <div>{agent.telephone}</div>
                        <div className="text-xs text-gray-500">
                          {agent.adresse}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
                          <div className="w-1.5 h-1.5 bg-green-500 rounded-full mr-1.5"></div>
                          Actif
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            onClick={() => handleViewAgent(agent)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-primary-100 rounded-lg transition-colors group"
                            title="Voir les détails"
                          >
                            <Eye className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleEditAgent(agent)}
                            className="p-2 text-gray-600 hover:text-gray-900 hover:bg-primary-100 rounded-lg transition-colors group"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleDeleteAgent(agent)}
                            className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors group"
                            title="Supprimer"
                          >
                            <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-gray-600">
            Affichage de 1 à {Math.min(filteredAgents.length, 10)} sur{" "}
            {filteredAgents.length} résultats
          </div>
          <div className="flex space-x-2">
            <button
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              disabled
            >
              Précédent
            </button>
            <button
              className="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              disabled
            >
              Suivant
            </button>
          </div>
        </div>

        {/* Modal de détail de l'agent */}
        {selectedAgent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-900">
                    Détails de l&apos;agent
                  </h3>
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="p-2 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Nom complet
                      </label>
                      <p className="text-gray-900 mt-1">
                        {selectedAgent.prenom} {selectedAgent.nom}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Matricule
                      </label>
                      <p className="text-gray-900 mt-1">
                        {selectedAgent.matricule}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Fonction
                      </label>
                      <p className="text-gray-900 mt-1">
                        {selectedAgent.fonction}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Date de naissance
                      </label>
                      <p className="text-gray-900 mt-1">
                        {selectedAgent.dateNaissance}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Lieu de naissance
                      </label>
                      <p className="text-gray-900 mt-1">
                        {selectedAgent.lieuNaissance}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Sexe
                      </label>
                      <p className="text-gray-900 mt-1">
                        {selectedAgent.sexe === "M" ? "Masculin" : "Féminin"}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Situation matrimoniale
                      </label>
                      <p className="text-gray-900 mt-1">
                        {selectedAgent.situationMatrimoniale}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-semibold text-gray-600">
                        Téléphone
                      </label>
                      <p className="text-gray-900 mt-1">
                        {selectedAgent.telephone}
                      </p>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-semibold text-gray-600">
                      Adresse
                    </label>
                    <p className="text-gray-900 mt-1">
                      {selectedAgent.adresse}
                    </p>
                  </div>
                </div>
                <div className="flex justify-end space-x-3 mt-8">
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-lg text-primary-700 hover:bg-gray-50 transition-colors"
                    onClick={() => setSelectedAgent(null)}
                  >
                    Fermer
                  </button>
                  <button
                    className="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors"
                    onClick={() => {
                      handleEditAgent(selectedAgent);
                      setSelectedAgent(null);
                    }}
                  >
                    Modifier
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmation de suppression */}
        {showDeleteConfirm && agentToDelete && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full mx-4">
              <div className="p-6">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-900">
                    Confirmer la suppression
                  </h3>
                </div>
                <p className="text-gray-600 mb-6">
                  Êtes-vous sûr de vouloir supprimer l&apos;agent{" "}
                  <span className="font-semibold">
                    {agentToDelete.prenom} {agentToDelete.nom}
                  </span>{" "}
                  ? Cette action est irréversible.
                </p>
                <div className="flex justify-end space-x-3">
                  <button
                    className="px-4 py-2 border border-gray-300 rounded-lg text-primary-700 hover:bg-gray-50 transition-colors"
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setAgentToDelete(null);
                    }}
                  >
                    Annuler
                  </button>
                  <button
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                    onClick={confirmDelete}
                  >
                    Supprimer
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Formulaire de création/modification */}
        <AgentForm
          isOpen={showCreateForm || showEditForm}
          onClose={() => {
            setShowCreateForm(false);
            setShowEditForm(false);
            setEditingAgent(null);
          }}
          onSubmit={showCreateForm ? handleCreateAgent : handleUpdateAgent}
          agent={editingAgent}
          mode={showCreateForm ? "create" : "edit"}
        />
      </DashboardLayout>
    </AuthGuard>
  );
}
