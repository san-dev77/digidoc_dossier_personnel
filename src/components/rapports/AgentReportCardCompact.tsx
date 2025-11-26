"use client";

import { useRouter } from "next/navigation";
import { User, Building2, AlertCircle, Settings } from "lucide-react";

interface Agent {
  id: string;
  nom: string;
  matricule: string;
  fonction: string;
}

interface AgentReportCardCompactProps {
  agent: Agent;
}

export default function AgentReportCardCompact({
  agent,
}: AgentReportCardCompactProps) {
  const router = useRouter();

  const handleAssignRubrique = () => {
    router.push("/agents/configuration");
  };

  return (
    <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden hover:shadow-lg transition-all duration-200">
      <div className="p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 bg-slate-100 rounded-xl flex items-center justify-center flex-shrink-0">
            <User className="w-7 h-7 text-slate-500" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              {agent.nom}
            </h3>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="font-medium">Matricule:</span>
                <span>{agent.matricule}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <span className="font-medium">Fonction:</span>
                <span>{agent.fonction}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-amber-50 border border-amber-200 rounded-lg flex-shrink-0">
            <AlertCircle className="w-5 h-5 text-amber-600" />
            <span className="text-sm font-medium text-amber-700">
              Sans rubrique
            </span>
          </div>
        </div>
        <button
          onClick={handleAssignRubrique}
          className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-lg transition-all duration-200 text-base font-semibold shadow-sm hover:shadow-md"
        >
          <Settings className="w-5 h-5" />
          Assigner une rubrique
        </button>
      </div>
    </div>
  );
}

