import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import { Agent } from "@/types";

interface AuthState {
  // État de l'authentification
  appUser: Agent | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  lastSessionCheck: number | null;

  // Actions
  setAppUser: (appUser: Agent | null) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  setLastSessionCheck: (timestamp: number) => void;

  // Utilitaires
  shouldCheckSession: () => boolean;
  clearAuth: () => void;
}

type AuthPersistedState = Pick<
  AuthState,
  "appUser" | "isAuthenticated" | "lastSessionCheck"
>;

// Durée de validité du cache de session (2 minutes)
const SESSION_CACHE_DURATION = 2 * 60 * 1000;

export const useAuthStore = create<AuthState>()(
  devtools(
    persist<AuthState, [], [], AuthPersistedState>(
      (set, get) => ({
        // État initial
        appUser: null,
        loading: false,
        error: null,
        isAuthenticated: false,
        lastSessionCheck: null,

        // Actions
        setAppUser: (appUser) =>
          set({
            appUser,
            isAuthenticated: !!appUser,
            error: null,
          }),

        setLoading: (loading) => set({ loading }),

        setError: (error) => set({ error }),

        setLastSessionCheck: (timestamp) =>
          set({ lastSessionCheck: timestamp }),

        // Vérifier si on doit vérifier la session
        shouldCheckSession: () => {
          const { lastSessionCheck } = get();
          if (!lastSessionCheck) return true;
          return Date.now() - lastSessionCheck > SESSION_CACHE_DURATION;
        },

        // Nettoyer l'état d'authentification
        clearAuth: () => {
          set({
            appUser: null,
            isAuthenticated: false,
            error: null,
            lastSessionCheck: null,
          });
        },
      }),
      {
        name: "auth-session",
        storage: {
          getItem: (name) => {
            const str = sessionStorage.getItem(name);
            return str ? JSON.parse(str) : null;
          },
          setItem: (name, value) => {
            sessionStorage.setItem(name, JSON.stringify(value));
          },
          removeItem: (name) => {
            sessionStorage.removeItem(name);
          },
        },
        // Ne persister que les données essentielles
        partialize: (state) => ({
          appUser: state.appUser,
          isAuthenticated: state.isAuthenticated,
          lastSessionCheck: state.lastSessionCheck,
        }),
      }
    ),
    { name: "AuthStore" }
  )
);
