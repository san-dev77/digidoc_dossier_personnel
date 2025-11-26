"use client";

import { AlertTriangle, Trash2 } from "lucide-react";

interface DeleteConfirmModalProps {
  isOpen: boolean;
  dossierTitle: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function DeleteConfirmModal({
  isOpen,
  dossierTitle,
  isDeleting,
  onConfirm,
  onCancel,
}: DeleteConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        <div className="text-center">
          {/* Icône d'alerte */}
          <div className="w-20 h-20 bg-gradient-to-br from-red-500 to-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <AlertTriangle className="w-10 h-10 text-white" />
          </div>

          {/* Titre */}
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Confirmer la suppression
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">
            Êtes-vous sûr de vouloir supprimer le dossier{" "}
            <strong>&quot;{dossierTitle}&quot;</strong> ?
            <br />
            Cette action est irréversible.
          </p>

          {/* Boutons */}
          <div className="flex items-center justify-center gap-4">
            <button
              onClick={onCancel}
              disabled={isDeleting}
              className="px-6 py-3 bg-primary-200 text-primary-800 rounded-lg hover:bg-primary-300 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Annuler
            </button>
            <button
              onClick={onConfirm}
              disabled={isDeleting}
              className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isDeleting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Suppression...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Supprimer</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

