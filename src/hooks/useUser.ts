import { useAuthStore } from "@/store/authStore";

export const useUser = () => {
  const appUser = useAuthStore((state) => state.appUser);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Gérer à la fois nom_complet (DB) et nom (TypeScript)
  const nomComplet = (appUser as any)?.nom_complet || appUser?.nom || "";
  
  return {
    user: appUser,
    isAuthenticated,
    // Propriétés dérivées pour faciliter l'utilisation
    matricule: appUser?.matricule,
    nom: nomComplet, // Nom complet (compatible avec nom_complet et nom)
    prenom: appUser?.prenom || "", // Vide maintenant
    email: appUser?.email,
    fonction: appUser?.fonction,
    fullName: nomComplet, // Le nom complet de l'utilisateur
  };
};
