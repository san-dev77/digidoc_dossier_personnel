import { useState, useEffect } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { authService, RegisterData } from "@/services/auth";
import { Agent } from "@/lib/supabase";

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [appUser, setAppUser] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return; // Attendre l'hydratation

    let mounted = true;

    // Récupérer la session initiale
    const getInitialSession = async () => {
      try {
        console.log("🔍 Vérification de la session initiale...");
        const session = await authService.getSession();

        if (mounted) {
          if (session?.user) {
            console.log("✅ Session trouvée:", session.user.email);
            setUser(session.user);

            try {
              const userData = await authService.getCurrentUser();
              if (mounted && userData) {
                console.log("✅ Données utilisateur récupérées:", userData);
                setAppUser(userData);
              }
            } catch (userError) {
              console.error(
                "❌ Erreur lors de la récupération des données utilisateur:",
                userError
              );
              if (mounted) {
                setAppUser(null);
              }
            }
          } else {
            console.log("❌ Aucune session trouvée");
          }
        }
      } catch (error) {
        console.error(
          "❌ Erreur lors de la récupération de la session:",
          error
        );
      } finally {
        if (mounted) {
          console.log("🏁 Fin de la vérification initiale");
          setLoading(false);
        }
      }
    };

    getInitialSession();

    // Écouter les changements d'authentification
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log(
        "🔄 Changement d'état d'authentification:",
        event,
        session?.user?.email
      );

      if (mounted) {
        // Ne pas remettre loading à true si c'est juste un changement d'état
        // et que l'utilisateur est déjà connecté
        if (event === "SIGNED_IN" && session?.user) {
          setUser(session.user);
          try {
            const userData = await authService.getCurrentUser();
            if (mounted && userData) {
              setAppUser(userData);
            }
          } catch (error) {
            console.error(
              "❌ Erreur lors de la récupération des données utilisateur:",
              error
            );
            if (mounted) {
              setAppUser(null);
            }
          }
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setAppUser(null);
        }
        // Ne pas toucher à loading ici
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [isHydrated]);

  const login = async (matricule: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔐 Tentative de connexion pour le matricule:", matricule);

      const result = await authService.login({ matricule, password });

      if (result.user) {
        setUser(result.user);
        try {
          const userData = await authService.getCurrentUser();
          if (userData) {
            setAppUser(userData);
            console.log(
              "✅ Connexion réussie, utilisateur récupéré:",
              userData
            );
          }
        } catch (userError) {
          console.error(
            "❌ Erreur lors de la récupération des données utilisateur après connexion:",
            userError
          );
        }
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur de connexion";
      setError(errorMessage);
      console.error("❌ Erreur de connexion:", errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const register = async (userData: RegisterData) => {
    try {
      setLoading(true);
      setError(null);
      console.log("📝 Tentative d'inscription pour:", userData.email);

      const result = await authService.register(userData);

      if (result.user) {
        setUser(result.user);
        try {
          const userData = await authService.getCurrentUser();
          if (userData) {
            setAppUser(userData);
            console.log(
              "✅ Inscription réussie, utilisateur récupéré:",
              userData
            );
          }
        } catch (userError) {
          console.error(
            "❌ Erreur lors de la récupération des données utilisateur après inscription:",
            userError
          );
        }
      }

      return result;
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur d'inscription";
      setError(errorMessage);
      console.error("❌ Erreur d'inscription:", errorMessage);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      console.log("🚪 Déconnexion...");
      await authService.logout();
      setUser(null);
      setAppUser(null);
      console.log("✅ Déconnexion réussie");
    } catch (error) {
      console.error("❌ Erreur lors de la déconnexion:", error);
    } finally {
      setLoading(false);
    }
  };

  // Debug: afficher l'état actuel seulement côté client
  if (isHydrated) {
    console.log("🔍 État actuel useAuth:", {
      user: user?.email,
      appUser: appUser?.email,
      loading,
      error,
      isAuthenticated: !!user,
    });
  }

  return {
    user,
    appUser,
    loading: !isHydrated || loading, // Toujours loading pendant l'hydratation
    error,
    login,
    register,
    logout,
    isAuthenticated: !!user,
  };
};
