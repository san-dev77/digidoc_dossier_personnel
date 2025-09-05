/**
 * Formate une date de manière cohérente entre le serveur et le client
 * pour éviter les erreurs d'hydratation
 */
export function formatDate(dateString: string): string {
  const date = new Date(dateString);

  // Utilise un formatage simple qui est cohérent entre serveur et client
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();

  return `${day}/${month}/${year}`;
}

/**
 * Formate une date avec l'heure
 */
export function formatDateTime(dateString: string): string {
  const date = new Date(dateString);

  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const year = date.getFullYear();
  const hours = date.getHours().toString().padStart(2, "0");
  const minutes = date.getMinutes().toString().padStart(2, "0");

  return `${day}/${month}/${year} ${hours}:${minutes}`;
}
