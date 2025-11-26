/**
 * Gestion sécurisée des erreurs
 * Ne pas exposer les détails techniques aux clients
 */

export interface SafeErrorResponse {
  message: string;
  status: number;
  timestamp: string;
}

/**
 * Crée une réponse d'erreur sécurisée sans exposer les détails techniques
 */
export function createSafeErrorResponse(
  error: unknown,
  defaultMessage: string = "Une erreur est survenue",
  status: number = 500
): SafeErrorResponse {
  // Logger l'erreur complète côté serveur (pour debugging)
  if (error instanceof Error) {
    console.error("[ERROR]", {
      message: error.message,
      stack: error.stack,
      name: error.name,
    });
  } else {
    console.error("[ERROR]", error);
  }

  // Retourner uniquement un message générique au client
  return {
    message: defaultMessage,
    status,
    timestamp: new Date().toISOString(),
  };
}

/**
 * Retourne une NextResponse avec une erreur sécurisée
 */
export function createErrorResponse(
  error: unknown,
  defaultMessage: string = "Une erreur est survenue",
  status: number = 500
) {
  const safeError = createSafeErrorResponse(error, defaultMessage, status);
  return Response.json(
    { message: safeError.message, timestamp: safeError.timestamp },
    { status: safeError.status }
  );
}
