"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import {
  Search,
  Filter,
  Edit,
  Trash2,
  Users,
  UserPlus,
  X,
  Loader2,
  RefreshCw,
  Settings,
  Building2,
  AlertCircle,
  BadgeCheck,
  Info,
  Folder,
  FileText,
  Calendar,
  User,
  Phone,
} from "lucide-react";
import { AgentFormData } from "@/types";
import AgentForm from "@/components/AgentForm";
import { agentsService } from "@/services/agents";
import {
  agentRubriqueService,
  AgentWithRubrique,
} from "@/services/agent-rubrique";
import {
  sousDossiersService,
  type SousDossier,
} from "@/services/sous-dossiers";
import { piecesService } from "@/services/pieces";

import type { Piece } from "@/types";

// Composant pour une carte de pièce
function PieceCard({ piece }: { piece: Piece }) {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 hover:shadow-md">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center">
          <FileText className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1">
          <h6 className="font-semibold text-slate-800 mb-1">{piece.nom}</h6>
          {piece.description && (
            <p className="text-sm text-slate-600 mb-2">{piece.description}</p>
          )}
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <div className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              <span>
                Ajouté le {new Date(piece.createdAt).toLocaleDateString()}
              </span>
            </div>
            {piece.aMetadonnees && (
              <div className="flex items-center gap-1">
                <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                <span>Avec métadonnées</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Composant pour une carte de sous-dossier avec état local
function SousDossierCard({
  sousDossier,
  initialPieces = [],
}: {
  sousDossier: SousDossier;
  initialPieces?: Piece[];
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [pieces, setPieces] = useState<Piece[]>(initialPieces);
  const [loadingPieces, setLoadingPieces] = useState(false);
  const [piecesLoaded, setPiecesLoaded] = useState(false);

  const handleToggle = async () => {
    if (isExpanded) {
      setIsExpanded(false);
    } else {
      setIsExpanded(true);
      if (!piecesLoaded) {
        setLoadingPieces(true);
        try {
          const data = await piecesService.getAllPiecesBySousDossier(
            sousDossier.id
          );
          setPieces(data);
          setPiecesLoaded(true);
        } catch (err) {
          console.error("Erreur lors du chargement des pièces:", err);
          setPieces([]);
        } finally {
          setLoadingPieces(false);
        }
      }
    }
  };

  const renderPiecesContent = () => {
    if (loadingPieces) {
      return (
        <div className="p-8 text-center">
          <Loader2 className="w-6 h-6 text-slate-400 animate-spin mx-auto mb-3" />
          <p className="text-slate-600">Chargement des pièces...</p>
        </div>
      );
    }

    if (pieces.length === 0) {
      return (
        <div className="p-8 text-center">
          <div className="w-16 h-16 bg-slate-100 rounded-xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-slate-400" />
          </div>
          <h4 className="text-lg font-semibold text-slate-800 mb-2">
            Aucun document
          </h4>
          <p className="text-slate-600">
            Ce sous-dossier ne contient pas encore de pièces.
          </p>
        </div>
      );
    }

    return (
      <div className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-2 h-6 bg-blue-500 rounded-full"></div>
          <h5 className="text-lg font-semibold text-slate-800">
            Documents dans ce sous-dossier
          </h5>
        </div>
        <div className="grid gap-3">
          {pieces.map((piece) => (
            <PieceCard key={piece.id} piece={piece} />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg hover:border-slate-300">
      {/* Header du sous-dossier */}
      <div
        className="p-6 cursor-pointer hover:bg-slate-50"
        onClick={handleToggle}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center shadow-lg">
              <Folder className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="text-xl font-bold text-slate-800 mb-1">
                {sousDossier.titre}
              </h4>
              {sousDossier.description && (
                <p className="text-slate-600 mb-3 leading-relaxed">
                  {sousDossier.description}
                </p>
              )}
              <div className="flex items-center gap-6 text-sm text-slate-500">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  <span>
                    Créé le{" "}
                    {new Date(sousDossier.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4" />
                  <span>
                    {pieces.length} pièce{pieces.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-green-100 text-green-800 border border-green-200">
              Actif
            </span>
            <div
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                isExpanded
                  ? "bg-blue-100 text-blue-600"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Contenu des pièces - rendu conditionnel simple */}
      {isExpanded && (
        <div className="border-t border-slate-200 bg-slate-50/50">
          {renderPiecesContent()}
        </div>
      )}
    </div>
  );
}

export default function AgentsPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentWithRubrique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<AgentWithRubrique | null>(
    null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingAgent, setEditingAgent] = useState<AgentWithRubrique | null>(
    null
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [agentToDelete, setAgentToDelete] = useState<AgentWithRubrique | null>(
    null
  );
  const [affectationFilter, setAffectationFilter] = useState<
    "all" | "assigned" | "unassigned"
  >("all");
  const [activeTab, setActiveTab] = useState<"details" | "sous-dossiers">(
    "sous-dossiers"
  );
  const [sousDossiers, setSousDossiers] = useState<SousDossier[]>([]);
  const [loadingSousDossiers, setLoadingSousDossiers] = useState(false);

  // Charger les agents depuis l'API locale
  useEffect(() => {
    loadAgents();
  }, []);

  const loadAgents = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await agentRubriqueService.getAgentsWithRubriques();
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
    const matchesSearch =
      agent.nom.toLowerCase().includes(searchLower) ||
      agent.matricule.toLowerCase().includes(searchLower) ||
      agent.fonction.toLowerCase().includes(searchLower);

    // Filtre par affectation
    let matchesAffectation = true;
    if (affectationFilter === "assigned") {
      matchesAffectation = !!agent.rubrique_id;
    } else if (affectationFilter === "unassigned") {
      matchesAffectation = !agent.rubrique_id;
    }

    return matchesSearch && matchesAffectation;
  });

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleEditAgent = (agent: AgentWithRubrique) => {
    setEditingAgent(agent);
    setShowEditForm(true);
  };

  const loadSousDossiers = async (rubriqueId: string) => {
    if (!rubriqueId) return;

    setLoadingSousDossiers(true);
    try {
      const data = await sousDossiersService.getAllSousDossiersByRubrique(
        rubriqueId
      );
      setSousDossiers(data);
    } catch (err) {
      console.error("Erreur lors du chargement des sous-dossiers:", err);
      setSousDossiers([]);
    } finally {
      setLoadingSousDossiers(false);
    }
  };

  const handleAgentSelect = (agent: AgentWithRubrique) => {
    setSelectedAgent(agent);
    setActiveTab("sous-dossiers");
    setSousDossiers([]);

    // Charger les sous-dossiers si l'agent est affecté à une rubrique
    if (agent.rubrique_id) {
      loadSousDossiers(agent.rubrique_id);
    }
  };

  const handleDeleteAgent = (agent: AgentWithRubrique) => {
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

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header Card */}
        <div className="mb-8">
          <div className="bg-primary-700 mb-5 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <Users className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                      Gestion des Agents
                    </h1>
                    <p className="text-primary-100 text-lg">
                      Gérez les informations de vos collaborateurs et leurs
                      affectations
                    </p>
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="w-2 h-2 bg-accent-green rounded-full"></div>
                        <span className="text-white text-sm font-medium">
                          {agents.filter((agent) => agent.rubrique_id).length}{" "}
                          agents affectés
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                        <span className="text-white text-sm font-medium">
                          {agents.filter((agent) => !agent.rubrique_id).length}{" "}
                          agents non affectés
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={loadAgents}
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
                      onClick={() => router.push("/agents/configuration")}
                      className="p-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
                      title="Paramètres d'affectation"
                    >
                      <Settings className="w-5 h-5 text-white" />
                    </button>
                    <button
                      onClick={() => setShowCreateForm(true)}
                      className="px-8 py-4 bg-white text-primary-700 rounded-xl hover:bg-primary-50 transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl font-semibold text-lg"
                    >
                      <UserPlus className="w-6 h-6" />
                      <span>Nouvel Agent</span>
                    </button>
                  </div>
                  <div className="text-center">
                    <div className="text-white/80 text-sm">
                      Total des agents
                    </div>
                    <div className="text-2xl font-bold text-white">
                      {agents.length}
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
                    agents.length > 0
                      ? (agents.filter((agent) => agent.rubrique_id).length /
                          agents.length) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
            <div className="flex items-center gap-6">
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
              {!loading && (
                <div className="flex items-center gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    <span className="text-gray-600">
                      {agents.filter((a) => a.rubrique_id).length} affectés
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                    <span className="text-gray-600">
                      {agents.filter((a) => !a.rubrique_id).length} non affectés
                    </span>
                  </div>
                </div>
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
                  className="w-full text-black pl-10 pr-4 py-2.5 border border-gray-500 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-gray-50"
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
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <select
                  value={affectationFilter}
                  onChange={(e) =>
                    setAffectationFilter(
                      e.target.value as "all" | "assigned" | "unassigned"
                    )
                  }
                  className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-gray-50"
                >
                  <option value="all">Toutes les affectations</option>
                  <option value="assigned">Agents affectés</option>
                  <option value="unassigned">Agents non affectés</option>
                </select>
                <select className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-gray-50">
                  <option value="">Toutes les fonctions</option>
                  <option value="manager">Manager</option>
                  <option value="developpeur">Développeur</option>
                  <option value="analyste">Analyste</option>
                  <option value="designer">Designer</option>
                </select>
                <select className="w-full px-3 text-black py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-gray-50">
                  <option value="">Tous les sexes</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
                <select className="w-full text-black px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-gray-50">
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
              <thead className="bg-gradient-to-r from-primary-50 to-primary-100">
                <tr>
                  <th className="px-6 py-5 text-left text-sm font-bold text-primary-800 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-primary-800 uppercase tracking-wider">
                    Matricule
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-primary-800 uppercase tracking-wider">
                    Fonction
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-primary-800 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-5 text-left text-sm font-bold text-primary-800 uppercase tracking-wider">
                    Affectation
                  </th>
                  <th className="px-6 py-5 text-right text-sm font-bold text-primary-800 uppercase tracking-wider">
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
                    <tr
                      key={agent.id}
                      className={`${
                        agent.rubrique_id
                          ? "bg-accent-green-light/10 hover:bg-accent-green-light/20 border-l-4 border-accent-green"
                          : "bg-warning-50/30 hover:bg-warning-100/50 border-l-4 border-warning-500"
                      } transition-all duration-200`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div
                            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg border-2 ${
                              agent.rubrique_id
                                ? "bg-accent-green text-white border-accent-green"
                                : "bg-warning-600 text-white border-gray-600"
                            }`}
                          >
                            <span
                              className={`text-sm font-bold text-white 
                              `}
                            >
                              {agent.nom.charAt(0)}
                              {agent.nom.charAt(1)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-base font-bold text-gray-900">
                              {agent.nom}
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                              {agent.date_naissance} • {agent.lieu_naissance}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-primary-600 text-white shadow-md border border-primary-700">
                          <BadgeCheck className="w-4 h-4 mr-2" />
                          {agent.matricule}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-lg text-sm font-medium bg-gray-100 text-gray-800 border border-gray-200">
                          {agent.fonction}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="text-sm font-medium text-gray-900">
                            {agent.telephone}
                          </div>
                          <div className="text-xs text-gray-500 bg-gray-50 px-2 py-1 rounded-md border border-gray-200">
                            {agent.adresse}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {agent.rubrique_id ? (
                          <div className="space-y-2">
                            <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-accent-green text-white border border-accent-green shadow-md">
                              <Building2 className="w-4 h-4 mr-2" />
                              Affecté
                            </span>
                            <span className="text-xs text-gray-600 bg-gray-100 px-2 py-1 rounded-md">
                              {agent.rubrique_nom}
                            </span>
                          </div>
                        ) : (
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-sm font-bold bg-warning-600 text-white border border-warning-700 shadow-md">
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Non affecté
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end space-x-2">
                          <button
                            onClick={() => handleAgentSelect(agent)}
                            className="p-2.5 text-primary-600 bg-primary-50 hover:text-primary-700 hover:bg-primary-100 rounded-lg transition-all duration-200 group border border-primary-200 hover:border-primary-300 shadow-sm hover:shadow-md"
                            title="Voir les détails"
                          >
                            <Info className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleEditAgent(agent)}
                            className="p-2.5 text-blue-600 bg-blue-50 hover:text-blue-700 hover:bg-blue-100 rounded-lg transition-all duration-200 group border border-blue-200 hover:border-blue-300 shadow-sm hover:shadow-md"
                            title="Modifier"
                          >
                            <Edit className="w-4 h-4 group-hover:scale-110 transition-transform" />
                          </button>
                          <button
                            onClick={() => handleDeleteAgent(agent)}
                            className="p-2.5 text-red-600 bg-red-50 hover:text-red-700 hover:bg-red-100 rounded-lg transition-all duration-200 group border border-red-200 hover:border-red-300 shadow-sm hover:shadow-md"
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

        {/* Modal de détail de l'agent avec onglets */}
        {selectedAgent && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              {/* Header de la modale */}
              <div className="bg-gradient-to-r from-slate-50 to-slate-100 px-8 py-6 border-b border-slate-200">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-slate-500 to-slate-600 rounded-xl flex items-center justify-center shadow-lg">
                      <User className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold text-slate-800">
                        {selectedAgent.nom}
                      </h3>
                      <p className="text-slate-600 font-medium">
                        {selectedAgent.matricule} • {selectedAgent.fonction}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedAgent(null)}
                    className="p-3 rounded-xl hover:bg-slate-200 transition-colors group"
                  >
                    <X className="w-5 h-5 text-slate-600 group-hover:text-slate-800" />
                  </button>
                </div>
              </div>

              {/* Onglets */}
              <div className="bg-slate-50 px-8 py-4 border-b border-slate-200">
                <div className="flex space-x-1">
                  <button
                    onClick={() => setActiveTab("details")}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                      activeTab === "details"
                        ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                  >
                    <User className="w-4 h-4" />
                    Informations personnelles
                  </button>
                  <button
                    onClick={() => setActiveTab("sous-dossiers")}
                    className={`px-6 py-3 rounded-lg font-semibold transition-all duration-200 flex items-center gap-2 ${
                      activeTab === "sous-dossiers"
                        ? "bg-white text-slate-800 shadow-sm border border-slate-200"
                        : "text-slate-600 hover:text-slate-800 hover:bg-slate-100"
                    }`}
                    disabled={!selectedAgent.rubrique_id}
                  >
                    <Folder className="w-4 h-4" />
                    Sous-dossiers
                    {!selectedAgent.rubrique_id && (
                      <span className="text-xs bg-slate-200 text-slate-500 px-2 py-1 rounded-full">
                        Non affecté
                      </span>
                    )}
                  </button>
                </div>
              </div>

              {/* Contenu des onglets */}
              <div className="p-8 max-h-[60vh] overflow-y-auto">
                {activeTab === "details" && (
                  <div className="space-y-8">
                    {/* Informations personnelles */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-6">
                        <div className="bg-slate-50 rounded-xl p-6">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <User className="w-5 h-5 text-slate-600" />
                            Identité
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-slate-600">
                                Nom complet
                              </label>
                              <p className="text-slate-900 font-semibold mt-1">
                                {selectedAgent.nom}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-600">
                                Matricule
                              </label>
                              <p className="text-slate-900 font-semibold mt-1">
                                {selectedAgent.matricule}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-600">
                                Fonction
                              </label>
                              <p className="text-slate-900 font-semibold mt-1">
                                {selectedAgent.fonction}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-6">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Calendar className="w-5 h-5 text-slate-600" />
                            Naissance
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-slate-600">
                                Date de naissance
                              </label>
                              <p className="text-slate-900 font-semibold mt-1">
                                {selectedAgent.date_naissance}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-600">
                                Lieu de naissance
                              </label>
                              <p className="text-slate-900 font-semibold mt-1">
                                {selectedAgent.lieu_naissance}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-600">
                                Sexe
                              </label>
                              <p className="text-slate-900 font-semibold mt-1">
                                {selectedAgent.sexe === "M"
                                  ? "Masculin"
                                  : "Féminin"}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-600">
                                Situation matrimoniale
                              </label>
                              <p className="text-slate-900 font-semibold mt-1">
                                {selectedAgent.situationMatrimoniale}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="bg-slate-50 rounded-xl p-6">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Phone className="w-5 h-5 text-slate-600" />
                            Contact
                          </h4>
                          <div className="space-y-4">
                            <div>
                              <label className="text-sm font-medium text-slate-600">
                                Téléphone
                              </label>
                              <p className="text-slate-900 font-semibold mt-1">
                                {selectedAgent.telephone}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-slate-600">
                                Adresse
                              </label>
                              <p className="text-slate-900 font-semibold mt-1">
                                {selectedAgent.adresse}
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="bg-slate-50 rounded-xl p-6">
                          <h4 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
                            <Building2 className="w-5 h-5 text-slate-600" />
                            Affectation
                          </h4>
                          <div className="mt-4">
                            {selectedAgent.rubrique_id ? (
                              <div className="flex items-center gap-3">
                                <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-green-100 text-green-800 border border-green-200">
                                  <BadgeCheck className="w-4 h-4 mr-2" />
                                  Affecté
                                </span>
                                <span className="text-slate-900 font-semibold">
                                  {selectedAgent.rubrique_nom}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-semibold bg-orange-100 text-orange-800 border border-orange-200">
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Non affecté à une rubrique
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeTab === "sous-dossiers" && (
                  <div className="space-y-6">
                    {!selectedAgent.rubrique_id ? (
                      <div className="text-center py-16">
                        <div className="w-20 h-20 bg-gradient-to-br from-orange-100 to-orange-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                          <AlertCircle className="w-10 h-10 text-orange-600" />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800 mb-3">
                          Agent non affecté
                        </h3>
                        <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                          Cet agent n&apos;est pas encore affecté à une
                          rubrique. Affectez-le à une rubrique pour voir ses
                          sous-dossiers et pièces.
                        </p>
                      </div>
                    ) : (
                      <div>
                        {/* Header avec statistiques */}
                        <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-6 mb-8 border border-slate-200">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="text-2xl font-bold text-slate-800 mb-2">
                                Sous-dossiers de la rubrique
                              </h3>
                              <p className="text-slate-600 font-medium">
                                {selectedAgent.rubrique_nom}
                              </p>
                            </div>
                            <div className="flex items-center gap-6">
                              <div className="text-center">
                                <div className="text-3xl font-bold text-slate-800">
                                  {sousDossiers.length}
                                </div>
                                <div className="text-sm text-slate-600">
                                  Sous-dossier
                                  {sousDossiers.length !== 1 ? "s" : ""}
                                </div>
                              </div>
                              <div className="w-px h-12 bg-slate-300"></div>
                              <div className="text-center">
                                <div className="text-3xl font-bold text-slate-800">
                                  0
                                </div>
                                <div className="text-sm text-slate-600">
                                  Pièces totales
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {loadingSousDossiers ? (
                          <div className="flex items-center justify-center py-16">
                            <div className="text-center">
                              <Loader2 className="w-12 h-12 text-slate-400 animate-spin mx-auto mb-4" />
                              <p className="text-slate-600 font-medium">
                                Chargement des sous-dossiers...
                              </p>
                            </div>
                          </div>
                        ) : sousDossiers.length === 0 ? (
                          <div className="text-center py-16">
                            <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
                              <Folder className="w-10 h-10 text-slate-400" />
                            </div>
                            <h3 className="text-xl font-bold text-slate-800 mb-3">
                              Aucun sous-dossier
                            </h3>
                            <p className="text-slate-600 max-w-md mx-auto leading-relaxed">
                              Cette rubrique ne contient pas encore de
                              sous-dossiers. Créez des sous-dossiers pour
                              organiser les documents.
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-4">
                            {sousDossiers.map((sousDossier) => (
                              <SousDossierCard
                                key={sousDossier.id}
                                sousDossier={sousDossier}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Footer de la modale */}
              <div className="bg-slate-50 px-8 py-6 border-t border-slate-200">
                <div className="flex justify-end space-x-3">
                  <button
                    className="px-6 py-3 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors font-medium"
                    onClick={() => setSelectedAgent(null)}
                  >
                    Fermer
                  </button>
                  <button
                    className="px-6 py-3 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors font-medium"
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
                  <span className="font-semibold">{agentToDelete.nom}</span> ?
                  Cette action est irréversible.
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
