"use client";

import { useState } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useConnectionError } from "@/contexts/ConnectionErrorContext";

export default function ConnectionTest() {
  const [isSimulating, setIsSimulating] = useState(false);
  const { simulateError } = useConnectionError();

  const simulateConnectionError = () => {
    setIsSimulating(true);

    // Simuler directement une erreur de connexion
    simulateError("network");

    // Arrêter la simulation après 10 secondes
    setTimeout(() => {
      setIsSimulating(false);
    }, 10000);
  };

  const simulateSupabaseError = () => {
    simulateError("supabase");
  };

  const simulateAuthError = () => {
    simulateError("auth");
  };

  const testErrorPage = () => {
    simulateError("network", 3); // Force retryCount = 3 pour afficher directement la page
  };

  const simulateOffline = () => {
    // Simuler un état hors ligne
    Object.defineProperty(navigator, "onLine", {
      writable: true,
      value: false,
    });

    // Déclencher l'événement offline
    window.dispatchEvent(new Event("offline"));

    // Restaurer après 5 secondes
    setTimeout(() => {
      Object.defineProperty(navigator, "onLine", {
        writable: true,
        value: true,
      });
      window.dispatchEvent(new Event("online"));
    }, 5000);
  };

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="bg-white rounded-lg shadow-lg p-4 border border-gray-200">
        <h3 className="text-sm font-medium text-gray-900 mb-3">
          Test de Connexion
        </h3>

        <div className="space-y-2">
          <button
            onClick={simulateConnectionError}
            disabled={isSimulating}
            className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white px-3 py-2 rounded text-xs font-medium transition-colors flex items-center gap-2"
          >
            <WifiOff className="w-3 h-3" />
            Erreur Réseau
          </button>

          <button
            onClick={simulateSupabaseError}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white px-3 py-2 rounded text-xs font-medium transition-colors flex items-center gap-2"
          >
            <WifiOff className="w-3 h-3" />
            Erreur Supabase
          </button>

          <button
            onClick={simulateAuthError}
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-2 rounded text-xs font-medium transition-colors flex items-center gap-2"
          >
            <WifiOff className="w-3 h-3" />
            Erreur Auth
          </button>

          <button
            onClick={simulateOffline}
            className="w-full bg-gray-500 hover:bg-gray-600 text-white px-3 py-2 rounded text-xs font-medium transition-colors flex items-center gap-2"
          >
            <Wifi className="w-3 h-3" />
            Hors Ligne
          </button>

          <button
            onClick={testErrorPage}
            className="w-full bg-purple-500 hover:bg-purple-600 text-white px-3 py-2 rounded text-xs font-medium transition-colors flex items-center gap-2"
          >
            <WifiOff className="w-3 h-3" />
            Test Page Erreur
          </button>
        </div>

        {isSimulating && (
          <p className="text-xs text-gray-500 mt-2">
            Simulation en cours... (10s)
          </p>
        )}
      </div>
    </div>
  );
}
