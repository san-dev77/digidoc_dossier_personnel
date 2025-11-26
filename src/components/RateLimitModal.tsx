"use client";

import { X, AlertTriangle, Clock } from "lucide-react";

interface RateLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
  retryAfter?: number; // En secondes
}

export default function RateLimitModal({
  isOpen,
  onClose,
  message,
  retryAfter,
}: RateLimitModalProps) {
  if (!isOpen) return null;

  const formatTime = (seconds: number): string => {
    if (seconds < 60) {
      return `${seconds} seconde${seconds > 1 ? "s" : ""}`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    if (remainingSeconds === 0) {
      return `${minutes} minute${minutes > 1 ? "s" : ""}`;
    }
    return `${minutes} minute${minutes > 1 ? "s" : ""} et ${remainingSeconds} seconde${remainingSeconds > 1 ? "s" : ""}`;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full transform transition-all border border-red-200">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-50 to-orange-50 px-6 py-5 border-b border-red-200 rounded-t-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-red-900">
                  Trop de tentatives
                </h3>
                <p className="text-red-700 text-sm font-medium">
                  Limite de sécurité atteinte
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-red-100 transition-colors group"
            >
              <X className="w-5 h-5 text-red-600 group-hover:text-red-800" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-6">
            <p className="text-slate-700 text-base leading-relaxed mb-4">
              {message}
            </p>

            {retryAfter && retryAfter > 0 && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 flex items-start gap-3">
                <Clock className="w-5 h-5 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-orange-900 font-semibold text-sm mb-1">
                    Temps d&apos;attente
                  </p>
                  <p className="text-orange-700 text-sm">
                    Vous pourrez réessayer dans{" "}
                    <span className="font-bold">
                      {formatTime(retryAfter)}
                    </span>
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-50 rounded-xl p-4 border border-slate-200">
            <p className="text-slate-600 text-sm leading-relaxed">
              <strong className="text-slate-800">Pourquoi cette limitation ?</strong>
              <br />
              Cette mesure de sécurité protège votre compte contre les tentatives
              d&apos;accès non autorisées. Veuillez patienter avant de réessayer.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 rounded-b-2xl">
          <button
            onClick={onClose}
            className="w-full bg-slate-800 text-white py-3 px-6 rounded-xl hover:bg-slate-700 transition-all duration-300 font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
          >
            Compris
          </button>
        </div>
      </div>
    </div>
  );
}

