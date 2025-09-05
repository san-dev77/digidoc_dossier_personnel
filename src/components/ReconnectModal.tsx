"use client";

import { useState, useEffect } from "react";
import { WifiOff, RefreshCw } from "lucide-react";

interface ReconnectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onRetry: () => Promise<boolean>;
  isRetrying: boolean;
  retryCount: number;
}

export default function ReconnectModal({
  isOpen,
  onClose,
  onRetry,
  isRetrying,
  retryCount,
}: ReconnectModalProps) {
  const [countdown, setCountdown] = useState(10);

  useEffect(() => {
    if (isOpen && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, countdown]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
              <WifiOff className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Connexion perdue
              </h3>
              <p className="text-sm text-gray-600">
                Impossible de se connecter au serveur
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">
                Que s'est-il passé ?
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                <li>• Votre connexion internet a été interrompue</li>
                <li>• Le serveur est temporairement indisponible</li>
                <li>• Votre session a expiré</li>
              </ul>
            </div>

            <div className="bg-blue-50 rounded-lg p-4">
              <h4 className="text-sm font-medium text-blue-900 mb-2">
                Tentative de reconnexion
              </h4>
              <p className="text-sm text-blue-700">
                {isRetrying
                  ? `Tentative ${retryCount}/5 en cours...`
                  : `Prochaine tentative dans ${countdown}s`}
              </p>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={onRetry}
              disabled={isRetrying}
              className="px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            >
              {isRetrying ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Reconnexion...
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  Réessayer maintenant
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
