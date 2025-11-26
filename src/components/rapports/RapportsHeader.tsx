"use client";

import { BarChart3 } from "lucide-react";

interface RapportsHeaderProps {
  totalReports: number;
  conformesCount: number;
  partielsCount: number;
  nonConformesCount: number;
}

export default function RapportsHeader({
  totalReports,
  conformesCount,
  partielsCount,
  nonConformesCount,
}: RapportsHeaderProps) {
  return (
    <div className="mb-8">
      <div className="bg-primary-700 mb-5 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4">
                <BarChart3 className="w-12 h-12 text-white" />
              </div>
              <div>
                <h1 className="text-4xl font-bold text-white mb-2">
                  Rapports de Conformité
                </h1>
                <p className="text-primary-100 text-lg">
                  Suivi de la conformité des agents par rubrique et
                  sous-dossier
                </p>
                <div className="flex items-center space-x-4 mt-4">
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                    <div className="w-2 h-2 bg-accent-green rounded-full"></div>
                    <span className="text-white text-sm font-medium">
                      {conformesCount} agents conformes (≥80%)
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                    <div className="w-2 h-2 bg-warning-500 rounded-full"></div>
                    <span className="text-white text-sm font-medium">
                      {partielsCount} agents partiellement conformes
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2">
                    <div className="w-2 h-2 bg-error-500 rounded-full"></div>
                    <span className="text-white text-sm font-medium">
                      {nonConformesCount} agents non conformes (&lt;50%)
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

