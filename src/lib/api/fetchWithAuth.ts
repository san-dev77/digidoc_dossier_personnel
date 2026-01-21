/**
 * Fonction fetch avec authentification automatique
 * Ajoute le token JWT dans les headers
 * Gère correctement le SSR vs client-side rendering
 */

// Petit délai pour s'assurer que sessionStorage est prêt après navigation
function waitForToken(maxAttempts = 5, delay = 50): Promise<string | null> {
  return new Promise((resolve) => {
    let attempts = 0;
    
    const check = () => {
      if (typeof window === "undefined") {
        resolve(null);
        return;
      }
      
      const token = sessionStorage.getItem("auth-token");
      if (token || attempts >= maxAttempts) {
        resolve(token);
        return;
      }
      
      attempts++;
      setTimeout(check, delay);
    };
    
    check();
  });
}

export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  // Attendre que le token soit disponible (gère le timing après navigation)
  const token = await waitForToken();

  console.log("[fetchWithAuth] URL:", url, "Token présent:", !!token);

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}
