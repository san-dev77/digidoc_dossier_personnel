"use client";

import { useState, useEffect } from "react";
import {
  Wifi,
  WifiOff,
  RefreshCw,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/lib/supabase";

interface ConnectionStatusProps {
  onConnectionRestored?: () => void;
}

export default function ConnectionStatus({
  onConnectionRestored,
}: ConnectionStatusProps) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSupabaseConnected, setIsSupabaseConnected] = useState(true);
  const [isChecking, setIsChecking] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [showReconnectModal, setShowReconnectModal] = useState(false);

  // Vérifier le statut de connexion internet
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Vérifier l'état initial
    setIsOnline(navigator.onLine);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  // Vérifier la connexion Supabase
  const checkSupabaseConnection = async () => {
    try {
      setIsChecking(true);
      const { data, error } = await supabase
        .from("agents")
        .select("id")
        .limit(1);

      if (error) throw error;

      setIsSupabaseConnected(true);
      setRetryCount(0);
      setShowReconnectModal(false);

      if (onConnectionRestored) {
        onConnectionRestored();
      }
    } catch (error) {
      console.error("Erreur de connexion Supabase:", error);
      setIsSupabaseConnected(false);
      setShowReconnectModal(true);
    } finally {
      setIsChecking(false);
    }
  };

  // Auto-retry avec backoff exponentiel
  useEffect(() => {
    if (!isSupabaseConnected && isOnline && retryCount < 5) {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 30000); // Max 30s
      const timer = setTimeout(() => {
        setRetryCount((prev) => prev + 1);
        checkSupabaseConnection();
      }, delay);

      return () => clearTimeout(timer);
    }
  }, [isSupabaseConnected, isOnline, retryCount]);

  // Ne pas tester automatiquement au démarrage pour éviter les conflits avec AuthGuard
  // La connexion sera testée lors des premières requêtes

  const handleManualRetry = () => {
    setRetryCount(0);
    checkSupabaseConnection();
  };

  // Indicateur de statut dans la barre de navigation
  if (isOnline && isSupabaseConnected) {
    return (
      <div className="flex items-center gap-2 text-green-600">
        <CheckCircle className="w-4 h-4" />
        <span className="text-xs font-medium">Connecté</span>
      </div>
    );
  }

  if (!isOnline) {
    return (
      <div className="flex items-center gap-2 text-red-600">
        <WifiOff className="w-4 h-4" />
        <span className="text-xs font-medium">Hors ligne</span>
      </div>
    );
  }

  if (!isSupabaseConnected) {
    return (
      <div className="flex items-center gap-2 text-orange-600">
        <AlertCircle className="w-4 h-4" />
        <span className="text-xs font-medium">Connexion perdue</span>
      </div>
    );
  }

  return null;
}
