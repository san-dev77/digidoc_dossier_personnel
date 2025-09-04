import Link from "next/link";
import { Building2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50/30 flex items-center justify-center relative overflow-hidden">
      {/* Éléments de fond subtils */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.05)_0%,transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(59,130,246,0.03)_0%,transparent_50%)]"></div>

      <div className="max-w-4xl mx-auto px-8 text-center relative z-10">
        {/* Logo et titre */}
        <div className="mb-20">
          <h1 className="text-6xl md:text-7xl font-bold text-slate-900 mb-8 tracking-tight leading-tight">
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
              DigiDoc
            </span>
            <br />
            <span className="text-slate-700 font-light">
              Dossier du Personnel
            </span>
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Solution de gestion numérique des dossiers du personnel. Centralisez
            et organisez efficacement les informations de vos collaborateurs.
          </p>
        </div>

        {/* Boutons d'action */}
        <div className="flex flex-col sm:flex-row gap-6 justify-center">
          <Link
            href="/login"
            className="group relative px-10 py-4 bg-gradient-to-r from-slate-900 to-slate-800 text-white rounded-xl hover:from-slate-800 hover:to-slate-700 transition-all duration-300 font-semibold text-lg shadow-[0_10px_30px_-10px_rgba(0,0,0,0.3)] hover:shadow-[0_20px_40px_-15px_rgba(0,0,0,0.4)] transform hover:-translate-y-1 border border-slate-700/20"
          >
            <span className="relative z-10">Se connecter</span>
            <div className="absolute inset-0 bg-gradient-to-r from-slate-800 to-slate-700 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
          </Link>
          <Link
            href="/register"
            className="group px-10 py-4 border-2 text-gray-700 border-slate-700  rounded-xl hover:border-slate-400 hover:bg-slate-50/80 transition-all duration-300 font-semibold text-lg shadow-[0_4px_20px_-5px_rgba(0,0,0,0.1)] hover:shadow-[0_8px_30px_-10px_rgba(0,0,0,0.15)] transform hover:-translate-y-0.5 backdrop-blur-sm"
          >
            S&apos;inscrire
          </Link>
        </div>

        {/* Indicateur de statut */}
        <div className="mt-24 flex items-center justify-center space-x-3 text-sm text-slate-500">
          <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm animate-pulse"></div>
          <span className="font-medium text-gray-700 tracking-wide">
            Système opérationnel
          </span>
        </div>
      </div>
    </div>
  );
}
