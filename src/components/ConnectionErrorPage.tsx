"use client";

import { useState, useEffect } from "react";
import {
  WifiOff,
  RefreshCw,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";

interface ConnectionErrorPageProps {
  error: {
    type: "network" | "supabase" | "auth";
    message: string;
    timestamp: Date;
    retryCount: number;
  };
  onRetry: () => Promise<boolean>;
  isRetrying: boolean;
}

export default function ConnectionErrorPage({
  error,
  onRetry,
  isRetrying,
}: ConnectionErrorPageProps) {
  const [countdown, setCountdown] = useState(10);
  const [lastRetryTime, setLastRetryTime] = useState<Date | null>(null);

  useEffect(() => {
    if (countdown > 0 && !isRetrying) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown, isRetrying]);

  const handleRetry = async () => {
    setLastRetryTime(new Date());
    const success = await onRetry();
    if (!success) {
      setCountdown(10); // Reset countdown for next retry
    }
  };

  const getErrorIcon = () => {
    switch (error.type) {
      case "network":
        return <WifiOff className="w-16 h-16 text-red-500" />;
      case "supabase":
        return <AlertTriangle className="w-16 h-16 text-orange-500" />;
      case "auth":
        return <AlertTriangle className="w-16 h-16 text-yellow-500" />;
      default:
        return <AlertTriangle className="w-16 h-16 text-gray-500" />;
    }
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case "network":
        return "Connexion Internet Perdue";
      case "supabase":
        return "Serveur Indisponible";
      case "auth":
        return "Session Expirée";
      default:
        return "Erreur de Connexion";
    }
  };

  const getErrorDescription = () => {
    switch (error.type) {
      case "network":
        return "Votre connexion internet a été interrompue. Vérifiez votre connexion réseau et réessayez.";
      case "supabase":
        return "Le serveur est temporairement indisponible. Nous tentons de rétablir la connexion automatiquement.";
      case "auth":
        return "Votre session a expiré. Veuillez vous reconnecter pour continuer.";
      default:
        return "Une erreur de connexion s'est produite. Veuillez réessayer.";
    }
  };

  const getRetryMessage = () => {
    if (isRetrying) {
      return `Tentative de reconnexion ${error.retryCount}/5...`;
    }

    if (countdown > 0) {
      return `Prochaine tentative automatique dans ${countdown}s`;
    }

    return 'Cliquez sur "Réessayer" pour tenter une nouvelle connexion';
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-8">
        {/* Icon */}
        <div className="flex justify-center mb-6">{getErrorIcon()}</div>

        {/* Title */}
        <h1 className="text-2xl font-bold text-gray-900 text-center mb-4">
          {getErrorTitle()}
        </h1>

        {/* Description */}
        <p className="text-gray-600 text-center mb-6">
          {getErrorDescription()}
        </p>

        {/* Status Card */}
        <div className="bg-gray-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 mb-3">
            <Clock className="w-5 h-5 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Statut</span>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Dernière erreur:</span>
              <span className="text-gray-900">
                {error.timestamp.toLocaleTimeString("fr-FR")}
              </span>
            </div>

            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Tentatives:</span>
              <span className="text-gray-900">{error.retryCount}/5</span>
            </div>

            {lastRetryTime && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">Dernier essai:</span>
                <span className="text-gray-900">
                  {lastRetryTime.toLocaleTimeString("fr-FR")}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Retry Message */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            {isRetrying ? (
              <RefreshCw className="w-4 h-4 text-blue-600 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 text-blue-600" />
            )}
            <span className="text-sm text-blue-800">{getRetryMessage()}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={handleRetry}
            disabled={isRetrying || countdown > 0}
            className="w-full bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 disabled:cursor-not-allowed text-white py-3 px-4 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
          >
            {isRetrying ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Reconnexion en cours...
              </>
            ) : (
              <>
                <RefreshCw className="w-4 h-4" />
                Réessayer maintenant
              </>
            )}
          </button>

          <button
            onClick={() => window.location.reload()}
            className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-3 px-4 rounded-lg font-medium transition-colors"
          >
            Recharger la page
          </button>
        </div>

        {/* Help Text */}
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-500">
            Si le problème persiste, vérifiez votre connexion internet ou
            contactez le support.
          </p>
        </div>
      </div>
    </div>
  );
}
