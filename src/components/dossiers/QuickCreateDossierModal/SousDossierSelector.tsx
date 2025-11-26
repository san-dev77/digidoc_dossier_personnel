"use client";

import { FileText, CheckCircle, Search, Loader2 } from "lucide-react";
import type { SousDossier } from "@/services/sous-dossiers";

interface SousDossierSelectorProps {
  sousDossiers: SousDossier[];
  selectedSousDossier: SousDossier | null;
  loading: boolean;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  onSelect: (sousDossier: SousDossier) => void;
}

export default function SousDossierSelector({
  sousDossiers,
  selectedSousDossier,
  loading,
  searchTerm,
  onSearchChange,
  onSelect,
}: SousDossierSelectorProps) {
  const filteredSousDossiers = sousDossiers.filter((sd) =>
    searchTerm
      ? sd.titre.toLowerCase().includes(searchTerm.toLowerCase())
      : true
  );

  return (
    <div>
      <h3 className="text-xl font-bold text-primary-900 mb-4">
        Sélectionnez le sous-dossier
      </h3>
      {/* Barre de recherche */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-primary-600" />
          <input
            type="text"
            placeholder="Rechercher un sous-dossier..."
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border-2 border-primary-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-primary-900 bg-white"
          />
        </div>
      </div>
      {loading ? (
        <div className="flex items-center justify-center p-12">
          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
        </div>
      ) : filteredSousDossiers.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredSousDossiers.map((sousDossier) => (
            <div
              key={sousDossier.id}
              className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
                selectedSousDossier?.id === sousDossier.id
                  ? "border-primary-500 bg-primary-50 shadow-lg scale-105"
                  : "border-primary-200 hover:border-primary-300 hover:bg-primary-50/50"
              }`}
              onClick={() => onSelect(sousDossier)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-primary-600" />
                  <div>
                    <span className="font-semibold text-primary-900 block">
                      {sousDossier.titre}
                    </span>
                    {sousDossier.description && (
                      <span className="text-xs text-primary-600 mt-1 block">
                        {sousDossier.description}
                      </span>
                    )}
                  </div>
                </div>
                {selectedSousDossier?.id === sousDossier.id && (
                  <CheckCircle className="w-6 h-6 text-primary-600" />
                )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center p-12 text-primary-700 font-medium">
          {searchTerm
            ? "Aucun sous-dossier trouvé"
            : "Aucun sous-dossier disponible pour cette rubrique"}
        </div>
      )}
    </div>
  );
}

