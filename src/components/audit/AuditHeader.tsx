"use client";

import { Activity, Users, FileText, FolderOpen } from "lucide-react";

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
    <div className="bg-primary-700 rounded-3xl shadow-2xl p-10 mb-8">
      {/* Titre principal */}
      <div className="flex items-center gap-5 mb-8">
        <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
          <Activity className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-black text-white tracking-tight">
            Audit &amp; Statistiques
          </h1>
          <p className="text-primary-200 font-semibold mt-1">
            Vue d&apos;ensemble complète du système
          </p>
        </div>
      </div>

      {/* Stats rapides */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-2.5 mb-2">
            <Users className="h-4 w-4 text-primary-200" />
            <p className="text-xs text-primary-200 font-bold uppercase tracking-wide">
              Utilisateurs
            </p>
          </div>
          <p className="text-3xl font-black text-white">{totalUtilisateurs}</p>
        </div>

        <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-2.5 mb-2">
            <Users className="h-4 w-4 text-primary-200" />
            <p className="text-xs text-primary-200 font-bold uppercase tracking-wide">
              Agents
            </p>
          </div>
          <p className="text-3xl font-black text-white">{totalAgents}</p>
        </div>

        <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-2.5 mb-2">
            <FolderOpen className="h-4 w-4 text-primary-200" />
            <p className="text-xs text-primary-200 font-bold uppercase tracking-wide">
              Dossiers
            </p>
          </div>
          <p className="text-3xl font-black text-white">{totalDossiers}</p>
        </div>

        <div className="bg-white/10 rounded-2xl p-5 border border-white/10">
          <div className="flex items-center gap-2.5 mb-2">
            <FileText className="h-4 w-4 text-primary-200" />
            <p className="text-xs text-primary-200 font-bold uppercase tracking-wide">
              Pièces
            </p>
          </div>
          <p className="text-3xl font-black text-white">{totalPieces}</p>
        </div>
      </div>
    </div>
  );
}
