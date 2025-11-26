/**
 * Fonction fetch avec authentification automatique
 * Ajoute le token JWT dans les headers
 */
export async function fetchWithAuth(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const token = typeof window !== "undefined" 
    ? sessionStorage.getItem("auth-token") 
    : null;

  const headers = new Headers(options.headers);

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  return fetch(url, {
    ...options,
    headers,
  });
}

