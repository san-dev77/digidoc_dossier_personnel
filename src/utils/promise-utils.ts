/**
 * Exécute une liste de fonctions retournant des promesses avec un contrôle de concurrence.
 * Similaire à Promise.all mais limite le nombre de tâches s'exécutant simultanément.
 * 
 * @param tasks Liste de fonctions asynchrones à exécuter
 * @param limit Nombre maximum de tâches simultanées (défaut: 5)
 * @returns Un tableau des résultats dans le même ordre que les tâches
 */
export async function batchAll<T>(
  tasks: (() => Promise<T>)[],
  limit: number = 5
): Promise<T[]> {
  const results: T[] = new Array(tasks.length);
  let currentIndex = 0;

  async function runNext(): Promise<void> {
    if (currentIndex >= tasks.length) return;

    const taskIndex = currentIndex++;
    try {
      results[taskIndex] = await tasks[taskIndex]();
    } catch (error) {
      // On capture l'erreur pour ne pas bloquer les autres tâches
      // mais on pourra rejeter à la fin si nécessaire
      console.error(`Erreur batch à l'index ${taskIndex}:`, error);
      throw error;
    }
    
    await runNext();
  }

  // Lancer les premières tâches jusqu'à la limite
  const workers = Array.from(
    { length: Math.min(limit, tasks.length) },
    () => runNext()
  );

  await Promise.all(workers);
  return results;
}
