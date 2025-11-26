import { NextRequest, NextResponse } from "next/server";

/**
 * Configuration du rate limiting
 */
interface RateLimitConfig {
  maxRequests: number; // Nombre maximum de requêtes
  windowMs: number; // Fenêtre de temps en millisecondes
  message?: string; // Message d'erreur personnalisé
}

/**
 * Stockage en mémoire des tentatives par IP
 * En production, utilisez Redis ou une base de données
 */
interface AttemptRecord {
  count: number;
  resetTime: number;
  blocked: boolean;
}

const rateLimitStore = new Map<string, AttemptRecord>();

/**
 * Nettoie les entrées expirées du store (pour éviter les fuites mémoire)
 */
function cleanupExpiredEntries() {
  const now = Date.now();
  for (const [key, record] of rateLimitStore.entries()) {
    if (record.resetTime < now && !record.blocked) {
      rateLimitStore.delete(key);
    }
  }
}

/**
 * Obtient l'IP de la requête
 */
function getClientIP(request: NextRequest): string {
  // Essayer différents headers pour obtenir l'IP réel
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  const cfConnectingIP = request.headers.get("cf-connecting-ip"); // Cloudflare

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  if (realIP) {
    return realIP;
  }
  if (cfConnectingIP) {
    return cfConnectingIP;
  }

  // Fallback : utiliser l'IP de la connexion
  return request.ip || "unknown";
}

/**
 * Crée une clé unique pour le rate limiting
 */
function createKey(ip: string, path: string): string {
  return `${ip}:${path}`;
}

/**
 * Vérifie si une requête dépasse la limite
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): {
  allowed: boolean;
  remaining: number;
  resetTime: number;
  response?: NextResponse;
} {
  // Nettoyer les entrées expirées périodiquement
  if (Math.random() < 0.1) {
    // 10% de chance à chaque requête
    cleanupExpiredEntries();
  }

  const ip = getClientIP(request);
  const path = request.nextUrl.pathname;
  const key = createKey(ip, path);
  const now = Date.now();

  // Récupérer ou créer l'enregistrement
  let record = rateLimitStore.get(key);

  if (!record || record.resetTime < now) {
    // Nouvelle fenêtre de temps
    record = {
      count: 0,
      resetTime: now + config.windowMs,
      blocked: false,
    };
    rateLimitStore.set(key, record);
  }

  // Si bloqué, vérifier si le blocage est toujours actif
  if (record.blocked && record.resetTime > now) {
    const remainingSeconds = Math.ceil((record.resetTime - now) / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      response: NextResponse.json(
        {
          message:
            config.message ||
            `Trop de tentatives. Réessayez dans ${remainingSeconds} seconde(s).`,
          retryAfter: remainingSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": remainingSeconds.toString(),
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(record.resetTime).toISOString(),
          },
        }
      ),
    };
  }

  // Réinitialiser si le blocage est expiré
  if (record.blocked && record.resetTime <= now) {
    record.blocked = false;
    record.count = 0;
    record.resetTime = now + config.windowMs;
  }

  // Incrémenter le compteur
  record.count++;

  // Vérifier si la limite est dépassée
  if (record.count > config.maxRequests) {
    record.blocked = true;
    const remainingSeconds = Math.ceil(config.windowMs / 1000);
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
      response: NextResponse.json(
        {
          message:
            config.message ||
            `Trop de tentatives. Réessayez dans ${remainingSeconds} seconde(s).`,
          retryAfter: remainingSeconds,
        },
        {
          status: 429,
          headers: {
            "Retry-After": remainingSeconds.toString(),
            "X-RateLimit-Limit": config.maxRequests.toString(),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(record.resetTime).toISOString(),
          },
        }
      ),
    };
  }

  // Requête autorisée
  const remaining = Math.max(0, config.maxRequests - record.count);
  return {
    allowed: true,
    remaining,
    resetTime: record.resetTime,
  };
}

/**
 * Configuration par défaut pour différentes routes
 */
export const rateLimitConfigs = {
  // Routes de login : 5 tentatives par 15 minutes
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 15 minutes
    message: "Trop de tentatives de connexion. Réessayez dans quelques minutes.",
  },
  // Routes de register : 3 tentatives par heure
  register: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 1 heure
    message: "Trop de tentatives d'inscription. Réessayez dans une heure.",
  },
  // Routes API générales : 100 requêtes par minute
  api: {
    maxRequests: 100,
    windowMs: 60 * 1000, // 1 minute
    message: "Trop de requêtes. Réessayez dans quelques secondes.",
  },
} as const;

/**
 * Helper pour appliquer le rate limiting dans une route
 */
export function withRateLimit(
  config: RateLimitConfig,
  handler: (request: NextRequest) => Promise<NextResponse>
) {
  return async (request: NextRequest): Promise<NextResponse> => {
    const rateLimitResult = checkRateLimit(request, config);

    if (!rateLimitResult.allowed) {
      return rateLimitResult.response!;
    }

    // Ajouter les headers de rate limit à la réponse
    const response = await handler(request);
    response.headers.set(
      "X-RateLimit-Limit",
      config.maxRequests.toString()
    );
    response.headers.set(
      "X-RateLimit-Remaining",
      rateLimitResult.remaining.toString()
    );
    response.headers.set(
      "X-RateLimit-Reset",
      new Date(rateLimitResult.resetTime).toISOString()
    );

    return response;
  };
}

