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
    // Rafraichissement immediat au montage. `DashboardLayout` n'est pas un
    // layout Next.js mais un composant importe par chaque page : il est donc
    // demonte puis remonte a chaque navigation, ce qui remettait le
    // setInterval a zero. Un utilisateur qui changeait de page plus souvent
    // que l'intervalle ne declenchait jamais le moindre rafraichissement, et
    // son token expirait au bout de 20 minutes en pleine session active.
    refresh();

    const interval = setInterval(() => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    }, REFRESH_INTERVAL_MS);

    // Retour sur l'onglet apres une mise en veille : on resynchronise tout de
    // suite plutot que d'attendre le prochain tick.
    const onVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        refresh();
      }
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, [refresh]);
}
