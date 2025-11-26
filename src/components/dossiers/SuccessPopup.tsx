"use client";

import { CheckCircle } from "lucide-react";

interface SuccessPopupProps {
  isOpen: boolean;
  message: string;
}

export default function SuccessPopup({
  isOpen,
  message,
}: SuccessPopupProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 transform transition-all duration-300 scale-100">
        <div className="text-center">
          {/* Icône de succès */}
          <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg">
            <CheckCircle className="w-10 h-10 text-white" />
          </div>

          {/* Titre */}
          <h3 className="text-2xl font-bold text-gray-900 mb-3">
            Succès !
          </h3>

          {/* Message */}
          <p className="text-gray-600 mb-6 leading-relaxed">{message}</p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full animate-pulse"
              style={{ width: "100%" }}
            ></div>
          </div>
          <p className="text-sm text-gray-500">
            Fermeture automatique dans 2 secondes...
          </p>
        </div>
      </div>
    </div>
  );
}

