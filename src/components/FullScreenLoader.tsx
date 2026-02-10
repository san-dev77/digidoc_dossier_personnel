"use client";

import { useEffect, useState, useRef } from "react";
import { Upload, CheckCircle, AlertCircle } from "lucide-react";

interface FullScreenLoaderProps {
  isOpen: boolean;
  message?: string;
  /** Timeout en secondes avant d'afficher un bouton "Fermer" de secours (défaut: 30s) */
  timeoutSeconds?: number;
  onTimeout?: () => void;
}

export default function FullScreenLoader({
  isOpen,
  message = "Traitement en cours...",
  timeoutSeconds = 30,
  onTimeout,
}: FullScreenLoaderProps) {
  const [showTimeout, setShowTimeout] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Gérer l'ouverture/fermeture avec animation
  useEffect(() => {
    if (isOpen) {
      setVisible(true);
      setShowTimeout(false);
      setProgress(0);

      // Progression simulée (accélère au début, ralentit vers 85%)
      progressRef.current = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 85) return 85;
          // Plus rapide au début, plus lent à la fin
          const increment = Math.max(0.5, (85 - prev) * 0.08);
          return Math.min(85, prev + increment);
        });
      }, 150);

      // Timeout de sécurité
      timeoutRef.current = setTimeout(() => {
        setShowTimeout(true);
      }, timeoutSeconds * 1000);
    } else {
      // Monter à 100% avant de fermer
      setProgress(100);
      // Nettoyer les timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (progressRef.current) clearInterval(progressRef.current);

      // Délai pour l'animation de fermeture
      const closeTimer = setTimeout(() => {
        setVisible(false);
        setShowTimeout(false);
        setProgress(0);
      }, 400);
      return () => clearTimeout(closeTimer);
    }

    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (progressRef.current) clearInterval(progressRef.current);
    };
  }, [isOpen, timeoutSeconds]);

  if (!visible) return null;

  return (
    <div
      className={`fixed inset-0 flex items-center justify-center z-[9999] transition-all duration-300 ${
        isOpen
          ? "opacity-100 backdrop-blur-md bg-black/60"
          : "opacity-0 backdrop-blur-none bg-black/0"
      }`}
    >
      <div
        className={`bg-white rounded-2xl shadow-2xl p-8 max-w-sm w-full mx-4 text-center transition-all duration-300 ${
          isOpen ? "scale-100 opacity-100" : "scale-95 opacity-0"
        }`}
      >
        {/* Icône animée */}
        <div className="relative w-20 h-20 mx-auto mb-6">
          {/* Anneau externe qui pulse doucement */}
          <div
            className="absolute inset-0 rounded-full border-4 border-primary-200"
            style={{
              animation: "pulse-ring 2s ease-in-out infinite",
            }}
          />
          {/* Anneau de progression */}
          <svg className="absolute inset-0 w-20 h-20 -rotate-90" viewBox="0 0 80 80">
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="var(--color-primary-100)"
              strokeWidth="4"
            />
            <circle
              cx="40"
              cy="40"
              r="36"
              fill="none"
              stroke="var(--color-primary-600)"
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={`${2 * Math.PI * 36}`}
              strokeDashoffset={`${2 * Math.PI * 36 * (1 - progress / 100)}`}
              className="transition-all duration-300 ease-out"
            />
          </svg>
          {/* Icône centrale */}
          <div className="absolute inset-0 flex items-center justify-center">
            {progress >= 100 ? (
              <CheckCircle className="w-8 h-8 text-green-600" style={{ animation: "pop-in 0.3s ease-out" }} />
            ) : (
              <Upload className="w-8 h-8 text-primary-600" style={{ animation: "float 2s ease-in-out infinite" }} />
            )}
          </div>
        </div>

        {/* Message */}
        <h3 className="text-lg font-bold text-primary-900 mb-1">{message}</h3>
        <p className="text-sm text-primary-500 mb-5">
          {progress >= 100
            ? "Terminé !"
            : "Veuillez patienter..."}
        </p>

        {/* Barre de progression */}
        <div className="w-full bg-primary-100 rounded-full h-1.5 overflow-hidden mb-2">
          <div
            className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <p className="text-xs text-primary-400 font-medium">{Math.round(progress)}%</p>

        {/* Bouton de secours si timeout atteint */}
        {showTimeout && (
          <div className="mt-5 pt-4 border-t border-primary-100">
            <div className="flex items-center justify-center gap-2 text-amber-600 mb-3">
              <AlertCircle className="w-4 h-4" />
              <p className="text-sm font-medium">
                Le chargement prend plus de temps que prévu
              </p>
            </div>
            <button
              onClick={() => {
                if (onTimeout) onTimeout();
                setVisible(false);
                setShowTimeout(false);
              }}
              className="px-5 py-2 text-sm font-semibold text-primary-700 bg-primary-50 hover:bg-primary-100 rounded-lg transition-colors border border-primary-200"
            >
              Fermer
            </button>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-4px); }
        }
        @keyframes pulse-ring {
          0%, 100% { transform: scale(1); opacity: 0.6; }
          50% { transform: scale(1.06); opacity: 0.3; }
        }
        @keyframes pop-in {
          0% { transform: scale(0.5); opacity: 0; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
