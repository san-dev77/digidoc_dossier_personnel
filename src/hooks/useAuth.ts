import { useState, useEffect } from "react";
import { authService, RegisterData } from "@/services/auth";
import { notificationService } from "@/services/notifications";
import { useAuthStore } from "@/store/authStore";

export const useAuth = () => {
  const [isHydrated, setIsHydrated] = useState(false);
  // Évite de bloquer l'UI lors du check de session
  const [sessionChecking, setSessionChecking] = useState(false);

  // Utiliser le store Zustand
  const appUser = useAuthStore((state) => state.appUser);
  const loading = useAuthStore((state) => state.loading);
  const error = useAuthStore((state) => state.error);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const shouldCheckSession = useAuthStore((state) => state.shouldCheckSession);

  const setAppUser = useAuthStore((state) => state.setAppUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setError = useAuthStore((state) => state.setError);
  const setLastSessionCheck = useAuthStore(
    (state) => state.setLastSessionCheck
  );
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    setIsHydrated(true);
  }, []);

  useEffect(() => {
    if (!isHydrated) return;

    let mounted = true;

    // Vérifier la session seulement si nécessaire
    const checkSessionIfNeeded = async () => {
      if (!shouldCheckSession()) {
        return;
      }

      try {
        // Ne pas utiliser le loading global pour ne pas bloquer l'UI
        setSessionChecking(true);
        // Marque tout de suite un check pour éviter des checks rapprochés
        setLastSessionCheck(Date.now());

        // Vérifier si on a un utilisateur en session
        if (appUser) {
          console.log("✅ Session utilisateur trouvée en cache:", appUser);
          return;
        }

        // Si pas d'utilisateur en cache, vérifier la session côté serveur
        const session = await authService.getSession();
        if (mounted && session?.user) {
          setAppUser(session.user);
          // Envoyer une notification de connexion
          notificationService.sendLoginNotification(
            session.user.prenom || session.user.nom || "Utilisateur"
          );
        } else if (mounted) {
          clearAuth();
        }
      } catch (error) {
        console.error(
          "❌ Erreur lors de la vérification de la session:",
          error
        );
        if (mounted) {
          setError("Erreur de vérification de session");
          clearAuth();
        }
      } finally {
        if (mounted) setSessionChecking(false);
      }
    };

    checkSessionIfNeeded();

    return () => {
      mounted = false;
    };
  }, [isHydrated]); // eslint-disable-line react-hooks/exhaustive-deps
  // Note: Les fonctions du store Zustand changent à chaque rendu,
  // ce qui causerait une boucle infinie si on les incluait dans les dépendances

  const login = async (matricule: string, password: string) => {
    try {
      setLoading(true);
      setError(null);
      console.log("🔐 Tentative de connexion pour le matricule:", matricule);

      const result = await authService.login({ matricule, password });

      if (result.user) {
        setAppUser(result.user);
        setLastSessionCheck(Date.now());
        console.log(
          "✅ Connexion réussie, utilisateur stocké en session:",
          result.user
        );
        // Envoyer une notification de connexion
        notificationService.sendLoginNotification(
          result.user.prenom || result.user.nom || "Utilisateur"
        );
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
      console.log("📝 Tentative d'inscription pour:", userData.matricule);

      const result = await authService.register(userData);

      if (result.user) {
        setAppUser(result.user);
        setLastSessionCheck(Date.now());
        console.log(
          "✅ Inscription réussie, utilisateur stocké en session:",
          result.user
        );
        // Envoyer une notification de connexion
        notificationService.sendLoginNotification(
          result.user.prenom || result.user.nom || "Utilisateur"
        );
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

      // Envoyer une notification de déconnexion avant de se déconnecter
      if (appUser) {
        notificationService.sendLogoutNotification(
          appUser.prenom || appUser.nom || "Utilisateur"
        );
      }

      await authService.logout();
      clearAuth();
      console.log("✅ Déconnexion réussie");
    } catch (error) {
      console.error("❌ Erreur lors de la déconnexion:", error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour vérifier la session si nécessaire (exposée pour l'initialisation)
  const checkSessionIfNeeded = async () => {
    if (!shouldCheckSession()) {
      return;
    }

    try {
      setSessionChecking(true);
      setLastSessionCheck(Date.now());

      // Vérifier si on a un utilisateur en session
      if (appUser) {
        console.log("✅ Session utilisateur trouvée en cache:", appUser);
        return;
      }

      // Si pas d'utilisateur en cache, vérifier la session côté serveur
      const session = await authService.getSession();
      if (session?.user) {
        setAppUser(session.user);
        // Envoyer une notification de connexion
        notificationService.sendLoginNotification(
          session.user.prenom || session.user.nom || "Utilisateur"
        );
      } else {
        clearAuth();
      }
    } catch (error) {
      console.error("❌ Erreur lors de la vérification de la session:", error);
      setError("Erreur de vérification de session");
      clearAuth();
    } finally {
      setSessionChecking(false);
    }
  };

  return {
    appUser,
    loading: !isHydrated || loading || sessionChecking,
    error,
    login,
    register,
    logout,
    isAuthenticated,
    checkSessionIfNeeded,
  };
};
