"use client";

import { Folder, Database } from "lucide-react";

interface DossiersHeaderProps {
  totalSousDossiers: number;
  totalPieces: number;
  totalMetadata: number;
  isCacheValid: boolean;
  lastFetch: number | null;
  onRefresh: () => void;
}

export default function DossiersHeader({
  totalSousDossiers,
  totalPieces,
  totalMetadata,
  isCacheValid,
  lastFetch,
  onRefresh,
}: DossiersHeaderProps) {
  return (
    <div className="mb-8">
      <div className="relative bg-gradient-to-br from-slate-800 via-slate-700 to-slate-900 mb-5 rounded-3xl shadow-2xl overflow-hidden">
        {/* Background Pattern */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='0.05'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          }}
        ></div>

        <div className="relative p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="relative">
                <div className="bg-white/20 backdrop-blur-sm rounded-3xl p-6 shadow-lg transform hover:scale-105 transition-all duration-300">
                  <Folder className="w-14 h-14 text-white drop-shadow-lg" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full flex items-center justify-center shadow-lg">
                  <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                </div>
              </div>
              <div>
                <h1 className="text-5xl font-bold mb-3 bg-gradient-to-r from-white to-slate-200 bg-clip-text text-transparent">
                  Gestion des Dossiers
                </h1>
                <p className="text-slate-200 text-xl mb-6 leading-relaxed">
                  Organisation et suivi des dossiers par rubrique et
                  sous-dossier
                </p>
                <div className="flex items-center space-x-4">
                  <div className="group flex items-center space-x-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                    <div className="w-3 h-3 bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full shadow-lg animate-pulse"></div>
                    <span className="text-white text-sm font-semibold">
                      {totalSousDossiers} sous-dossiers
                    </span>
                  </div>
                  <div className="group flex items-center space-x-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                    <div className="w-3 h-3 bg-gradient-to-r from-slate-400 to-slate-500 rounded-full shadow-lg"></div>
                    <span className="text-white text-sm font-semibold">
                      {totalPieces} pièces
                    </span>
                  </div>
                  <div className="group flex items-center space-x-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                    <div className="w-3 h-3 bg-gradient-to-r from-slate-300 to-slate-400 rounded-full shadow-lg"></div>
                    <span className="text-white text-sm font-semibold">
                      {totalMetadata} métadonnées
                    </span>
                  </div>
                  {/* Indicateur de cache */}
                  <div className="group flex items-center space-x-3 bg-white/15 backdrop-blur-sm rounded-xl px-4 py-3 hover:bg-white/20 transition-all duration-300 cursor-pointer">
                    <div
                      className={`w-3 h-3 rounded-full shadow-lg ${
                        isCacheValid
                          ? "bg-gradient-to-r from-emerald-400 to-emerald-500"
                          : "bg-gradient-to-r from-orange-400 to-orange-500"
                      }`}
                    ></div>
                    <span className="text-white text-sm font-semibold">
                      {isCacheValid ? "Cache valide" : "Cache expiré"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Boutons de contrôle */}
            <div className="flex items-center space-x-3">
              <button
                onClick={onRefresh}
                className="group relative px-6 py-3 bg-white/20 backdrop-blur-sm text-white rounded-xl hover:bg-white/30 transition-all duration-300 font-semibold text-sm shadow-lg hover:shadow-xl transform hover:-translate-y-1 border border-white/30"
              >
                <div className="flex items-center space-x-2">
                  <Database className="w-4 h-4 group-hover:rotate-180 transition-transform duration-300" />
                  <span>Rafraîchir</span>
                </div>
              </button>

              <div className="text-xs text-slate-300 bg-white/10 px-3 py-2 rounded-lg">
                Dernière MAJ:{" "}
                {lastFetch
                  ? new Date(lastFetch).toLocaleTimeString("fr-FR")
                  : "Jamais"}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
