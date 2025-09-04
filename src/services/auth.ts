import { supabase } from "@/lib/supabase";

export interface LoginCredentials {
  matricule: string;
  password: string;
}

export interface RegisterData {
  matricule: string;
  email: string;
  password: string;
  nom: string;
  prenom: string;
  fonction?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  sexe?: string;
  situation_matrimoniale?: string;
  adresse?: string;
  telephone?: string;
}

export const authService = {
  // Connexion avec matricule et mot de passe
  async login({ matricule, password }: LoginCredentials) {
    try {
      // Rechercher l'utilisateur par matricule
      const { data: userData, error: userError } = await supabase
        .from("agents")
        .select("email")
        .eq("matricule", matricule)
        .single();

      if (userError || !userData) {
        throw new Error("Matricule incorrect");
      }

      // Connexion avec email et mot de passe
      const { data, error } = await supabase.auth.signInWithPassword({
        email: userData.email,
        password: password,
      });

      if (error) throw error;
      return { user: data.user, session: data.session };
    } catch (error) {
      throw error;
    }
  },

  // Inscription d'un nouvel utilisateur
  async register(userData: RegisterData) {
    try {
      // Créer le compte d'authentification
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: userData.email,
        password: userData.password,
        options: {
          data: {
            matricule: userData.matricule,
          },
        },
      });

      if (authError) throw authError;

      // Créer l'utilisateur dans la table agents (sans spécifier l'ID)
      const { data: userRecord, error: userError } = await supabase
        .from("agents")
        .insert([
          {
            matricule: userData.matricule,
            email: userData.email,
            nom: userData.nom,
            prenom: userData.prenom,
            fonction: userData.fonction,
            date_naissance: userData.date_naissance,
            lieu_naissance: userData.lieu_naissance,
            sexe: userData.sexe,
            situation_matrimoniale: userData.situation_matrimoniale,
            adresse: userData.adresse,
            telephone: userData.telephone,
          },
        ])
        .select()
        .single();

      if (userError) throw userError;

      return { user: userRecord, session: authData.session };
    } catch (error) {
      throw error;
    }
  },

  // Déconnexion
  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  // Récupérer l'utilisateur actuel
  async getCurrentUser() {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;

      // Rechercher l'utilisateur par email dans la table agents
      const { data: userData, error } = await supabase
        .from("agents")
        .select("*")
        .eq("email", user.email)
        .single();

      if (error) throw error;
      return userData;
    } catch (error) {
      console.error("Erreur lors de la récupération de l'utilisateur:", error);
      return null;
    }
  },

  // Vérifier si l'utilisateur est connecté
  async getSession() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    return session;
  },
};
