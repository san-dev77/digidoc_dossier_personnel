"use client";

import { Shield, Edit, Trash2, Clock } from "lucide-react";
import type { Utilisateur } from "@/types/rbac";

interface UtilisateursTableProps {
  utilisateurs: Utilisateur[];
  onUserClick: (user: Utilisateur) => void;
  onEdit: (user: Utilisateur) => void;
  onDelete: (user: Utilisateur) => void;
  canUpdate: boolean;
  canDelete: boolean;
}

export default function UtilisateursTable({
  utilisateurs,
  onUserClick,
  onEdit,
  onDelete,
  canUpdate,
  canDelete,
}: UtilisateursTableProps) {
  const getStatutBadge = (statut: string) => {
    const styles = {
      actif: "bg-success-100 text-success-800 border-success-200",
      inactif: "bg-gray-100 text-gray-800 border-gray-200",
      suspendu: "bg-error-100 text-error-800 border-error-200",
    };
    return styles[statut as keyof typeof styles] || styles.inactif;
  };

  if (utilisateurs.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-lg p-16 text-center border-2 border-gray-100">
        <Shield className="mx-auto h-16 w-16 text-gray-400 mb-4" />
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Aucun utilisateur trouvé
        </h3>
        <p className="text-gray-600">
          Commencez par créer un nouvel utilisateur
        </p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border-2 border-gray-100">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-primary-700 to-primary-950">
            <tr>
              <th className="px-6 py-4 text-left text-sm font-bold text-white uppercase tracking-wider">
                Utilisateur
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Rôle
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Département
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Statut
              </th>
              <th className="px-6 py-4 text-left text-xs font-bold text-white uppercase tracking-wider">
                Dernière connexion
              </th>
              <th className="px-6 py-4 text-right text-xs font-bold text-white uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {utilisateurs.map((user) => (
              <tr
                key={user.id}
                onClick={() => onUserClick(user)}
                className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-all duration-200 cursor-pointer group"
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center">
                    <div className="flex-shrink-0">
                      <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg shadow-lg group-hover:scale-110 transition-transform">
                        {user.nom_complet.charAt(0).toUpperCase()}
                      </div>
                    </div>
                    <div className="ml-4">
                      <div className="text-sm font-bold text-gray-900">
                        {user.nom_complet}
                      </div>
                      <div className="text-sm text-gray-600">
                        @{user.username} • {user.email}
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2">
                    <Shield
                      className="h-4 w-4"
                      style={{ color: user.roles.couleur || "#6B7280" }}
                    />
                    <span className="text-sm font-semibold text-gray-900">
                      {user.roles.nom}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                  {user.departement || "-"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-3 py-1 inline-flex text-xs leading-5 font-bold rounded-full border ${getStatutBadge(
                      user.statut
                    )}`}
                  >
                    {user.statut}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="h-4 w-4" />
                    {user.derniere_connexion
                      ? new Date(user.derniere_connexion).toLocaleDateString(
                          "fr-FR"
                        )
                      : "Jamais"}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div
                    className="flex items-center justify-end gap-2"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {canUpdate && (
                      <button
                        className="p-2 text-accent-blue hover:text-white hover:bg-accent-blue rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          onEdit(user);
                        }}
                        title="Modifier"
                      >
                        <Edit className="h-5 w-5" />
                      </button>
                    )}
                    {canDelete && !user.roles.is_system && (
                      <button
                        className="p-2 text-accent-red hover:text-white hover:bg-accent-red rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-110"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDelete(user);
                        }}
                        title="Supprimer"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
