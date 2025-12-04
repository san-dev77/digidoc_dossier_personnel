"use client";

import {
  Activity,
  TrendingUp,
  Users,
  FileText,
  FolderOpen,
} from "lucide-react";

interface AuditHeaderProps {
  totalUtilisateurs: number;
  totalAgents: number;
  totalDossiers: number;
  totalPieces: number;
}

export default function AuditHeader({
  totalUtilisateurs,
  totalAgents,
  totalDossiers,
  totalPieces,
}: AuditHeaderProps) {
  return (
    <div className="relative overflow-hidden bg-primary-700 rounded-3xl shadow-2xl p-12 mb-8 border border-primary-700/30">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.2)_0%,transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(139,92,246,0.2)_0%,transparent_50%)]"></div>

      <div className="relative">
        {/* Titre principal */}
        <div className="flex items-center gap-5 mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-purple-600 rounded-3xl flex items-center justify-center shadow-2xl">
            <Activity className="h-10 w-10 text-white" />
          </div>
          <div>
            <h1 className="text-5xl font-black text-white tracking-tight mb-2">
              Audit & Statistiques
            </h1>
            <p className="text-xl text-primary-200 font-semibold">
              Vue d&apos;ensemble complète du système
            </p>
          </div>
        </div>

        {/* Stats rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-6 w-6 text-blue-300" />
              <p className="text-sm text-primary-200 font-bold uppercase">
                Utilisateurs
              </p>
            </div>
            <p className="text-4xl font-black text-white">
              {totalUtilisateurs}
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <Users className="h-6 w-6 text-green-300" />
              <p className="text-sm text-primary-200 font-bold uppercase">
                Agents
              </p>
            </div>
            <p className="text-4xl font-black text-white">{totalAgents}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <FolderOpen className="h-6 w-6 text-purple-300" />
              <p className="text-sm text-primary-200 font-bold uppercase">
                Dossiers
              </p>
            </div>
            <p className="text-4xl font-black text-white">{totalDossiers}</p>
          </div>

          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-5 border border-white/20">
            <div className="flex items-center gap-3 mb-2">
              <FileText className="h-6 w-6 text-orange-300" />
              <p className="text-sm text-primary-200 font-bold uppercase">
                Pièces
              </p>
            </div>
            <p className="text-4xl font-black text-white">{totalPieces}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
