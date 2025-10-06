"use client";

import { useEffect } from "react";
import { CheckCircle, X } from "lucide-react";

interface SuccessNotificationProps {
  message: string | null;
  onClose: () => void;
  duration?: number; // Durée d'affichage en millisecondes (défaut: 3000)
}

export default function SuccessNotification({
  message,
  onClose,
  duration = 3000,
}: SuccessNotificationProps) {
  // Auto-fermer la notification après la durée spécifiée
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);

      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-in slide-in-from-right-full duration-300">
      <div className="bg-green-50 border border-green-200 rounded-lg shadow-lg p-4 max-w-sm">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
              <CheckCircle className="w-4 h-4 text-white" />
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-green-800 font-medium text-sm leading-relaxed">
              {message}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 text-green-400 hover:text-green-600 transition-colors"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
