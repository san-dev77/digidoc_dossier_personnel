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
  Trash2,
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
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRubrique, setSelectedRubrique] = useState<string>("all");
  const [showBulkAssignModal, setShowBulkAssignModal] = useState(false);
  const [selectedAgents, setSelectedAgents] = useState<string[]>([]);
  const [selectedRubriques, setSelectedRubriques] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"all" | "assigned" | "unassigned">(
    "all"
  );
  const [bulkAssignSearchQuery, setBulkAssignSearchQuery] = useState("");
  const [showAllAgentsInBulk, setShowAllAgentsInBulk] = useState(false);
  const [showRemoveConfirmModal, setShowRemoveConfirmModal] = useState(false);
  const [agentToRemove, setAgentToRemove] = useState<{
    agentId: string;
    rubriqueId: string;
    agentName: string;
    rubriqueName: string;
  } | null>(null);
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [selectedAgentForAssign, setSelectedAgentForAssign] =
    useState<AgentWithRubrique | null>(null);
  const [selectedRubriquesForAssign, setSelectedRubriquesForAssign] = useState<
    string[]
  >([]);
  const [isAssigning, setIsAssigning] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedAgentForDetails, setSelectedAgentForDetails] =
    useState<AgentWithRubrique | null>(null);
  const [showMultiRemoveModal, setShowMultiRemoveModal] = useState(false);
  const [selectedAgentForRemove, setSelectedAgentForRemove] =
    useState<AgentWithRubrique | null>(null);
  const [rubriquesToRemove, setRubriquesToRemove] = useState<string[]>([]);
  const [assignedRubriques, setAssignedRubriques] = useState<
    Map<string, string[]>
  >(new Map());

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [agentsData, rubriquesData, allRelations] = await Promise.all([
        agentRubriqueService.getAgentsWithRubriques(),
        rubriquesService.getAllRubriques(),
        agentRubriqueService.getAllAgentRubriques(),
      ]);

      setAgents(agentsData);
      setRubriques(rubriquesData);

      // Créer un Map des rubriques assignées par agent
      const assignedMap = new Map<string, string[]>();
      allRelations.forEach((relation) => {
        const agentId = relation.agent_id.toString();
        const rubriqueId = relation.rubrique_id.toString();
        if (!assignedMap.has(agentId)) {
          assignedMap.set(agentId, []);
        }
        assignedMap.get(agentId)?.push(rubriqueId);
      });
      setAssignedRubriques(assignedMap);
    } catch (err) {
      setError("Erreur lors du chargement des données");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAgentClick = (
    agentId: string,
    rubriqueId: string,
    agentName: string,
    rubriqueName: string
  ) => {
    setAgentToRemove({ agentId, rubriqueId, agentName, rubriqueName });
    setShowRemoveConfirmModal(true);
  };

  const confirmRemoveAgent = async () => {
    if (!agentToRemove) return;

    try {
      setIsRemoving(true);
      setError(null);

      // Vérifier si l'affectation existe avant de supprimer
      const isAlreadyAssigned = isRubriqueAssigned(
        agentToRemove.agentId,
        agentToRemove.rubriqueId
      );

      if (!isAlreadyAssigned) {
        // L'affectation n'existe pas, on ignore silencieusement
        setSuccessMessage(
          `L'affectation de "${agentToRemove.agentName}" à "${agentToRemove.rubriqueName}" n'existe pas`
        );
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
        setShowRemoveConfirmModal(false);
        setAgentToRemove(null);
        return;
      }

      await agentRubriqueService.removeAgentFromRubrique(
        agentToRemove.agentId,
        agentToRemove.rubriqueId
      );
      await loadData(); // Recharger les données

      setSuccessMessage(
        `Affectation de "${agentToRemove.agentName}" à "${agentToRemove.rubriqueName}" supprimée avec succès`
      );
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);

      setShowRemoveConfirmModal(false);
      setAgentToRemove(null);
    } catch (err) {
      // Si l'erreur indique que l'affectation n'existe pas, ignorer
      const error = err as Error;
      const errorMessage = error.message?.toLowerCase() || "";

      if (
        errorMessage.includes("n'existe pas") ||
        errorMessage.includes("not found") ||
        errorMessage.includes("404")
      ) {
        setSuccessMessage(
          `L'affectation de "${agentToRemove.agentName}" à "${agentToRemove.rubriqueName}" n'existe pas`
        );
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else {
        setError("Erreur lors de la suppression de l&apos;affectation");
        console.error(err);
      }
    } finally {
      setIsRemoving(false);
    }
  };

  const cancelRemoveAgent = () => {
    setShowRemoveConfirmModal(false);
    setAgentToRemove(null);
  };

  // Vérifier si une rubrique est déjà assignée à un agent
  const isRubriqueAssigned = (agentId: string, rubriqueId: string): boolean => {
    const agentRubriques = assignedRubriques.get(agentId) || [];
    return agentRubriques.includes(rubriqueId);
  };

  // Ouvrir la modale d'affectation pour un agent
  const handleOpenAssignModal = (agent: AgentWithRubrique) => {
    setSelectedAgentForAssign(agent);
    setSelectedRubriquesForAssign([]);
    setShowAssignModal(true);
  };

  // Toggle la sélection d'une rubrique pour l'affectation
  const toggleRubriqueForAssign = (rubriqueId: string) => {
    setSelectedRubriquesForAssign((prev) =>
      prev.includes(rubriqueId)
        ? prev.filter((id) => id !== rubriqueId)
        : [...prev, rubriqueId]
    );
  };

  // Assigner les rubriques sélectionnées à l'agent
  const handleAssignToSelectedAgent = async () => {
    if (!selectedAgentForAssign || selectedRubriquesForAssign.length === 0)
      return;

    try {
      setIsAssigning(true);
      setError(null);

      let successCount = 0;
      let skipCount = 0;
      const errorMessages: string[] = [];

      // Assigner chaque rubrique sélectionnée
      for (const rubriqueId of selectedRubriquesForAssign) {
        try {
          await agentRubriqueService.assignAgentToRubrique(
            selectedAgentForAssign.id,
            rubriqueId
          );
          successCount++;
        } catch (err) {
          const errorMessage =
            err instanceof Error ? err.message : "Erreur inconnue";
          // Si l'affectation existe déjà, on l'ignore
          if (errorMessage.includes("existe déjà")) {
            skipCount++;
          } else {
            errorMessages.push(errorMessage);
          }
        }
      }

      await loadData();

      // Afficher un message de résultat
      if (errorMessages.length > 0) {
        setError(
          `${successCount} rubrique(s) assignée(s), ${errorMessages.length} erreur(s)`
        );
      } else if (skipCount > 0) {
        // Message d'information si certaines étaient déjà assignées
        console.log(
          `${successCount} nouvelle(s) rubrique(s) assignée(s), ${skipCount} déjà assignée(s)`
        );
      }

      setShowAssignModal(false);
      setSelectedAgentForAssign(null);
      setSelectedRubriquesForAssign([]);
    } catch (err) {
      setError("Erreur lors de l'affectation");
      console.error(err);
    } finally {
      setIsAssigning(false);
    }
  };

  // Ouvrir la modale de détails
  const handleOpenDetailsModal = (agent: AgentWithRubrique) => {
    setSelectedAgentForDetails(agent);
    setShowDetailsModal(true);
  };

  // Ouvrir la modale de retrait multiple
  const handleOpenMultiRemoveModal = (agent: AgentWithRubrique) => {
    setSelectedAgentForRemove(agent);
    setRubriquesToRemove([]);
    setShowMultiRemoveModal(true);
  };

  // Gérer la sélection des rubriques à retirer
  const toggleRubriqueToRemove = (rubriqueId: string) => {
    setRubriquesToRemove((prev) =>
      prev.includes(rubriqueId)
        ? prev.filter((id) => id !== rubriqueId)
        : [...prev, rubriqueId]
    );
  };

  // Confirmer le retrait multiple
  const confirmMultiRemove = async () => {
    if (!selectedAgentForRemove || rubriquesToRemove.length === 0) return;

    try {
      setIsRemoving(true);
      setError(null);

      let successCount = 0;
      let skippedCount = 0;

      for (const rubriqueId of rubriquesToRemove) {
        try {
          // Vérifier si l'affectation existe avant de supprimer
          const isAlreadyAssigned = isRubriqueAssigned(
            selectedAgentForRemove.id,
            rubriqueId
          );

          if (!isAlreadyAssigned) {
            skippedCount++;
            continue; // Ignorer cette suppression
          }

          await agentRubriqueService.removeAgentFromRubrique(
            selectedAgentForRemove.id,
            rubriqueId
          );
          successCount++;
        } catch (err) {
          // Si l'erreur indique que l'affectation n'existe pas, ignorer
          const error = err as Error;
          const errorMessage = error.message?.toLowerCase() || "";

          if (
            errorMessage.includes("n'existe pas") ||
            errorMessage.includes("not found") ||
            errorMessage.includes("404")
          ) {
            skippedCount++;
            continue; // Ignorer cette suppression
          }
          // Pour les autres erreurs, on continue mais on les log
          console.warn(
            `Erreur lors de la suppression agent ${selectedAgentForRemove.id} de rubrique ${rubriqueId}:`,
            err
          );
          skippedCount++;
        }
      }

      await loadData();

      // Afficher un message de succès
      if (successCount > 0) {
        setError(null);
        if (skippedCount > 0) {
          setSuccessMessage(
            `${successCount} suppression(s) réussie(s), ${skippedCount} déjà inexistante(s) ignorée(s)`
          );
        } else {
          setSuccessMessage(`${successCount} suppression(s) réussie(s)`);
        }
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else if (skippedCount > 0) {
        setError(null);
        setSuccessMessage(
          `Toutes les affectations étaient déjà inexistantes (${skippedCount} ignorée(s))`
        );
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }

      setShowMultiRemoveModal(false);
      setSelectedAgentForRemove(null);
      setRubriquesToRemove([]);
    } catch (err) {
      setError("Erreur lors du retrait des rubriques");
      console.error(err);
    } finally {
      setIsRemoving(false);
    }
  };

  // Fonction pour tronquer le nom si trop long
  const truncateName = (name: string, maxLength: number = 25) => {
    if (name.length <= maxLength) return name;
    return name.substring(0, maxLength - 3) + "...";
  };

  // Fonction pour obtenir le nom complet tronqué
  const getTruncatedFullName = (
    prenom: string,
    nom: string,
    maxLength: number = 30
  ) => {
    const fullName = `${prenom} ${nom}`;
    if (fullName.length <= maxLength) return fullName;
    return truncateName(fullName, maxLength);
  };

  // Fonction pour surligner les correspondances dans le texte
  const highlightMatch = (text: string, query: string) => {
    if (!query.trim()) {
      return <span>{text}</span>;
    }

    // Échapper les caractères spéciaux de regex
    const escapedQuery = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const regex = new RegExp(`(${escapedQuery})`, "gi");
    const parts = text.split(regex);

    return (
      <span>
        {parts.map((part, index) => {
          // Vérifier si cette partie correspond à la requête (insensible à la casse)
          if (part.toLowerCase() === query.toLowerCase()) {
            return (
              <span
                key={index}
                className="bg-blue-500 text-white font-semibold px-0.5 rounded"
              >
                {part}
              </span>
            );
          }
          return <span key={index}>{part}</span>;
        })}
      </span>
    );
  };

  // Obtenir toutes les rubriques d'un agent
  const getAgentRubriques = (agentId: string) => {
    const rubriqueIds = assignedRubriques.get(agentId) || [];
    return rubriqueIds
      .map((rubriqueId) => {
        const rubrique = rubriques.find((r) => r.id === rubriqueId);
        return rubrique
          ? {
              id: rubrique.id,
              nom: rubrique.nom,
            }
          : null;
      })
      .filter((r) => r !== null) as { id: string; nom: string }[];
  };

  const handleBulkAssign = async () => {
    try {
      setIsAssigning(true);
      setError(null);

      let successCount = 0;
      let skippedCount = 0;

      // Affecter chaque agent sélectionné à chaque rubrique sélectionnée
      for (const agentId of selectedAgents) {
        for (const rubriqueId of selectedRubriques) {
          try {
            // Vérifier si l'affectation existe déjà avant d'appeler l'API
            const isAlreadyAssigned = isRubriqueAssigned(agentId, rubriqueId);

            if (isAlreadyAssigned) {
              skippedCount++;
              continue; // Ignorer cette affectation
            }

            await agentRubriqueService.assignAgentToRubrique(
              agentId,
              rubriqueId
            );
            successCount++;
          } catch (err) {
            // Si l'erreur indique que l'affectation existe déjà, ignorer
            const error = err as Error;
            const errorMessage = error.message?.toLowerCase() || "";

            if (
              errorMessage.includes("existe déjà") ||
              errorMessage.includes("déjà") ||
              errorMessage.includes("already exists") ||
              errorMessage.includes("409")
            ) {
              skippedCount++;
              continue; // Ignorer cette affectation silencieusement
            }
            // Pour les autres erreurs, on continue mais on les log
            console.warn(
              `Erreur lors de l'affectation agent ${agentId} à rubrique ${rubriqueId}:`,
              err
            );
            skippedCount++;
          }
        }
      }

      await loadData(); // Recharger les données

      // Afficher un message de succès
      if (successCount > 0) {
        setError(null);
        if (skippedCount > 0) {
          setSuccessMessage(
            `${successCount} affectation(s) réussie(s), ${skippedCount} déjà existante(s) ignorée(s)`
          );
        } else {
          setSuccessMessage(`${successCount} affectation(s) réussie(s)`);
        }
        // Effacer le message après 3 secondes
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      } else if (skippedCount > 0) {
        setError(null);
        setSuccessMessage(
          `Toutes les affectations existaient déjà (${skippedCount} ignorée(s))`
        );
        setTimeout(() => {
          setSuccessMessage(null);
        }, 3000);
      }

      setShowBulkAssignModal(false);
      setSelectedAgents([]);
      setSelectedRubriques([]);
      setBulkAssignSearchQuery("");
      setShowAllAgentsInBulk(false);
    } catch (err) {
      setError("Erreur lors de l&apos;affectation en masse");
      console.error(err);
    } finally {
      setIsAssigning(false);
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

  const filteredAgents = agents.filter((agent) => {
    const searchLower = searchQuery.toLowerCase();
    const matchesSearch =
      agent.nom.toLowerCase().includes(searchLower) ||
      agent.prenom.toLowerCase().includes(searchLower) ||
      agent.matricule.toLowerCase().includes(searchLower) ||
      agent.fonction.toLowerCase().includes(searchLower);

    // Utiliser getAgentRubriques pour gérer les affectations multiples
    const agentRubriques = getAgentRubriques(agent.id);
    const isAssigned = agentRubriques.length > 0;

    // Filtre par mode de vue
    if (viewMode === "assigned" && !isAssigned) return false;
    if (viewMode === "unassigned" && isAssigned) return false;

    // Filtre par rubrique spécifique
    if (selectedRubrique === "all") return matchesSearch;
    if (selectedRubrique === "unassigned") {
      return matchesSearch && !isAssigned;
    }

    // Vérifier si l'agent est affecté à la rubrique sélectionnée
    const isAssignedToSelectedRubrique = agentRubriques.some(
      (rub) => rub.id === selectedRubrique
    );
    return matchesSearch && isAssignedToSelectedRubrique;
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
                            agents.filter(
                              (agent) => getAgentRubriques(agent.id).length > 0
                            ).length
                          }{" "}
                          agents affectés
                        </span>
                      </div>
                      <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                        <span className="text-white text-sm font-medium">
                          {
                            agents.filter(
                              (agent) =>
                                getAgentRubriques(agent.id).length === 0
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
                      <span>Affectation</span>
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
              <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded-lg border border-red-200 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}
            {successMessage && (
              <div className="text-green-700 text-sm bg-green-50 px-3 py-2 rounded-lg border border-green-200 flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {successMessage}
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
                  const agentRubriques = getAgentRubriques(agent.id);
                  const isAssigned = agentRubriques.length > 0;

                  return (
                    <div
                      key={agent.id}
                      className="p-4 bg-accent-green-light/10 hover:bg-accent-green-light/20 transition-all duration-200 border-l-2 border-accent-green"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 bg-accent-green rounded-lg flex items-center justify-center shadow-sm">
                              <span className="text-xs font-bold text-white">
                                {agent.prenom.charAt(0).toUpperCase()}
                                {agent.nom.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-green rounded-full flex items-center justify-center shadow-sm">
                              <CheckCircle className="w-2.5 h-2.5 text-white" />
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4
                              className="text-base font-semibold text-gray-900 truncate"
                              title={`${agent.prenom} ${agent.nom}`}
                            >
                              {highlightMatch(
                                getTruncatedFullName(
                                  agent.prenom,
                                  agent.nom,
                                  28
                                ),
                                searchQuery
                              )}
                            </h4>
                            <p className="text-xs text-gray-600 font-medium mt-0.5">
                              {highlightMatch(agent.matricule, searchQuery)} •{" "}
                              {highlightMatch(
                                agent.fonction.length > 20
                                  ? truncateName(agent.fonction, 20)
                                  : agent.fonction,
                                searchQuery
                              )}
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

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {isAssigned ? (
                            <>
                              {/* Agent avec rubrique(s) affectée(s) */}
                              <div className="flex items-center gap-2 flex-wrap">
                                <span
                                  className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-accent-green/10 text-accent-green border border-accent-green/30"
                                  title="Cet agent est actuellement affecté à une ou plusieurs rubriques"
                                >
                                  <CheckCircle className="w-3 h-3 mr-1" />
                                  {agentRubriques.length}
                                </span>
                                <div className="flex flex-wrap gap-1.5">
                                  {agentRubriques.slice(0, 2).map((rub) => (
                                    <span
                                      key={rub.id}
                                      className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md border border-gray-200"
                                      title={rub.nom}
                                    >
                                      {truncateName(rub.nom, 15)}
                                    </span>
                                  ))}
                                  {agentRubriques.length > 2 && (
                                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                                      +{agentRubriques.length - 2}
                                    </span>
                                  )}
                                </div>
                              </div>

                              {/* Boutons d'action */}
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={() => handleOpenAssignModal(agent)}
                                  className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                                  title="Assigner une nouvelle rubrique"
                                >
                                  <Plus className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => handleOpenDetailsModal(agent)}
                                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                                  title="Voir les détails"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    const agentRubriques = getAgentRubriques(
                                      agent.id
                                    );
                                    if (agentRubriques.length === 1) {
                                      // Retrait direct avec confirmation
                                      handleRemoveAgentClick(
                                        agent.id,
                                        agentRubriques[0].id,
                                        `${agent.prenom} ${agent.nom}`,
                                        agentRubriques[0].nom
                                      );
                                    } else {
                                      // Modale de retrait multiple
                                      handleOpenMultiRemoveModal(agent);
                                    }
                                  }}
                                  className="p-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                                  title="Retirer de la/des rubrique(s)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          ) : (
                            <>
                              {/* Agent sans rubrique affectée */}
                              <span
                                className="inline-flex items-center px-4 py-2 rounded-full text-sm font-bold bg-warning-600 text-white shadow-md"
                                title="Cet agent n'est pas encore affecté"
                              >
                                <AlertCircle className="w-4 h-4 mr-2" />
                                Non affecté
                              </span>

                              <button
                                onClick={() => handleOpenAssignModal(agent)}
                                className="px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all duration-200 shadow-md hover:shadow-lg flex items-center space-x-2"
                                title="Assigner à une rubrique"
                              >
                                <Plus className="w-4 h-4" />
                                <span>Assigner</span>
                              </button>
                            </>
                          )}
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
                Cliquez sur le bouton &quot;Assigner&quot; pour affecter un
                agent à une rubrique
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
                      className="p-4 bg-warning-50/30 hover:bg-warning-100/50 transition-all duration-200 border-l-2 border-warning-500"
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div className="w-10 h-10 bg-warning-600 rounded-lg flex items-center justify-center shadow-sm">
                              <span className="text-xs font-bold text-white">
                                {agent.prenom.charAt(0).toUpperCase()}
                                {agent.nom.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4
                              className="text-base font-semibold text-gray-900 truncate"
                              title={`${agent.prenom} ${agent.nom}`}
                            >
                              {highlightMatch(
                                getTruncatedFullName(
                                  agent.prenom,
                                  agent.nom,
                                  28
                                ),
                                searchQuery
                              )}
                            </h4>
                            <p className="text-xs text-gray-600 font-medium mt-0.5">
                              {highlightMatch(agent.matricule, searchQuery)} •{" "}
                              {highlightMatch(
                                agent.fonction.length > 20
                                  ? truncateName(agent.fonction, 20)
                                  : agent.fonction,
                                searchQuery
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Statut d'affectation */}
                          <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-warning-100 text-warning-700 border border-warning-300">
                            <AlertCircle className="w-3 h-3 mr-1" />
                            Non affecté
                          </span>

                          {/* Bouton d'affectation */}
                          <button
                            onClick={() => handleOpenAssignModal(agent)}
                            className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                            title="Assigner à une rubrique"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
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
                  const agentRubriques = getAgentRubriques(agent.id);
                  const isAssigned = agentRubriques.length > 0;

                  return (
                    <div
                      key={agent.id}
                      className={`p-4 transition-all duration-200 border-l-2 ${
                        isAssigned
                          ? "bg-accent-green-light/10 hover:bg-accent-green-light/20 border-accent-green"
                          : "bg-warning-50/20 hover:bg-warning-100/40 border-warning-500"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="relative flex-shrink-0">
                            <div
                              className={`w-10 h-10 rounded-lg flex items-center justify-center shadow-sm ${
                                isAssigned
                                  ? "bg-accent-green"
                                  : "bg-warning-600"
                              }`}
                            >
                              <span className="text-xs font-bold text-white">
                                {agent.prenom.charAt(0).toUpperCase()}
                                {agent.nom.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            {isAssigned && (
                              <div className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-accent-green rounded-full flex items-center justify-center shadow-sm">
                                <CheckCircle className="w-2.5 h-2.5 text-white" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <h4
                              className="text-base font-semibold text-gray-900 truncate"
                              title={`${agent.prenom} ${agent.nom}`}
                            >
                              {highlightMatch(
                                getTruncatedFullName(
                                  agent.prenom,
                                  agent.nom,
                                  28
                                ),
                                searchQuery
                              )}
                            </h4>
                            <p className="text-xs text-gray-600 font-medium mt-0.5">
                              {highlightMatch(agent.matricule, searchQuery)} •{" "}
                              {highlightMatch(
                                agent.fonction.length > 20
                                  ? truncateName(agent.fonction, 20)
                                  : agent.fonction,
                                searchQuery
                              )}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          {/* Statut d'affectation */}
                          {isAssigned ? (
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-accent-green/10 text-accent-green border border-accent-green/30">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                {agentRubriques.length}
                              </span>
                              <div className="flex flex-wrap gap-1.5">
                                {agentRubriques.slice(0, 2).map((rub) => (
                                  <span
                                    key={rub.id}
                                    className="text-xs font-medium text-gray-700 bg-gray-100 px-2 py-1 rounded-md border border-gray-200"
                                    title={rub.nom}
                                  >
                                    {truncateName(rub.nom, 15)}
                                  </span>
                                ))}
                                {agentRubriques.length > 2 && (
                                  <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-md border border-gray-200">
                                    +{agentRubriques.length - 2}
                                  </span>
                                )}
                              </div>
                            </div>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold bg-warning-100 text-warning-700 border border-warning-300">
                              <AlertCircle className="w-3 h-3 mr-1" />
                              Non affecté
                            </span>
                          )}

                          {/* Actions d'affectation */}
                          <div className="flex items-center gap-1.5">
                            <button
                              onClick={() => handleOpenAssignModal(agent)}
                              className="p-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                              title="Assigner une nouvelle rubrique"
                            >
                              <Plus className="w-4 h-4" />
                            </button>

                            {isAssigned && (
                              <>
                                <button
                                  onClick={() => handleOpenDetailsModal(agent)}
                                  className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md"
                                  title="Voir les détails"
                                >
                                  <UserCheck className="w-4 h-4" />
                                </button>

                                <button
                                  onClick={() => {
                                    if (agentRubriques.length === 1) {
                                      // Retrait direct avec confirmation
                                      handleRemoveAgentClick(
                                        agent.id,
                                        agentRubriques[0].id,
                                        `${agent.prenom} ${agent.nom}`,
                                        agentRubriques[0].nom
                                      );
                                    } else {
                                      // Modale de retrait multiple
                                      handleOpenMultiRemoveModal(agent);
                                    }
                                  }}
                                  className="p-2 bg-red-600 hover:bg-red-700 active:bg-red-800 text-white rounded-md transition-all duration-200 shadow-sm hover:shadow-md active:scale-95"
                                  title="Retirer de la/des rubrique(s)"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
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

        {/* Modal d'affectation en masse */}
        {showBulkAssignModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden relative">
              <div className="p-6 border-b border-gray-200 bg-primary-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-primary-600 rounded-xl flex items-center justify-center">
                      <UserCheck className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">
                        Affectation
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
                      setBulkAssignSearchQuery("");
                      setShowAllAgentsInBulk(false);
                    }}
                    className="p-2 rounded-lg hover:bg-white/50 transition-colors"
                  >
                    <X className="w-5 h-5 text-gray-600" />
                  </button>
                </div>
              </div>

              {isAssigning && (
                <div className="absolute inset-0 bg-white/80 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-primary-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Affectation en cours...
                    </h3>
                    <p className="text-sm text-gray-600">
                      Veuillez patienter pendant que nous affectons les agents
                      aux rubriques.
                    </p>
                  </div>
                </div>
              )}

              <div
                className="p-6 overflow-y-auto relative"
                style={{ maxHeight: "calc(90vh - 200px)" }}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  {/* Sélection des agents */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h4 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                        <Users className="w-5 h-5 text-primary-600" />
                        Agents ({selectedAgents.length} sélectionnés)
                      </h4>
                      <div className="flex items-center gap-2">
                        <label className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer">
                          <input
                            type="checkbox"
                            checked={showAllAgentsInBulk}
                            onChange={(e) =>
                              setShowAllAgentsInBulk(e.target.checked)
                            }
                            className="w-4 h-4 text-primary-600 rounded focus:ring-primary-500"
                          />
                          <span>Afficher tous les agents</span>
                        </label>
                        <button
                          onClick={() => {
                            const availableAgents = agents.filter((agent) => {
                              const agentRubriques = getAgentRubriques(
                                agent.id
                              );
                              const searchLower =
                                bulkAssignSearchQuery.toLowerCase();
                              const matchesSearch =
                                agent.nom.toLowerCase().includes(searchLower) ||
                                agent.prenom
                                  .toLowerCase()
                                  .includes(searchLower) ||
                                agent.matricule
                                  .toLowerCase()
                                  .includes(searchLower) ||
                                agent.fonction
                                  .toLowerCase()
                                  .includes(searchLower);

                              if (!matchesSearch) return false;

                              if (showAllAgentsInBulk) return true;
                              return agentRubriques.length === 0;
                            });

                            const allSelected = availableAgents.every((agent) =>
                              selectedAgents.includes(agent.id)
                            );

                            if (allSelected) {
                              // Désélectionner tous les agents disponibles
                              setSelectedAgents((prev) =>
                                prev.filter(
                                  (id) =>
                                    !availableAgents.some((a) => a.id === id)
                                )
                              );
                            } else {
                              // Sélectionner tous les agents disponibles
                              const newSelected = [
                                ...selectedAgents,
                                ...availableAgents
                                  .filter(
                                    (agent) =>
                                      !selectedAgents.includes(agent.id)
                                  )
                                  .map((agent) => agent.id),
                              ];
                              setSelectedAgents(newSelected);
                            }
                          }}
                          className="px-4 py-2 text-sm font-semibold bg-primary-600 text-white rounded-lg hover:bg-primary-700 active:bg-primary-800 transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 flex items-center gap-2"
                        >
                          {(() => {
                            const availableAgents = agents.filter((agent) => {
                              const agentRubriques = getAgentRubriques(
                                agent.id
                              );
                              const searchLower =
                                bulkAssignSearchQuery.toLowerCase();
                              const matchesSearch =
                                agent.nom.toLowerCase().includes(searchLower) ||
                                agent.prenom
                                  .toLowerCase()
                                  .includes(searchLower) ||
                                agent.matricule
                                  .toLowerCase()
                                  .includes(searchLower) ||
                                agent.fonction
                                  .toLowerCase()
                                  .includes(searchLower);

                              if (!matchesSearch) return false;

                              if (showAllAgentsInBulk) return true;
                              return agentRubriques.length === 0;
                            });

                            const allSelected =
                              availableAgents.length > 0 &&
                              availableAgents.every((agent) =>
                                selectedAgents.includes(agent.id)
                              );

                            return allSelected
                              ? "Tout désélectionner"
                              : "Tout sélectionner";
                          })()}
                        </button>
                      </div>
                    </div>

                    {/* Barre de recherche */}
                    <div className="mb-3">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <input
                          type="text"
                          placeholder="Rechercher un agent..."
                          value={bulkAssignSearchQuery}
                          onChange={(e) =>
                            setBulkAssignSearchQuery(e.target.value)
                          }
                          className="w-full pl-10 pr-4 py-2 text-black border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2 max-h-80 overflow-y-auto border border-gray-200 rounded-lg p-3 bg-gray-50">
                      {agents
                        .filter((agent) => {
                          const agentRubriques = getAgentRubriques(agent.id);
                          const searchLower =
                            bulkAssignSearchQuery.toLowerCase();
                          const matchesSearch =
                            agent.nom.toLowerCase().includes(searchLower) ||
                            agent.prenom.toLowerCase().includes(searchLower) ||
                            agent.matricule
                              .toLowerCase()
                              .includes(searchLower) ||
                            agent.fonction.toLowerCase().includes(searchLower);

                          if (!matchesSearch) return false;

                          if (showAllAgentsInBulk) return true;
                          return agentRubriques.length === 0;
                        })
                        .map((agent) => {
                          const agentRubriques = getAgentRubriques(agent.id);
                          const isAssigned = agentRubriques.length > 0;
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
                                      {highlightMatch(
                                        getTruncatedFullName(
                                          agent.prenom,
                                          agent.nom,
                                          30
                                        ),
                                        bulkAssignSearchQuery
                                      )}
                                    </span>
                                    {isAssigned && (
                                      <span className="px-2 py-0.5 text-xs font-medium bg-accent-green/10 text-accent-green rounded-md border border-accent-green/30">
                                        Affecté
                                      </span>
                                    )}
                                  </div>
                                  <p className="text-sm text-gray-600">
                                    {highlightMatch(
                                      agent.matricule,
                                      bulkAssignSearchQuery
                                    )}{" "}
                                    •{" "}
                                    {highlightMatch(
                                      agent.fonction.length > 25
                                        ? truncateName(agent.fonction, 25)
                                        : agent.fonction,
                                      bulkAssignSearchQuery
                                    )}
                                  </p>
                                  {isAssigned && agentRubriques.length > 0 && (
                                    <p className="text-xs text-gray-500 mt-1">
                                      Rubriques:{" "}
                                      {agentRubriques
                                        .map((r) => r.nom)
                                        .join(", ")}
                                    </p>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      {agents.filter((agent) => {
                        const agentRubriques = getAgentRubriques(agent.id);
                        const searchLower = bulkAssignSearchQuery.toLowerCase();
                        const matchesSearch =
                          agent.nom.toLowerCase().includes(searchLower) ||
                          agent.prenom.toLowerCase().includes(searchLower) ||
                          agent.matricule.toLowerCase().includes(searchLower) ||
                          agent.fonction.toLowerCase().includes(searchLower);

                        if (!matchesSearch) return false;

                        if (showAllAgentsInBulk) return true;
                        return agentRubriques.length === 0;
                      }).length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Users className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                          <p className="text-sm">
                            {bulkAssignSearchQuery
                              ? "Aucun agent ne correspond à votre recherche"
                              : showAllAgentsInBulk
                              ? "Aucun agent disponible"
                              : "Tous les agents sont déjà affectés"}
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

              <div className="p-6 border-t border-gray-200 bg-gray-50 flex-shrink-0">
                <div className="flex justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowBulkAssignModal(false);
                      setSelectedAgents([]);
                      setSelectedRubriques([]);
                      setBulkAssignSearchQuery("");
                      setShowAllAgentsInBulk(false);
                    }}
                    disabled={isAssigning}
                    className="px-6 py-2.5 border-2 border-gray-300 rounded-lg text-gray-700 font-semibold hover:bg-gray-50 hover:border-gray-400 active:bg-gray-100 transition-all duration-200 shadow-sm hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Annuler
                  </button>
                  <button
                    onClick={handleBulkAssign}
                    disabled={
                      selectedAgents.length === 0 ||
                      selectedRubriques.length === 0 ||
                      isAssigning
                    }
                    className="px-6 py-2.5 bg-primary-600 hover:bg-primary-700 active:bg-primary-800 text-white rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary-600 disabled:hover:shadow-md disabled:active:scale-100 flex items-center gap-2"
                  >
                    {isAssigning ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Affectation en cours...</span>
                      </>
                    ) : (
                      <>
                        Affecter (
                        {selectedAgents.length * selectedRubriques.length})
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Modale de confirmation de retrait */}
        {showRemoveConfirmModal && agentToRemove && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={cancelRemoveAgent}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border-2 border-gray-200 animate-in fade-in zoom-in duration-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {isRemoving && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Suppression en cours...
                    </h3>
                    <p className="text-sm text-gray-600">
                      Veuillez patienter pendant que nous retirons
                      l&apos;affectation.
                    </p>
                  </div>
                </div>
              )}
              {/* Header avec icône d'alerte */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 border-b-2 border-red-200">
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <div className="w-14 h-14 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                      <AlertCircle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900">
                      Confirmer le retrait
                    </h3>
                    <p className="text-sm text-red-700 font-semibold mt-1">
                      Cette action nécessite une confirmation
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-6 space-y-4">
                <p className="text-gray-700 text-base leading-relaxed">
                  Êtes-vous sûr de vouloir retirer{" "}
                  <span className="font-bold text-gray-900 bg-blue-100 px-2 py-1 rounded">
                    {agentToRemove.agentName}
                  </span>{" "}
                  de la rubrique{" "}
                  <span className="font-bold text-gray-900 bg-purple-100 px-2 py-1 rounded">
                    {agentToRemove.rubriqueName}
                  </span>{" "}
                  ?
                </p>

                <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-bold text-red-900 mb-1">
                        Conséquences du retrait :
                      </p>
                      <ul className="text-sm text-red-800 space-y-1 list-disc list-inside">
                        <li>
                          L&apos;agent ne pourra plus gérer les dossiers de
                          cette rubrique
                        </li>
                        <li>
                          Les accès aux documents associés seront révoqués
                        </li>
                        <li>Cette action peut être inversée ultérieurement</li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>

              {/* Footer avec boutons */}
              <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={cancelRemoveAgent}
                  disabled={isRemoving}
                  className="px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200 transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmRemoveAgent}
                  disabled={isRemoving}
                  className="px-5 py-2.5 bg-gradient-to-r from-red-500 to-red-600 text-white font-bold rounded-xl hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 transition-all duration-200 shadow-lg hover:shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:from-red-500 disabled:hover:to-red-600 disabled:hover:shadow-lg flex items-center space-x-2"
                >
                  {isRemoving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Suppression...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      <span>Confirmer le retrait</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modale d'affectation d'une rubrique */}
        {showAssignModal && selectedAgentForAssign && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => {
              setShowAssignModal(false);
              setSelectedAgentForAssign(null);
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border-2 border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-primary-600 to-primary-700 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-white rounded-xl flex items-center justify-center">
                    <Plus className="w-8 h-8 text-primary-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-primary-600">
                      Assigner des rubriques
                    </h3>
                    <p className="text-primary-500 font-semibold">
                      Pour {selectedAgentForAssign.prenom}{" "}
                      {selectedAgentForAssign.nom}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-6">
                <p className="text-gray-700 mb-2 font-medium">
                  Sélectionnez une ou plusieurs rubriques à assigner à cet agent
                  :
                </p>

                {/* Info sur les rubriques déjà assignées */}
                {getAgentRubriques(selectedAgentForAssign.id).length > 0 && (
                  <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded-lg">
                    <div className="flex items-start gap-2">
                      <CheckCircle className="w-4 h-4 text-blue-600 mt-0.5 flex-shrink-0" />
                      <div className="text-xs text-blue-800">
                        <p className="font-bold mb-1">
                          {getAgentRubriques(selectedAgentForAssign.id).length}{" "}
                          rubrique(s) déjà assignée(s) (grisée
                          {getAgentRubriques(selectedAgentForAssign.id).length >
                          1
                            ? "s"
                            : ""}
                          )
                        </p>
                        <p>
                          Les rubriques déjà assignées sont désactivées pour
                          éviter les doublons.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {rubriques.map((rubrique) => {
                    const isAlreadyAssigned = isRubriqueAssigned(
                      selectedAgentForAssign.id,
                      rubrique.id
                    );
                    const isSelected = selectedRubriquesForAssign.includes(
                      rubrique.id
                    );

                    return (
                      <label
                        key={rubrique.id}
                        className={`flex items-center p-4 rounded-xl border-2 transition-all duration-200 ${
                          isAlreadyAssigned
                            ? "bg-gray-200 border-gray-300 cursor-not-allowed opacity-60"
                            : isSelected
                            ? "bg-gradient-to-r from-primary-100 to-primary-200 border-primary-500 shadow-md cursor-pointer"
                            : "bg-gray-50 hover:bg-gray-100 border-gray-200 hover:border-gray-300 cursor-pointer"
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          disabled={isAlreadyAssigned}
                          onChange={() => toggleRubriqueForAssign(rubrique.id)}
                          className="w-5 h-5 text-primary-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-primary-500 disabled:cursor-not-allowed"
                        />
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <h4
                                className={`font-bold text-lg ${
                                  isAlreadyAssigned
                                    ? "text-gray-500"
                                    : "text-gray-900"
                                }`}
                              >
                                {rubrique.nom}
                              </h4>
                              <p
                                className={`text-sm mt-1 ${
                                  isAlreadyAssigned
                                    ? "text-gray-400"
                                    : "text-gray-600"
                                }`}
                              >
                                {rubrique.description}
                              </p>
                            </div>
                            {isAlreadyAssigned ? (
                              <span className="ml-3 px-3 py-1 bg-gray-400 text-white text-xs font-bold rounded-full">
                                Déjà assigné
                              </span>
                            ) : (
                              isSelected && (
                                <span className="ml-3 px-3 py-1 bg-primary-600 text-white text-xs font-bold rounded-full">
                                  Sélectionné
                                </span>
                              )
                            )}
                          </div>
                        </div>
                      </label>
                    );
                  })}
                </div>

                {selectedRubriquesForAssign.length > 0 && (
                  <div className="mt-4 p-4 bg-primary-50 border-l-4 border-primary-500 rounded-lg">
                    <p className="text-sm font-bold text-primary-900">
                      {selectedRubriquesForAssign.length} rubrique
                      {selectedRubriquesForAssign.length > 1 ? "s" : ""}{" "}
                      sélectionnée
                      {selectedRubriquesForAssign.length > 1 ? "s" : ""}
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowAssignModal(false);
                    setSelectedAgentForAssign(null);
                    setSelectedRubriquesForAssign([]);
                  }}
                  className="px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-100 hover:border-gray-400 transition-all duration-200"
                >
                  Annuler
                </button>
                <button
                  onClick={handleAssignToSelectedAgent}
                  disabled={
                    selectedRubriquesForAssign.length === 0 || isAssigning
                  }
                  className={`px-5 py-2.5 border-2 border-primary-600 rounded-xl font-bold transition-all duration-200 flex items-center space-x-2 ${
                    selectedRubriquesForAssign.length > 0 && !isAssigning
                      ? "bg-gradient-to-r from-primary-600 to-primary-700 text-white hover:from-primary-700 hover:to-primary-800 shadow-lg hover:shadow-xl"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  }`}
                >
                  {isAssigning ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span className="font-bold text-primary-600">
                        Affectation en cours...
                      </span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      <span className="font-bold text-primary-600">
                        Assigner ({selectedRubriquesForAssign.length})
                      </span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modale de détails de l'agent */}
        {showDetailsModal && selectedAgentForDetails && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => {
              setShowDetailsModal(false);
              setSelectedAgentForDetails(null);
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full overflow-hidden border-2 border-gray-200"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-blue-700 p-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">
                      {selectedAgentForDetails.prenom.charAt(0)}
                      {selectedAgentForDetails.nom.charAt(0)}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white">
                      {selectedAgentForDetails.prenom}{" "}
                      {selectedAgentForDetails.nom}
                    </h3>
                    <p className="text-blue-100 font-semibold">
                      {selectedAgentForDetails.matricule} •{" "}
                      {selectedAgentForDetails.fonction}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-6 space-y-6">
                {/* Informations générales */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Users className="w-5 h-5 text-primary-600" />
                    Informations générales
                  </h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-xs font-bold text-gray-600 uppercase mb-1">
                        Matricule
                      </p>
                      <p className="font-bold text-gray-900">
                        {selectedAgentForDetails.matricule}
                      </p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                      <p className="text-xs font-bold text-gray-600 uppercase mb-1">
                        Fonction
                      </p>
                      <p className="font-bold text-gray-900">
                        {selectedAgentForDetails.fonction}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Rubriques affectées */}
                <div>
                  <h4 className="text-lg font-bold text-gray-900 mb-3 flex items-center gap-2">
                    <Building2 className="w-5 h-5 text-primary-600" />
                    Rubriques affectées
                  </h4>
                  <div className="space-y-2">
                    {getAgentRubriques(selectedAgentForDetails.id).length >
                    0 ? (
                      getAgentRubriques(selectedAgentForDetails.id).map(
                        (rubrique) => (
                          <div
                            key={rubrique.id}
                            className="p-4 bg-gradient-to-r from-accent-green-light/30 to-accent-green-light/50 rounded-xl border-2 border-green-500"
                          >
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-3">
                                <CheckCircle className="w-5 h-5 text-accent-green" />
                                <span className="font-bold text-gray-900">
                                  {rubrique.nom}
                                </span>
                              </div>
                              <span className="px-3 py-1 bg-accent-green text-white text-xs font-bold rounded-full">
                                Actif
                              </span>
                            </div>
                          </div>
                        )
                      )
                    ) : (
                      <div className="p-4 bg-warning-50 rounded-xl border-2 border-warning-200">
                        <p className="text-warning-700 font-semibold flex items-center gap-2">
                          <AlertCircle className="w-5 h-5" />
                          Aucune rubrique affectée
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-200 flex justify-end">
                <button
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedAgentForDetails(null);
                  }}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-bold rounded-xl transition-all duration-200"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modale de retrait multiple de rubriques */}
        {showMultiRemoveModal && selectedAgentForRemove && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 backdrop-blur-sm"
            onClick={() => {
              setShowMultiRemoveModal(false);
              setSelectedAgentForRemove(null);
              setRubriquesToRemove([]);
            }}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border-2 border-gray-200 relative"
              onClick={(e) => e.stopPropagation()}
            >
              {isRemoving && (
                <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-10 flex items-center justify-center rounded-2xl">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                      <Loader2 className="w-8 h-8 text-white animate-spin" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">
                      Suppression en cours...
                    </h3>
                    <p className="text-sm text-gray-600">
                      Veuillez patienter pendant que nous retirons les
                      affectations.
                    </p>
                  </div>
                </div>
              )}
              {/* Header */}
              <div className="bg-gradient-to-r from-red-50 to-orange-50 p-6 border-b-2 border-red-200">
                <div className="flex items-center space-x-4">
                  <div className="w-14 h-14 bg-red-500 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-8 h-8 text-white" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      Retirer des rubriques
                    </h3>
                    <p className="text-red-700 font-semibold">
                      Pour {selectedAgentForRemove.prenom}{" "}
                      {selectedAgentForRemove.nom}
                    </p>
                  </div>
                </div>
              </div>

              {/* Contenu */}
              <div className="p-6">
                <p className="text-gray-700 mb-4 font-medium">
                  Sélectionnez les rubriques à retirer :
                </p>
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {getAgentRubriques(selectedAgentForRemove.id).map(
                    (rubrique) => (
                      <label
                        key={rubrique.id}
                        className="flex items-center p-4 bg-gray-50 hover:bg-gray-100 rounded-xl border-2 border-gray-200 cursor-pointer transition-all duration-200"
                      >
                        <input
                          type="checkbox"
                          checked={rubriquesToRemove.includes(rubrique.id)}
                          onChange={() => toggleRubriqueToRemove(rubrique.id)}
                          className="w-5 h-5 text-red-600 border-2 border-gray-300 rounded focus:ring-2 focus:ring-red-500"
                        />
                        <div className="ml-4 flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-bold text-gray-900">
                              {rubrique.nom}
                            </span>
                            {rubriquesToRemove.includes(rubrique.id) && (
                              <span className="px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full">
                                À retirer
                              </span>
                            )}
                          </div>
                        </div>
                      </label>
                    )
                  )}
                </div>

                {rubriquesToRemove.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg">
                    <p className="text-sm font-bold text-red-900">
                      {rubriquesToRemove.length} rubrique
                      {rubriquesToRemove.length > 1 ? "s" : ""} sélectionnée
                      {rubriquesToRemove.length > 1 ? "s" : ""} pour le retrait
                    </p>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="bg-gray-50 px-6 py-4 border-t-2 border-gray-200 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setShowMultiRemoveModal(false);
                    setSelectedAgentForRemove(null);
                    setRubriquesToRemove([]);
                  }}
                  disabled={isRemoving}
                  className="px-5 py-2.5 border-2 border-gray-300 rounded-xl text-gray-700 font-bold hover:bg-gray-100 hover:border-gray-400 active:bg-gray-200 transition-all duration-200 hover:shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Annuler
                </button>
                <button
                  onClick={confirmMultiRemove}
                  disabled={rubriquesToRemove.length === 0 || isRemoving}
                  className={`px-5 py-2.5 rounded-xl font-bold transition-all duration-200 flex items-center space-x-2 ${
                    rubriquesToRemove.length > 0 && !isRemoving
                      ? "bg-gradient-to-r from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700 active:from-red-700 active:to-red-800 shadow-lg hover:shadow-xl active:scale-95 disabled:hover:from-red-500 disabled:hover:to-red-600 disabled:hover:shadow-lg"
                      : "bg-gray-300 text-gray-500 cursor-not-allowed"
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {isRemoving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Suppression...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-5 h-5" />
                      <span>Retirer ({rubriquesToRemove.length})</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </DashboardLayout>
    </AuthGuard>
  );
}
