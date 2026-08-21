import { NextRequest } from "next/server";
import { logger } from "./logger";

// `Response` (pas seulement `NextResponse`) : certaines routes renvoient
// encore `Response.json(...)` (voir src/lib/errors/safeError.ts) —
// NextResponse en hérite, donc accepter le type le plus large couvre les deux.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyRouteHandler = (req: NextRequest, ...rest: any[]) => Promise<Response> | Response;

/**
 * Enveloppe un handler de route API pour logger automatiquement :
 * la requête (succès/avertissement selon le status), sa durée, et toute
 * exception non gérée (avec la stack trace). Conserve la signature exacte
 * du handler d'origine (avec ou sans second argument `{ params }`).
 *
 * Usage : export const POST = withLogging("auth.login", async (req) => { ... });
 */
export function withLogging<T extends AnyRouteHandler>(
  routeName: string,
  handler: T
): T {
  const wrapped = async (
    req: NextRequest,
    ...rest: Parameters<T> extends [NextRequest, ...infer R] ? R : never[]
  ) => {
    const start = Date.now();
    const method = req.method;
    const url = req.nextUrl.pathname;
    const userId = req.headers.get("x-user-id") || undefined;

    try {
      const res = await handler(req, ...rest);
      const durationMs = Date.now() - start;
      const status = res.status;
      const level = status >= 500 ? "error" : status >= 400 ? "warning" : "success";

      logger[level](`${method} ${url} → ${status}`, {
        context: routeName,
        meta: { durationMs, status, userId },
      });

      return res;
    } catch (error) {
      const durationMs = Date.now() - start;
      logger.error(
        error instanceof Error ? error.message : "Erreur inconnue",
        {
          context: routeName,
          meta: {
            durationMs,
            method,
            url,
            userId,
            stack: error instanceof Error ? error.stack : undefined,
          },
        }
      );
      throw error;
    }
  };

  return wrapped as T;
}
