"use client";

import { useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

// Bien en-dessous du seuil d'inactivité par défaut (20 min) pour laisser
// de la marge tout en restant peu bavard.
const REFRESH_INTERVAL_MS = 5 * 60 * 1000;

/**
 * Rafraîchit silencieusement l'access token tant que l'onglet est visible.
 * Si le rafraîchissement échoue (session expirée, révoquée, inactivité
 * dépassée), déconnecte proprement et renvoie vers /login.
 */
export function useSessionRefresh() {
  const router = useRouter();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const refresh = useCallback(async () => {
    const token = sessionStorage.getItem("auth-token");
    if (!token) return;

    try {
      const res = await fetch("/api/auth/refresh", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        console.warn("[SESSION] Rafraîchissement refusé, déconnexion.");
        sessionStorage.removeItem("auth-token");
        sessionStorage.removeItem("user");
        clearAuth();
        router.push("/login");
        return;
      }

      const data = await res.json();
      if (data.token) {
        sessionStorage.setItem("auth-token", data.token);
      }
    } catch (error) {
      // Erreur réseau ponctuelle : on retentera au prochain intervalle,
      // pas besoin de déconnecter l'utilisateur pour ça.
      console.warn("[SESSION] Erreur réseau lors du rafraîchissement:", error);
    }
  }, [router, clearAuth]);

  useEffect(() => {
    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [refresh]);
}
