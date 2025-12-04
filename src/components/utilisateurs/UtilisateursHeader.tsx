"use client";

import { Shield, Plus } from "lucide-react";

interface UtilisateursHeaderProps {
  totalUtilisateurs: number;
  onCreateClick: () => void;
  canCreate: boolean;
}

export default function UtilisateursHeader({
  totalUtilisateurs,
  onCreateClick,
  canCreate,
}: UtilisateursHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-primary-700 to-primary-950 rounded-2xl shadow-2xl p-8 mb-8 border border-primary-700/30">
      {/* Effets de fond */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,255,255,0.05)_0%,transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.08)_0%,transparent_50%)]"></div>

      <div className="relative flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-16 h-16 bg-gradient-to-br from-red-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-xl">
              <Shield className="h-8 w-8 text-white" />
            </div>
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-accent-green rounded-full border-2 border-primary-800 animate-pulse"></div>
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight">
              Gestion des Utilisateurs
            </h1>
            <p className="text-primary-300 font-medium mt-1">
              {totalUtilisateurs} utilisateur{totalUtilisateurs > 1 ? "s" : ""}{" "}
              • Contrôle d&apos;accès et permissions
            </p>
          </div>
        </div>

        {canCreate && (
          <button
            onClick={onCreateClick}
            className="group relative flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white px-6 py-3 rounded-xl hover:shadow-xl transition-all duration-300 hover:scale-105 font-semibold"
          >
            <Plus className="h-5 w-5 group-hover:rotate-90 transition-transform duration-300" />
            Nouvel Utilisateur
          </button>
        )}
      </div>
    </div>
  );
}
