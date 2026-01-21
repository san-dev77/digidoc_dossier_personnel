// Auth local via API Next.js

export interface LoginCredentials {
  matricule: string;
  password: string;
}

export interface RegisterData {
  matricule: string;
  email?: string; // Email optionnel
  // Le système actuel ne crée plus d'agents avec mot de passe.
  // (Les accès à l'app passent par la table utilisateurs.)
  password?: string;
  nom_complet: string; // Interface utilise "nom_complet"
  fonction?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  sexe?: string;
  situation_matrimoniale?: string;
  adresse?: string;
  telephone?: string;
}

export interface RateLimitInfo {
  limit: number;
  remaining: number;
  resetTime: string;
  retryAfter?: number;
}

/**
 * Type d'erreur qui peut contenir des informations de rate limiting
 */
export interface AuthError extends Error {
  rateLimitInfo?: RateLimitInfo;
}

export const authService = {
  // Connexion avec matricule et mot de passe
  async login({ matricule, password }: LoginCredentials) {
    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matricule, password }),
    });
    
    // Extraire les informations de rate limiting (toujours, même en cas d'erreur)
    const rateLimitInfo: RateLimitInfo | null = res.headers.get("X-RateLimit-Limit")
      ? {
          limit: parseInt(res.headers.get("X-RateLimit-Limit") || "0"),
          remaining: parseInt(res.headers.get("X-RateLimit-Remaining") || "0"),
          resetTime: res.headers.get("X-RateLimit-Reset") || "",
          retryAfter: res.headers.get("Retry-After")
            ? parseInt(res.headers.get("Retry-After") || "0")
            : undefined,
        }
      : null;

    if (!res.ok) {
      let detail = "Erreur serveur";
      try {
        const data = await res.json();
        detail = data?.message || data?.detail || detail;
        
        // Si c'est une erreur 429 (rate limit), lancer une erreur spéciale
        if (res.status === 429) {
          const error = new Error(detail) as Error & { rateLimitInfo?: RateLimitInfo };
          error.rateLimitInfo = rateLimitInfo || undefined;
          throw error;
        }
      } catch (e) {
        // Si c'est déjà notre erreur de rate limit, la relancer
        if (e instanceof Error && (e as any).rateLimitInfo) {
          throw e;
        }
      }
      
      // Pour les autres erreurs, créer une erreur avec les infos de rate limit
      const error = new Error(detail || (res.status === 401 ? "Matricule ou mot de passe invalide" : "Erreur serveur")) as Error & { rateLimitInfo?: RateLimitInfo };
      error.rateLimitInfo = rateLimitInfo || undefined;
      throw error;
    }
    const data = await res.json();
    // Stocker le token dans sessionStorage (expire à la fermeture de l'onglet)
    if (data.token && typeof window !== "undefined") {
      sessionStorage.setItem("auth-token", data.token);
    }
    // Retourner l'agent sans le token, avec les infos de rate limit
    const { token: _, ...agent } = data;
    return { user: agent, session: null, rateLimitInfo: rateLimitInfo || undefined };
  },

  // Inscription d'un nouvel utilisateur
  async register(userData: RegisterData) {
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(userData),
    });
    
    // Extraire les informations de rate limiting (toujours, même en cas d'erreur)
    const rateLimitInfo: RateLimitInfo | null = res.headers.get("X-RateLimit-Limit")
      ? {
          limit: parseInt(res.headers.get("X-RateLimit-Limit") || "0"),
          remaining: parseInt(res.headers.get("X-RateLimit-Remaining") || "0"),
          resetTime: res.headers.get("X-RateLimit-Reset") || "",
          retryAfter: res.headers.get("Retry-After")
            ? parseInt(res.headers.get("Retry-After") || "0")
            : undefined,
        }
      : null;

    if (!res.ok) {
      let detail = "Erreur serveur";
      try {
        const data = await res.json();
        detail = data?.message || data?.detail || detail;
        
        // Si c'est une erreur 429 (rate limit), lancer une erreur spéciale
        if (res.status === 429) {
          const error = new Error(detail) as Error & { rateLimitInfo?: RateLimitInfo };
          error.rateLimitInfo = rateLimitInfo || undefined;
          throw error;
        }
      } catch (e) {
        // Si c'est déjà notre erreur de rate limit, la relancer
        if (e instanceof Error && (e as any).rateLimitInfo) {
          throw e;
        }
      }
      
      // Pour les autres erreurs, créer une erreur avec les infos de rate limit
      const error = new Error(detail || (res.status === 409 ? "Matricule déjà utilisé" : "Erreur serveur")) as Error & { rateLimitInfo?: RateLimitInfo };
      error.rateLimitInfo = rateLimitInfo || undefined;
      throw error;
    }
    const data = await res.json();
    // Stocker le token dans sessionStorage (expire à la fermeture de l'onglet)
    if (data.token && typeof window !== "undefined") {
      sessionStorage.setItem("auth-token", data.token);
    }
    // Retourner l'agent sans le token, avec les infos de rate limit
    const { token: _, ...agent } = data;
    return { user: agent, session: null, rateLimitInfo: rateLimitInfo || undefined };
  },

  // Déconnexion
  async logout() {
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("auth-token");
    }
    return;
  },

  // Récupérer le token
  getToken(): string | null {
    if (typeof window === "undefined") return null;
    return sessionStorage.getItem("auth-token");
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
