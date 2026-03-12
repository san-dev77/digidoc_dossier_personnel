"use client";

import { X } from "lucide-react";
import CreditDossierViewer from "@/components/CreditDossierViewer";

interface CreditDossierModalProps {
  isOpen: boolean;
  sousDossierId: number;
  rubriqueId: number;
  agentDossierId: number;
  onClose: () => void;
}

export default function CreditDossierModal({
  isOpen,
  sousDossierId,
  rubriqueId,
  agentDossierId,
  onClose,
}: CreditDossierModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-primary-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-primary-800">
              Dossier de crédit
            </h2>
            <button
              onClick={onClose}
              className="p-2 text-primary-600 hover:text-primary-800 hover:bg-primary-100 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          <CreditDossierViewer
            sousDossierId={sousDossierId}
            rubriqueId={rubriqueId}
            agentDossierId={agentDossierId}
            onClose={onClose}
          />
        </div>
      </div>
    </div>
  );
}
