"use client";

import { BarChart3 } from "lucide-react";
import type { UserRow } from "./UsersCreatedTable";

interface FrequentConnectionsProps {
  users: UserRow[];
}

const TOP_N = 5;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  return ((parts[0]?.[0] || "") + (parts[1]?.[0] || "")).toUpperCase();
}

export default function FrequentConnections({ users }: FrequentConnectionsProps) {
  const ranked = users
    .filter((u) => u.statut === "actif" && u.nombre_connexions > 0)
    .sort((a, b) => b.nombre_connexions - a.nombre_connexions)
    .slice(0, TOP_N);

  const maxCount = ranked[0]?.nombre_connexions || 1;

  return (
    <div className="bg-white rounded-2xl shadow-xl border-2 border-gray-100 overflow-hidden">
      <div className="px-6 py-5 border-b-2 border-gray-100 flex items-center gap-3">
        <BarChart3 className="h-6 w-6 text-primary-700" />
        <div>
          <h3 className="text-xl font-black text-gray-900">
            Connexions fréquentes
          </h3>
          <p className="text-gray-600 font-semibold text-sm mt-0.5">
            Utilisateurs actifs qui se connectent le plus souvent
          </p>
        </div>
      </div>

      {ranked.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-gray-500 font-semibold text-sm">
            Pas encore assez de connexions enregistrées
          </p>
        </div>
      ) : (
        <div className="p-6 space-y-4">
          {ranked.map((user, index) => (
            <div key={user.id} className="flex items-center gap-4">
              <span className="w-6 text-center text-sm font-black text-gray-400 flex-shrink-0">
                #{index + 1}
              </span>
              <div className="w-8 h-8 rounded-lg bg-primary-600 text-white flex items-center justify-center text-[11px] font-bold flex-shrink-0">
                {initials(user.nom_complet)}
              </div>
              <p className="w-40 truncate text-sm font-bold text-gray-900 flex-shrink-0">
                {user.nom_complet}
              </p>
              <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden border border-gray-200">
                <div
                  className="h-full bg-primary-600 rounded-full"
                  style={{
                    width: `${(user.nombre_connexions / maxCount) * 100}%`,
                  }}
                />
              </div>
              <span className="w-24 text-right text-xs font-bold text-gray-600 flex-shrink-0">
                {user.nombre_connexions} connexion
                {user.nombre_connexions > 1 ? "s" : ""}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
