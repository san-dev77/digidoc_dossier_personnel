"use client";

import { useState } from "react";
import Navigation from "@/components/Navigation";
import {
  Plus,
  Search,
  Filter,
  MoreVertical,
  Edit,
  Trash2,
  Eye,
} from "lucide-react";
import { useAppStore } from "@/store";
import { Agent } from "@/types";

export default function AgentsPage() {
  const { agents, isLoading, searchAgents } = useAppStore();
  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);

  const filteredAgents = searchAgents(searchQuery);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  const handleViewAgent = (agent: Agent) => {
    setSelectedAgent(agent);
  };

  const handleEditAgent = (agent: Agent) => {
    // TODO: Implémenter l'édition
    console.log("Éditer agent:", agent);
  };

  const handleDeleteAgent = (agent: Agent) => {
    // TODO: Implémenter la suppression
    console.log("Supprimer agent:", agent);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation
        currentStep="Gestion des Agents"
        currentStepDescription="Consultez et gérez les informations de vos collaborateurs"
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header de la page */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Agents</h1>
            <p className="text-gray-600 mt-1">
              {filteredAgents.length} agent
              {filteredAgents.length !== 1 ? "s" : ""} trouvé
              {filteredAgents.length !== 1 ? "s" : ""}
            </p>
          </div>
          <button className="btn btn-primary mt-4 sm:mt-0">
            <Plus className="w-4 h-4 mr-2" />
            Nouvel Agent
          </button>
        </div>

        {/* Barre de recherche et filtres */}
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 p-6 mb-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Rechercher par nom, prénom, matricule ou fonction..."
                  value={searchQuery}
                  onChange={handleSearch}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="btn btn-outline"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtres
            </button>
          </div>

          {/* Filtres avancés */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <select className="select select-bordered w-full">
                  <option value="">Toutes les fonctions</option>
                  <option value="manager">Manager</option>
                  <option value="developpeur">Développeur</option>
                  <option value="analyste">Analyste</option>
                  <option value="designer">Designer</option>
                </select>
                <select className="select select-bordered w-full">
                  <option value="">Tous les sexes</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                </select>
                <select className="select select-bordered w-full">
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
        <div className="bg-white rounded-lg shadow-sm border border-blue-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Agent
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Matricule
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fonction
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredAgents.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-12 text-center text-gray-500"
                    >
                      {searchQuery
                        ? "Aucun agent trouvé pour cette recherche"
                        : "Aucun agent enregistré"}
                    </td>
                  </tr>
                ) : (
                  filteredAgents.map((agent) => (
                    <tr key={agent.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-blue-600">
                              {agent.prenom.charAt(0)}
                              {agent.nom.charAt(0)}
                            </span>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {agent.prenom} {agent.nom}
                            </div>
                            <div className="text-sm text-gray-500">
                              {agent.dateNaissance} • {agent.lieuNaissance}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          {agent.matricule}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {agent.fonction}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{agent.telephone}</div>
                        <div className="text-xs text-gray-400">
                          {agent.adresse}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Actif
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="dropdown dropdown-end">
                          <button className="btn btn-ghost btn-sm">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                          <ul className="dropdown-content menu p-2 shadow bg-base-100 rounded-box w-52">
                            <li>
                              <button onClick={() => handleViewAgent(agent)}>
                                <Eye className="w-4 h-4" />
                                Voir
                              </button>
                            </li>
                            <li>
                              <button onClick={() => handleEditAgent(agent)}>
                                <Edit className="w-4 h-4" />
                                Modifier
                              </button>
                            </li>
                            <li>
                              <button
                                onClick={() => handleDeleteAgent(agent)}
                                className="text-red-600"
                              >
                                <Trash2 className="w-4 h-4" />
                                Supprimer
                              </button>
                            </li>
                          </ul>
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
          <div className="text-sm text-gray-700">
            Affichage de 1 à {Math.min(filteredAgents.length, 10)} sur{" "}
            {filteredAgents.length} résultats
          </div>
          <div className="flex space-x-2">
            <button className="btn btn-outline btn-sm" disabled>
              Précédent
            </button>
            <button className="btn btn-outline btn-sm" disabled>
              Suivant
            </button>
          </div>
        </div>
      </main>

      {/* Modal de détail de l'agent */}
      {selectedAgent && (
        <div className="modal modal-open">
          <div className="modal-box max-w-2xl">
            <h3 className="font-bold text-lg mb-4">Détails de l&zpos;agent</h3>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Nom complet
                  </label>
                  <p className="text-gray-900">
                    {selectedAgent.prenom} {selectedAgent.nom}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Matricule
                  </label>
                  <p className="text-gray-900">{selectedAgent.matricule}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Fonction
                  </label>
                  <p className="text-gray-900">{selectedAgent.fonction}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Date de naissance
                  </label>
                  <p className="text-gray-900">{selectedAgent.dateNaissance}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Lieu de naissance
                  </label>
                  <p className="text-gray-900">{selectedAgent.lieuNaissance}</p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Sexe
                  </label>
                  <p className="text-gray-900">
                    {selectedAgent.sexe === "M" ? "Masculin" : "Féminin"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Situation matrimoniale
                  </label>
                  <p className="text-gray-900">
                    {selectedAgent.situationMatrimoniale}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Téléphone
                  </label>
                  <p className="text-gray-900">{selectedAgent.telephone}</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Adresse
                </label>
                <p className="text-gray-900">{selectedAgent.adresse}</p>
              </div>
            </div>
            <div className="modal-action">
              <button
                className="btn btn-outline"
                onClick={() => setSelectedAgent(null)}
              >
                Fermer
              </button>
              <button
                className="btn btn-primary"
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
      )}
    </div>
  );
}
