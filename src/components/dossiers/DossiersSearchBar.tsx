"use client";

import { Search, X, Plus } from "lucide-react";

interface DossiersSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  onNewDossier: () => void;
}

export default function DossiersSearchBar({
  searchTerm,
  onSearchChange,
  onNewDossier,
}: DossiersSearchBarProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between gap-6">
        <div className="flex items-center space-x-4 flex-1">
          <div className="relative w-full max-w-2xl">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <Search className="h-5 w-5 text-primary-400" />
            </div>
            <input
              type="text"
              placeholder="Rechercher une rubrique ou un sous-dossier..."
              value={searchTerm}
              onChange={(e) => onSearchChange(e.target.value)}
              className="block w-full pl-12 pr-4 py-4 border-2 border-primary-200 rounded-2xl text-sm placeholder-primary-400 focus:outline-none focus:ring-4 focus:ring-primary-500/20 focus:border-primary-500 bg-white shadow-lg hover:shadow-xl transition-all duration-300 text-black"
            />
            {searchTerm && (
              <button
                onClick={() => onSearchChange("")}
                className="absolute inset-y-0 right-0 pr-4 flex items-center"
              >
                <X className="h-4 w-4 text-primary-400 hover:text-primary-600 transition-colors" />
              </button>
            )}
          </div>
        </div>
        <button
          onClick={onNewDossier}
          className="group flex items-center gap-3 px-6 py-4 bg-gradient-primary text-white rounded-2xl hover:bg-gradient-to-r hover:from-primary-700 hover:to-primary-800 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
        >
          <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform duration-300" />
          <span className="font-semibold">Nouveau dossier</span>
        </button>
      </div>
    </div>
  );
}
