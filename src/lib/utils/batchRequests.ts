/**
 * Utilitaire pour limiter les requêtes simultanées
 * Traite les requêtes par batch pour éviter ERR_INSUFFICIENT_RESOURCES
 */

/**
 * Exécute des promesses par batch pour éviter de surcharger le navigateur
 * @param items - Tableau d'éléments à traiter
 * @param batchSize - Nombre d'éléments à traiter simultanément (défaut: 5)
 * @param processor - Fonction qui traite un élément et retourne une promesse
 * @returns Promise qui se résout avec tous les résultats
 */
export async function processInBatches<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 5
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item) => processor(item))
    );
    results.push(...batchResults);
  }

  return results;
}

/**
 * Exécute des promesses avec un délai entre chaque batch
 * Utile pour éviter de surcharger le serveur
 */
export async function processInBatchesWithDelay<T, R>(
  items: T[],
  processor: (item: T) => Promise<R>,
  batchSize: number = 5,
  delayMs: number = 100
): Promise<R[]> {
  const results: R[] = [];

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map((item) => processor(item))
    );
    results.push(...batchResults);

    // Attendre avant le prochain batch (sauf pour le dernier)
    if (i + batchSize < items.length) {
      await new Promise((resolve) => setTimeout(resolve, delayMs));
    }
  }

  return results;
}

