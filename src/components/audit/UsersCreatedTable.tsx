"use client";

import { Users } from "lucide-react";

export interface UserRow {
  id: number;
  nom_complet: string;
  username: string;
  statut: "actif" | "inactif" | "suspendu";
  created_at: string;
  created_by: number | null;
  derniere_connexion: string | null;
  nombre_connexions: number;
  roles?: { nom: string; couleur: string | null } | null;
}

interface UsersCreatedTableProps {
  users: UserRow[];
  onToggleStatus: (user: UserRow) => void;
  togglingId: number | null;
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

function formatDate(value: string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleString("fr-FR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function UsersCreatedTable({
  users,
  onToggleStatus,
  togglingId,
}: UsersCreatedTableProps) {
  const byId = new Map(users.map((u) => [u.id, u]));

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b-2 border-gray-100 flex items-center gap-3">
        <Users className="h-6 w-6 text-primary-700" />
        <div>
          <h3 className="text-xl font-black text-gray-900">Utilisateurs créés</h3>
          <p className="text-gray-600 font-semibold text-sm mt-0.5">
            Création, créateur et dernière connexion de chaque compte
          </p>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                Utilisateur
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                Créé le
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                Créé par
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                Dernière connexion
              </th>
              <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase">
                Connexions
              </th>
              <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase">
                Statut
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {users.map((user) => {
              const creator = user.created_by ? byId.get(user.created_by) : null;
              const isActive = user.statut === "actif";
              const isToggling = togglingId === user.id;

              return (
                <tr key={user.id} className="hover:bg-primary-50/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-primary-600 text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {initials(user.nom_complet)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900 text-sm">
                          {user.nom_complet}
                        </p>
                        <p className="text-xs text-gray-500">
                          {user.roles?.nom || "Sans rôle"}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatDate(user.created_at)}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {creator ? (
                      <span className="text-gray-700 font-medium">
                        {creator.nom_complet}
                      </span>
                    ) : (
                      <span className="text-gray-400 italic">
                        Inconnu (ancien compte)
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-700">
                    {formatDate(user.derniere_connexion)}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-1 rounded-lg text-xs font-bold bg-primary-50 text-primary-700 border border-primary-200">
                      {user.nombre_connexions}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2.5">
                      <button
                        onClick={() => onToggleStatus(user)}
                        disabled={isToggling || user.statut === "suspendu"}
                        title={
                          user.statut === "suspendu"
                            ? "Compte suspendu — gérez le statut depuis la page Utilisateurs"
                            : isActive
                            ? "Désactiver ce compte"
                            : "Activer ce compte"
                        }
                        className={`relative rounded-full transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                          isActive ? "bg-accent-green" : "bg-gray-300"
                        }`}
                        style={{ width: "38px", height: "21px" }}
                      >
                        <span
                          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
                            isActive ? "translate-x-[17px]" : "translate-x-0"
                          }`}
                        />
                      </button>
                      <span
                        className={`text-xs font-bold ${
                          user.statut === "actif"
                            ? "text-accent-green"
                            : user.statut === "suspendu"
                            ? "text-red-600"
                            : "text-gray-400"
                        }`}
                      >
                        {user.statut === "actif"
                          ? "Actif"
                          : user.statut === "suspendu"
                          ? "Suspendu"
                          : "Inactif"}
                      </span>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {users.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-3" />
            <p className="text-gray-600 font-semibold">Aucun utilisateur</p>
          </div>
        )}
      </div>
    </div>
  );
}
