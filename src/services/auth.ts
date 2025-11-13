// Auth local via API Next.js

export interface LoginCredentials {
  matricule: string;
  password: string;
}

export interface RegisterData {
  matricule: string;
  email: string;
  password: string;
  nom_complet: string; // Interface utilise "nom_complet"
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
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricule, password }),
    });
    if (!res.ok) {
      let detail = "Erreur serveur";
      try {
        const data = await res.json();
        detail = data?.detail || data?.message || detail;
      } catch {}
      if (res.status === 404)
        throw new Error(detail || "Matricule ou mot de passe invalide");
      throw new Error(detail);
    }
    const agent = await res.json();
    return { user: agent, session: null };
  },

  // Inscription d'un nouvel utilisateur
  async register(userData: RegisterData) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    if (!res.ok) {
      let detail = "Erreur serveur";
      try {
        const data = await res.json();
        detail = data?.detail || data?.message || detail;
      } catch {}
      if (res.status === 409)
        throw new Error(detail || "Matricule déjà utilisé");
      throw new Error(detail);
    }
    const agent = await res.json();
    return { user: agent, session: null };
  },

  // Déconnexion
  async logout() {
    return;
  },

  // Récupérer l'utilisateur actuel (depuis sessionStorage)
  async getCurrentUser() {
    if (typeof window === "undefined") return null;
    try {
      const sessionData = sessionStorage.getItem("auth-session");
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        return parsed.state?.appUser || null;
      }
    } catch (error) {
      console.error("Erreur lors de la récupération de la session:", error);
    }
    return null;
  },

  // Vérifier si l'utilisateur est connecté (depuis sessionStorage)
  async getSession() {
    if (typeof window === "undefined") return null;
    try {
      const sessionData = sessionStorage.getItem("auth-session");
      if (sessionData) {
        const parsed = JSON.parse(sessionData);
        const appUser = parsed.state?.appUser;
        if (appUser) {
          return { user: appUser };
        }
      }
    } catch (error) {
      console.error("Erreur lors de la vérification de la session:", error);
    }
    return null;
  },
};
