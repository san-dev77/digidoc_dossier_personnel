"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import {
  ArrowLeft,
  Users,
  Building2,
  CheckCircle,
  X,
  AlertCircle,
  Search,
  Loader2,
  RefreshCw,
  Plus,
  UserCheck,
} from "lucide-react";
import { Rubrique } from "@/types";
import { rubriquesService } from "@/services/rubriques";
import {
  agentRubriqueService,
  AgentWithRubrique,
} from "@/services/agent-rubrique";

export default function AgentConfigurationPage() {
  const router = useRouter();
  const [agents, setAgents] = useState<AgentWithRubrique[]>([]);
  const [rubriques, setRubriques] = useState<Rubrique[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRubrique, setSelectedRubrique] = useState<string>("all");
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedRubriques, setSelectedRubriques] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"all" | "assigned" | "unassigned">(
    "all"
  );

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [agentsData, rubriquesData] = await Promise.all([
        agentRubriqueService.getAgentsWithRubriques(),
        rubriquesService.getAllRubriques(),
      ]);

      setAgents(agentsData);
      setRubriques(rubriquesData);
    } catch (err) {
      setError("Erreur lors du chargement des données");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignAgent = async (agentId: string, rubriqueId: string) => {
    try {
      await agentRubriqueService.assignAgentToRubrique(agentId, rubriqueId);
      await loadData(); // Recharger les données
    } catch (err) {
      setError("Erreur lors de l&apos;affectation de l&apos;agent");
      console.error(err);
    }
  };

  const handleRemoveAgent = async (agentId: string, rubriqueId: string) => {
    try {
      await agentRubriqueService.removeAgentFromRubrique(agentId, rubriqueId);
      await loadData(); // Recharger les données
    } catch (err) {
      setError("Erreur lors de la suppression de l&apos;affectation");
      console.error(err);
    }
  };

  const handleBulkAssign = async () => {
    try {
      setError(null);

      // Affecter chaque agent sélectionné à chaque rubrique sélectionnée
      for (const agentId of selectedAgents) {
        for (const rubriqueId of selectedRubriques) {
          await agentRubriqueService.assignAgentToRubrique(agentId, rubriqueId);
        }
      }

      await loadData(); // Recharger les données
      setShowBulkAssignModal(false);
      setSelectedAgents([]);
      setSelectedRubriques([]);
    } catch (err) {
      setError("Erreur lors de l&apos;affectation en masse");
      console.error(err);
    }
  };

  const toggleAgentSelection = (agentId: string) => {
    setSelectedAgents((prev) =>
      prev.includes(agentId)
        ? prev.filter((id) => id !== agentId)
        : [...prev, agentId]
    );
  };

  const toggleRubriqueSelection = (rubriqueId: string) => {
    setSelectedRubriques((prev) =>
      prev.includes(rubriqueId)
        ? prev.filter((id) => id !== rubriqueId)
        : [...prev, rubriqueId]
    );
  };

  const getAgentRubrique = (agentId: string) => {
    const agent = agents.find((a) => a.id === agentId);
    if (agent && agent.rubrique_id) {
      return {
        agent_id: agentId,
        rubrique_id: agent.rubrique_id,
        id: `${agentId}-${agent.rubrique_id}`, // ID temporaire
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };
    }
    return null;
  };

  const getRubriqueName = (rubriqueId: string, agentId?: string) => {
    // Si on a l&apos;ID de l&apos;agent, chercher directement dans les données de l&apos;agent
    if (agentId) {
      const agent = agents.find((a) => a.id === agentId);
      if (agent && agent.rubrique_nom) {
        return agent.rubrique_nom;
      }
    }

    // Sinon, chercher dans le tableau des rubriques
    const rubrique = rubriques.find((r) => r.id === rubriqueId);
    return rubrique?.nom || "Rubrique inconnue";
  };

  const filteredAgents = agents.filter((agent) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      agent.nom.toLowerCase().includes(searchLower) ||
      agent.prenom.toLowerCase().includes(searchLower) ||
      agent.matricule.toLowerCase().includes(searchLower) ||
      agent.fonction.toLowerCase().includes(searchLower);

    const agentRubrique = getAgentRubrique(agent.id);
    const isAssigned = !!agentRubrique;

    // Filtre par mode de vue
    if (viewMode === "assigned" && !isAssigned) return false;
    if (viewMode === "unassigned" && isAssigned) return false;

    // Filtre par rubrique spécifique
    if (selectedRubrique === "all") return matchesSearch;
    if (selectedRubrique === "unassigned") {
      return matchesSearch && !isAssigned;
    }

    return matchesSearch && agentRubrique?.rubrique_id === selectedRubrique;
  });

  return (
    <AuthGuard>
      <DashboardLayout>
        {/* Header Card */}
        <div className="mb-8">
          <div className="bg-primary-700 mb-5 rounded-2xl shadow-2xl overflow-hidden">
            <div className="p-8">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-6">
                  <button
                    onClick={() => router.back()}
                    className="p-3 rounded-xl border border-white/20 hover:bg-white/10 transition-all duration-200 backdrop-blur-sm"
                    title="Retour"
                  >
                    <ArrowLeft className="w-5 h-5 text-white" />
                  </button>
                  <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                    <Users className="w-12 h-12 text-white" />
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-white mb-2">
                      Configuration des Agents
                    </h1>
                    <p className="text-primary-100 text-lg">
                      Gérez les affectations des agents aux rubriques de manière
                      centralisée
                    </p>
                    <div className="flex items-center space-x-4 mt-4">
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="w-2 h-2 bg-accent-green rounded-full"></div>
                        <span className="text-white text-sm font-medium">
                          {
                            agents.filter((agent) => getAgentRubrique(agent.id))
                              .length
                          }{" "}
                          agents affectés
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                        <span className="text-white text-sm font-medium">
                          {
                            agents.filter(
                              (agent) => !getAgentRubrique(agent.id)
                            ).length
                          }{" "}
                          agents non affectés
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex flex-col space-y-3">
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={loadData}
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
                      onClick={() => {
                        setSelectedAgents([]);
                        setSelectedRubriques([]);
                        setShowBulkAssignModal(true);
                      }}
                      className="px-8 py-4 bg-white text-primary-700 rounded-xl hover:bg-primary-50 transition-all duration-300 flex items-center space-x-3 shadow-lg hover:shadow-xl font-semibold text-lg"
                      title="Affectation en masse"
                    >
                      <Plus className="w-6 h-6" />
                      <span>Affectation en masse</span>
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
                      ? (agents.filter((agent) => getAgentRubrique(agent.id))
                          .length /
                          agents.length) *
                        100
                      : 0
                  }%`,
                }}
              ></div>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
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
                  <div className="flex items-center gap-2 p-2 bg-accent-green-light rounded-lg border border-accent-green/20">
                    <div className="w-2 h-2 bg-accent-green rounded-full"></div>
                    <span className="text-gray-700 font-medium">
                      {agents.filter((a) => getAgentRubrique(a.id)).length}{" "}
                      affectés
                    </span>
                    <span className="text-xs text-gray-500">
                      (peuvent gérer des dossiers)
                    </span>
                  </div>
                  <div className="flex items-center gap-2 p-2 bg-warning-50 rounded-lg border border-gray-500 border-warning-200">
                    <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                    <span className="text-gray-700  border-gray-500 font-medium">
                      {agents.filter((a) => !getAgentRubrique(a.id)).length} non
                      affectés
                    </span>
                    <span className="text-xs text-gray-500">
                      (doivent être assignés)
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Modes de vue */}
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-600 font-medium">Vue :</span>
              <div className="flex bg-gray-100 rounded-lg p-1">
                <button
                  onClick={() => setViewMode("all")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewMode === "all"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Voir tous les agents (affectés et non affectés)"
                >
                  Tous
                </button>
                <button
                  onClick={() => setViewMode("assigned")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewMode === "assigned"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Voir seulement les agents affectés à une rubrique"
                >
                  Affectés
                </button>
                <button
                  onClick={() => setViewMode("unassigned")}
                  className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    viewMode === "unassigned"
                      ? "bg-white text-gray-900 shadow-sm"
                      : "text-gray-600 hover:text-gray-900"
                  }`}
                  title="Voir seulement les agents non affectés (à assigner)"
                >
                  Non affectés
                </button>
              </div>
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
                  placeholder="Rechercher un agent..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 text-black pr-4 py-2.5 border border-gray-500 rounded-lg focus:ring-2 focus:ring-slate-900 focus:border-slate-700 bg-gray-200"
                />
              </div>
            </div>
            <select
              value={selectedRubrique}
              onChange={(e) => setSelectedRubrique(e.target.value)}
              className="px-4 py-2.5 text-black border border-gray-500 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 bg-gray-50"
            >
              <option value="all">Toutes les rubriques</option>
              <option value="unassigned">Non affectés</option>
              {rubriques.map((rubrique) => (
                <option key={rubrique.id} value={rubrique.id}>
                  {rubrique.nom}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Vue des agents affectés */}
        {viewMode === "assigned" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200 bg-accent-green-light">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-accent-green" />
                Agents affectés
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Liste des agents déjà affectés à une rubrique
              </p>
              <div className="mt-3 p-3 bg-white/70 rounded-lg border border-accent-green/20">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-accent-green rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-xs text-gray-700">
                    <p className="font-medium mb-1">
                      💡 Que signifie &quot;affecté&quot; ?
                    </p>
                    <p>
                      Un agent affecté est assigné à une rubrique spécifique et
                      peut gérer les dossiers de cette rubrique. Il a accès aux
                      fonctionnalités de gestion des documents pour cette
                      section.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredAgents.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-accent-green-light rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-8 h-8 text-accent-green" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    Aucun agent affecté
                  </h3>
                  <p className="text-gray-500">
                    Aucun agent n&apos;est actuellement affecté à une rubrique.
                  </p>
                </div>
              ) : (
                filteredAgents.map((agent) => {
                  const agentRubrique = getAgentRubrique(agent.id);
                  const currentRubriqueId = agentRubrique?.rubrique_id;

                  return (
                    <div
                      key={agent.id}
                      className="p-6 bg-accent-green-light/20 hover:bg-accent-green-light/40 transition-all duration-200 border-l-4 border-accent-green"
                    >
                      <div className="flex  border-b border-t border-gray-500 items-center justify-between">
                        <div className="flex  border-b border-t border-gray-500 items-center space-x-4">
                          <div className="relative  border-b border-t border-gray-500">
                            <div className="w-14 h-14  border-b border-t border-gray-500 bg-accent-green rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-sm font-bold text-white">
                                {agent.prenom.charAt(0)}
                                {agent.nom.charAt(0)}
                              </span>
                            </div>
                            <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-green rounded-full flex items-center justify-center shadow-md">
                              <CheckCircle className="w-3 h-3 text-white" />
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">
                              {agent.prenom} {agent.nom}
                            </h4>
                            <p className="text-sm text-gray-600 font-medium">
                              {agent.matricule} • {agent.fonction}
                            </p>
                            <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
                              <span className="flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-accent-green rounded-full"></span>
                                Affecté depuis le{" "}
                                {new Date(agent.createdAt).toLocaleDateString(
                                  "fr-FR"
                                )}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          <div className="flex items-center space-x-3">
                            <span
                              className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-accent-green text-white shadow-md"
                              title="Cet agent est actuellement affecté à une rubrique"
                            >
                              <CheckCircle className="w-4 h-4 mr-2" />
                              Affecté
                            </span>
                            <div className="flex flex-col">
                              <span className="text-sm font-semibold text-gray-800 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                                {currentRubriqueId
                                  ? getRubriqueName(currentRubriqueId, agent.id)
                                  : "Rubrique inconnue"}
                              </span>
                              <span className="text-xs text-gray-500 mt-1 text-center">
                                Rubrique assignée
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() =>
                                currentRubriqueId &&
                                handleRemoveAgent(agent.id, currentRubriqueId)
                              }
                              className="p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 border border-red-200 hover:border-red-300 hover:shadow-md"
                              title="Retirer cet agent de la rubrique (il ne pourra plus gérer les dossiers de cette rubrique)"
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Liste des agents non affectés */}
        {viewMode === "unassigned" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden">
            <div className="p-6 border-b border-gray-200 bg-warning-50">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-warning-600" />
                Agents non affectés
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Cliquez sur une rubrique pour affecter un agent
              </p>
              <div className="mt-3 p-3 bg-white/70 rounded-lg border border-warning-200">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-warning-500 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-xs text-gray-700">
                    <p className="font-medium mb-1">
                      ⚠️ Que signifie &quot;non affecté&quot; ?
                    </p>
                    <p>
                      Un agent non affecté n&apos;est pas encore assigné à une
                      rubrique. Il ne peut pas gérer de dossiers jusqu&apos;à ce
                      qu&apos;il soit affecté à une rubrique spécifique.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredAgents.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-warning-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertCircle className="w-8 h-8 text-warning-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery
                      ? "Aucun agent non affecté trouvé"
                      : "Tous les agents sont affectés"}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery
                      ? "Aucun agent non affecté ne correspond à vos critères de recherche."
                      : "Tous les agents ont déjà été affectés à une rubrique."}
                  </p>
                </div>
              ) : (
                filteredAgents.map((agent) => {
                  return (
                    <div
                      key={agent.id}
                      className="p-6 bg-warning-50/50 hover:bg-warning-100/70 transition-all duration-200 border-l-4 border-warning-500"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-14 h-14 bg-warning-600 rounded-xl flex items-center justify-center shadow-lg">
                              <span className="text-sm font-bold text-white">
                                {agent.prenom.charAt(0)}
                                {agent.nom.charAt(0)}
                              </span>
                            </div>
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">
                              {agent.prenom} {agent.nom}
                            </h4>
                            <p className="text-sm text-gray-600 font-medium">
                              {agent.matricule} • {agent.fonction}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {/* Statut d'affectation */}
                          <div className="flex items-center space-x-3">
                            <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-warning-600 text-white border border-warning-700 shadow-sm">
                              <AlertCircle className="w-4 h-4 mr-2" />
                              Non affecté
                            </span>
                            <div className="text-xs text-gray-700 bg-gray-100 px-3 py-1 rounded-md border border-gray-300">
                              Aucune rubrique assignée
                            </div>
                          </div>

                          {/* Actions d'affectation */}
                          <div className="flex items-center space-x-2">
                            <div className="flex flex-col space-y-2">
                              <span className="text-xs text-gray-700 font-semibold">
                                Affecter à :
                              </span>
                              <div className="flex items-center space-x-2">
                                {rubriques.slice(0, 3).map((rubrique) => (
                                  <button
                                    key={rubrique.id}
                                    onClick={() =>
                                      handleAssignAgent(agent.id, rubrique.id)
                                    }
                                    className="px-4 py-2 text-sm font-semibold text-primary-700 bg-primary-100 hover:bg-primary-200 rounded-lg transition-all duration-200 border border-primary-200 hover:border-primary-300 hover:shadow-md"
                                    title={`Affecter ${agent.prenom} ${agent.nom} à la rubrique "${rubrique.nom}" - Il pourra gérer les dossiers de cette rubrique`}
                                  >
                                    {rubrique.nom}
                                  </button>
                                ))}
                                {rubriques.length > 3 && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                    +{rubriques.length - 3} autres
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Vue générale (tous les agents) */}
        {viewMode === "all" && (
          <div className="bg-white rounded-xl shadow-md border border-gray-300 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Gestion des affectations
              </h3>
              <p className="text-sm text-gray-600 mt-1">
                Vue d&apos;ensemble de tous les agents et leurs affectations
              </p>
              <div className="mt-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-2">
                  <div className="w-2 h-2 bg-primary-600 rounded-full mt-2 flex-shrink-0"></div>
                  <div className="text-xs text-gray-700">
                    <p className="font-medium mb-1">📊 Vue d&apos;ensemble</p>
                    <p>
                      Cette vue montre tous les agents avec leur statut
                      d&apos;affectation. Les agents affectés (vert) peuvent
                      gérer des dossiers, les non affectés (orange) doivent être
                      assignés à une rubrique.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="divide-y divide-gray-200">
              {filteredAgents.length === 0 ? (
                <div className="p-12 text-center">
                  <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-slate-400" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">
                    {searchQuery
                      ? "Aucun agent trouvé"
                      : "Aucun agent enregistré"}
                  </h3>
                  <p className="text-gray-500">
                    {searchQuery
                      ? "Aucun agent ne correspond à vos critères de recherche."
                      : "Commencez par ajouter des agents."}
                  </p>
                </div>
              ) : (
                filteredAgents.map((agent) => {
                  const agentRubrique = getAgentRubrique(agent.id);
                  const currentRubriqueId = agentRubrique?.rubrique_id;
                  const isAssigned = !!agentRubrique;

                  return (
                    <div
                      key={agent.id}
                      className={`p-6 transition-all duration-200 border-l-4 ${
                        isAssigned
                          ? "bg-accent-green-light/20 hover:bg-accent-green-light/40 border-accent-green"
                          : "bg-warning-50/50 hover:bg-warning-100/70 border-warning-500"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div
                              className={`w-14 h-14 rounded-xl flex items-center justify-center shadow-lg ${
                                isAssigned
                                  ? "bg-accent-green"
                                  : "bg-warning-600"
                              }`}
                            >
                              <span className="text-sm font-bold text-white">
                                {agent.prenom.charAt(0)}
                                {agent.nom.charAt(0)}
                              </span>
                            </div>
                            {isAssigned && (
                              <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-green rounded-full flex items-center justify-center shadow-md">
                                <CheckCircle className="w-3 h-3 text-white" />
                              </div>
                            )}
                          </div>
                          <div>
                            <h4 className="text-lg font-bold text-gray-900">
                              {agent.prenom} {agent.nom}
                            </h4>
                            <p className="text-sm text-gray-600 font-medium">
                              {agent.matricule} • {agent.fonction}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-4">
                          {/* Statut d'affectation */}
                          <div className="flex items-center space-x-3">
                            {currentRubriqueId ? (
                              <div className="flex flex-col space-y-2">
                                <div className="flex items-center space-x-3">
                                  <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-accent-green text-white shadow-md">
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Affecté
                                  </span>
                                  <span className="text-sm font-semibold text-gray-800 bg-gray-100 px-4 py-2 rounded-lg border border-gray-200">
                                    {getRubriqueName(
                                      currentRubriqueId,
                                      agent.id
                                    )}
                                  </span>
                                </div>
                                <div className="text-xs text-gray-500 bg-accent-green-light px-3 py-1 rounded-md border border-accent-green/20">
                                  Rubrique affectée :{" "}
                                  {getRubriqueName(currentRubriqueId, agent.id)}
                                </div>
                              </div>
                            ) : (
                              <div className="flex flex-col space-y-2">
                                <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-warning-600 text-white border border-warning-700 shadow-sm">
                                  <AlertCircle className="w-4 h-4 mr-2" />
                                  Non affecté
                                </span>
                                <div className="text-xs text-gray-700 bg-gray-100 px-3 py-1 rounded-md border border-gray-300">
                                  Aucune rubrique assignée
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions d'affectation
                          <div className="flex items-center space-x-2">
                            {currentRubriqueId ? (
                              <button
                                onClick={() =>
                                  handleRemoveAgent(agent.id, currentRubriqueId)
                                }
                                className="p-3 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl transition-all duration-200 border border-red-200 hover:border-red-300 hover:shadow-md"
                                title="Retirer de la rubrique"
                              >
                                <X className="w-5 h-5" />
                              </button>
                            ) : (
                              <div className="flex items-center space-x-2">
                                {rubriques.slice(0, 3).map((rubrique) => (
                                  <button
                                    key={rubrique.id}
                                    onClick={() =>
                                      handleAssignAgent(agent.id, rubrique.id)
                                    }
                                    className="px-4 py-2 text-sm font-semibold text-primary-700 bg-primary-100 hover:bg-primary-200 rounded-lg transition-all duration-200 border border-primary-200 hover:border-primary-300 hover:shadow-md"
                                    title={`Affecter à ${rubrique.nom}`}
                                  >
                                    {rubrique.nom}
                                  </button>
                                ))}
                                {rubriques.length > 3 && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                                    +{rubriques.length - 3} autres
                                  </span>
                                )}
                              </div>
                            )}
                          </div> */}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Modal d'affectation en masse */}
        {showBulkAssignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
              <div className="p-6 border-b border-gray-200 bg-primary-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Affectation en masse
                      </h3>
                      <p className="text-sm text-gray-600">
                        Sélectionnez les agents et les rubriques pour
                        l&apos;affectation
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setShowBulkAssignModal(false);
                      setSelectedAgents([]);
                      setSelectedRubriques([]);
                    }}
                    className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Sélection des agents */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary-600" />
                      Agents non affectés ({selectedAgents.length} sélectionnés)
                    </h4>
                    <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                      {agents
                        .filter((agent) => !getAgentRubrique(agent.id))
                        .map((agent) => {
                          const isSelected = selectedAgents.includes(agent.id);

                          return (
                            <div
                              key={agent.id}
                              onClick={() => toggleAgentSelection(agent.id)}
                              className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                                isSelected
                                  ? "bg-primary-50 border-primary-300 shadow-md"
                                  : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                              }`}
                            >
                              <div className="flex items-center space-x-3">
                                <div
                                  className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                    isSelected
                                      ? "bg-primary-600 border-primary-600"
                                      : "border-gray-300"
                                  }`}
                                >
                                  {isSelected && (
                                    <CheckCircle className="w-3 h-3 text-white" />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="font-semibold text-gray-900">
                                      {agent.prenom} {agent.nom}
                                    </span>
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {agent.matricule} • {agent.fonction}
                                  </p>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {agents.filter((agent) => !getAgentRubrique(agent.id))
                        .length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-sm">
                            Tous les agents sont déjà affectés
                          </p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Sélection des rubriques */}
                  <div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Building2 className="w-5 h-5 text-accent-green" />
                      Rubriques ({selectedRubriques.length} sélectionnées)
                    </h4>
                    <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                      {rubriques.map((rubrique) => {
                        const isSelected = selectedRubriques.includes(
                          rubrique.id
                        );

                        return (
                          <div
                            key={rubrique.id}
                            onClick={() => toggleRubriqueSelection(rubrique.id)}
                            className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border-2 ${
                              isSelected
                                ? "bg-accent-green-light border-accent-green shadow-md"
                                : "bg-white border-gray-200 hover:border-gray-300 hover:shadow-sm"
                            }`}
                          >
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-4 h-4 rounded border-2 flex items-center justify-center ${
                                  isSelected
                                    ? "bg-accent-green border-accent-green"
                                    : "border-gray-300"
                                }`}
                              >
                                {isSelected && (
                                  <CheckCircle className="w-3 h-3 text-white" />
                                )}
                              </div>
                              <div className="flex-1">
                                <span className="font-semibold text-gray-900">
                                  {rubrique.nom}
                                </span>
                                {rubrique.description && (
                                  <p className="text-sm text-gray-600 mt-1">
                                    {rubrique.description}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Résumé */}
                {selectedAgents.length > 0 && selectedRubriques.length > 0 && (
                  <div className="mt-6 p-4 bg-primary-50 rounded-lg border border-primary-200">
                    <h5 className="font-semibold text-gray-900 mb-2">
                      Résumé de l&apos;affectation :
                    </h5>
                    <p className="text-sm text-gray-700">
                      {selectedAgents.length} agent
                      {selectedAgents.length > 1 ? "s" : ""} sera
                      {selectedAgents.length > 1 ? "ont" : ""} affecté
                      {selectedAgents.length > 1 ? "s" : ""} à{" "}
                      {selectedRubriques.length} rubrique
                      {selectedRubriques.length > 1 ? "s" : ""}
                      <br />
                      <span className="font-medium">
                        Total :{" "}
                        {selectedAgents.length * selectedRubriques.length}{" "}
                        affectation
                        {selectedAgents.length * selectedRubriques.length > 1
                          ? "s"
                          : ""}
                      </span>
                    </p>
                  </div>
                )}
              </div>

              <div className="p-6 border-t border-gray-200 bg-gray-50">
                <div className="flex justify-end space-x-3">
                  <button
                    onClick={() => {
                      setShowBulkAssignModal(false);
                      setSelectedAgents([]);
                      setSelectedRubriques([]);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleBulkAssign}
                    disabled={
                      selectedAgents.length === 0 ||
                      selectedRubriques.length === 0
                    }
                    className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Affecter ({selectedAgents.length * selectedRubriques.length}
                    )
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
