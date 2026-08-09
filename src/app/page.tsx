import Link from "next/link";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden px-6 py-14">
      {/* Fond ambiant discret : halos qui dérivent lentement + grain léger */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <span className="absolute -top-44 left-[4%] w-[30rem] h-[30rem] rounded-full blur-[64px] opacity-[0.05] bg-blue-500 bg-drift-a motion-reduce:animate-none"></span>
        <span className="absolute -bottom-40 right-[6%] w-[26rem] h-[26rem] rounded-full blur-[64px] opacity-[0.045] bg-slate-400 bg-drift-b motion-reduce:animate-none"></span>
        <span className="absolute inset-[-10%] opacity-[0.035] mix-blend-overlay bg-grain"></span>
      </div>

      <div className="max-w-2xl mx-auto text-center relative z-10 animate-rise motion-reduce:animate-none">
        {/* Logo et titre */}
        <div className="mb-11">
          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold text-slate-900 mb-4 tracking-tight leading-[1.08]">
            <span className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-700 bg-clip-text text-transparent">
              DigiDoc
            </span>
            <br />
            <span className="text-slate-600 font-normal">
              Dossier du Personnel
            </span>
          </h1>
          <p className="text-lg sm:text-xl text-slate-600 max-w-xl mx-auto leading-relaxed">
            Solution de gestion numérique des dossiers du personnel. Centralisez
            et organisez efficacement les informations de vos collaborateurs.
          </p>
        </div>

        {/* Bouton d'action */}
        <div className="flex justify-center">
          <Link
            href="/login"
            className="inline-flex items-center gap-2 px-9 py-4 bg-slate-900 text-white rounded-xl hover:bg-slate-800 transition-all duration-200 font-semibold text-lg shadow-[0_14px_28px_-14px_rgba(30,41,59,0.35)] hover:shadow-[0_20px_40px_-15px_rgba(30,41,59,0.4)] hover:-translate-y-0.5"
          >
            Se connecter
          </Link>
        </div>

        {/* Indicateur de statut */}
        <div className="mt-14 inline-flex items-center gap-2 text-sm text-slate-500 bg-white border border-slate-200 rounded-full px-4 py-2">
          <div className="w-2 h-2 bg-emerald-500 rounded-full shadow-sm animate-pulse motion-reduce:animate-none"></div>
          <span className="font-medium text-slate-600 tracking-wide">
            Système opérationnel
          </span>
        </div>
      </div>
    </div>
  );
}
