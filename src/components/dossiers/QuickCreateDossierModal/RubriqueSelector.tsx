"use client";

import { Folder, CheckCircle } from "lucide-react";
import type { Rubrique } from "@/types";

interface RubriqueSelectorProps {
  rubriques: Rubrique[];
  selectedRubrique: Rubrique | null;
  onSelect: (rubrique: Rubrique) => void;
}

export default function RubriqueSelector({
  rubriques,
  selectedRubrique,
  onSelect,
}: RubriqueSelectorProps) {
  return (
    <div>
      <h3 className="text-xl font-bold text-primary-800 mb-6">
        Sélectionnez la rubrique
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rubriques.map((rubrique) => (
          <div
            key={rubrique.id}
            className={`p-6 rounded-xl border-2 cursor-pointer transition-all ${
              selectedRubrique?.id === rubrique.id
                ? "border-primary-500 bg-primary-50 shadow-lg scale-105"
                : "border-primary-200 hover:border-primary-300 hover:bg-primary-50/50"
            }`}
            onClick={() => onSelect(rubrique)}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Folder className="w-6 h-6 text-primary-600" />
                <div>
                  <span className="font-semibold text-primary-900 block">
                    {rubrique.nom}
                  </span>
                  {rubrique.description && (
                    <span className="text-xs text-primary-600 mt-1 block">
                      {rubrique.description}
                    </span>
                  )}
                </div>
              </div>
              {selectedRubrique?.id === rubrique.id && (
                <CheckCircle className="w-6 h-6 text-primary-600" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

