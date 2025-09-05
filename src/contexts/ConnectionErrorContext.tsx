"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { supabase } from "@/lib/supabase";

export interface ConnectionError {
  type: "network" | "supabase" | "auth";
  message: string;
  timestamp: Date;
  retryCount: number;
}

interface ConnectionErrorContextType {
  connectionError: ConnectionError | null;
  isRetrying: boolean;
  retryCount: number;
  testSupabaseConnection: () => Promise<boolean>;
  retryConnection: () => Promise<boolean>;
  clearError: () => void;
  simulateError: (
    type: "network" | "supabase" | "auth",
    retryCount?: number
  ) => void;
}

const ConnectionErrorContext = createContext<
  ConnectionErrorContextType | undefined
>(undefined);

export function useConnectionError() {
  const context = useContext(ConnectionErrorContext);
  if (context === undefined) {
    throw new Error(
      "useConnectionError must be used within a ConnectionErrorProvider"
    );
  }
  return context;
}

interface ConnectionErrorProviderProps {
  children: ReactNode;
}

export function ConnectionErrorProvider({
  children,
}: ConnectionErrorProviderProps) {
  const [connectionError, setConnectionError] =
    useState<ConnectionError | null>(null);
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);

  // Intercepter les erreurs de fetch
  useEffect(() => {
    const originalFetch = window.fetch;

    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);

        // Si la réponse est ok, réinitialiser l'erreur
        if (response.ok && connectionError) {
          setConnectionError(null);
          setRetryCount(0);
        }

        return response;
      } catch (error) {
        // Analyser le type d'erreur
        if (
          error instanceof TypeError &&
          error.message.includes("Failed to fetch")
        ) {
          const isNetworkError =
            !navigator.onLine ||
            error.message.includes("ERR_INTERNET_DISCONNECTED") ||
            error.message.includes("ERR_NETWORK_CHANGED");

          if (isNetworkError) {
            setConnectionError({
              type: "network",
              message: "Connexion internet perdue",
              timestamp: new Date(),
              retryCount: retryCount + 1,
            });
          } else {
            setConnectionError({
              type: "supabase",
              message: "Connexion au serveur perdue",
              timestamp: new Date(),
              retryCount: retryCount + 1,
            });
          }
        }

        throw error;
      }
    };

    return () => {
      window.fetch = originalFetch;
    };
  }, [connectionError, retryCount]);

  // Fonction pour tester la connexion Supabase
  const testSupabaseConnection = async (): Promise<boolean> => {
    try {
      setIsRetrying(true);
      const { data, error } = await supabase
        .from("agents")
        .select("id")
        .limit(1);

      if (error) throw error;

      setConnectionError(null);
      setRetryCount(0);
      return true;
    } catch (error) {
      console.error("Test de connexion Supabase échoué:", error);
      setRetryCount((prev) => prev + 1);
      return false;
    } finally {
      setIsRetrying(false);
    }
  };

  // Fonction pour réessayer la connexion
  const retryConnection = async () => {
    const success = await testSupabaseConnection();
    if (success) {
      setConnectionError(null);
    }
    return success;
  };

  // Auto-retry avec backoff exponentiel
  useEffect(() => {
    if (connectionError && retryCount < 5) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s
      const timer = setTimeout(() => {
        testSupabaseConnection();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [connectionError, retryCount]);

  // Fonction pour simuler une erreur (pour les tests)
  const simulateError = (
    type: "network" | "supabase" | "auth" = "network",
    retryCount: number = 2
  ) => {
    setConnectionError({
      type,
      message:
        type === "network"
          ? "Connexion internet perdue"
          : type === "supabase"
          ? "Connexion au serveur perdue"
          : "Session expirée",
      timestamp: new Date(),
      retryCount,
    });
  };

  const value: ConnectionErrorContextType = {
    connectionError,
    isRetrying,
    retryCount,
    testSupabaseConnection,
    retryConnection,
    clearError: () => setConnectionError(null),
    simulateError,
  };

  return (
    <ConnectionErrorContext.Provider value={value}>
      {children}
    </ConnectionErrorContext.Provider>
  );
}
