import { useAuthStore } from "@/store/authStore";

export const useUser = () => {
  const appUser = useAuthStore((state) => state.appUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  return {
    user: appUser,
    isAuthenticated,
    // Propriétés dérivées pour faciliter l'utilisation
    matricule: appUser?.matricule,
    nom: appUser?.nom, // Nom complet
    prenom: appUser?.prenom, // Vide maintenant
    email: appUser?.email,
    fonction: appUser?.fonction,
    fullName: appUser?.nom || "", // Le nom est déjà complet
  };
};
