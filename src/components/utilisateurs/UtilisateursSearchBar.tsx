"use client";

import { Search } from "lucide-react";

interface UtilisateursSearchBarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
}

export default function UtilisateursSearchBar({
  searchTerm,
  onSearchChange,
}: UtilisateursSearchBarProps) {
  return (
    <div className="relative overflow-hidden bg-white rounded-2xl shadow-lg p-6 mb-8 border-2 border-gray-100">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher par nom, username ou email..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full pl-12 pr-4 py-4 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-300 font-medium text-gray-900 placeholder:text-gray-400"
        />
      </div>
    </div>
  );
}
