/**
 * Point d'entrée d'observabilité Next.js.
 * `onRequestError` est appelé automatiquement par Next.js pour toute erreur
 * non interceptée dans une route, un composant serveur ou le middleware —
 * ça donne une capture d'erreurs globale sans avoir à instrumenter chaque route.
 */
export async function onRequestError(
  error: unknown,
  request: {
    path: string;
    method: string;
    headers: Record<string, string | string[] | undefined>;
  },
  context: {
    routerKind: string;
    routePath: string;
    routeType: string;
  }
) {
  const meta = {
    path: request.path,
    method: request.method,
    routePath: context.routePath,
    routeType: context.routeType,
    routerKind: context.routerKind,
    stack: error instanceof Error ? error.stack : undefined,
  };
  const message = error instanceof Error ? error.message : String(error);

  // `logger.ts` utilise `fs`/`path` (Node uniquement). Le check ci-dessous
  // sur NEXT_RUNTIME est reconnu au moment du build par Next.js pour éliminer
  // cette branche du bundle Edge — sans lui, l'import casse le middleware.
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { logger } = await import("@/lib/logger");
    logger.error(message, { context: "onRequestError", meta });
  } else {
    console.error("[onRequestError][edge]", message, meta);
  }
}
