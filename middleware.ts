import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { requireAuth } from "@/lib/auth/middleware";
import { checkRateLimit, rateLimitConfigs } from "@/lib/rateLimit";

// Configuration CORS
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
  "http://127.0.0.1:3001",
  // Ajoutez ici vos domaines de production
  // 'https://votre-domaine.com',
];

const allowedMethods = ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"];

const allowedHeaders = [
  "Content-Type",
  "Authorization",
  "X-Requested-With",
  "Accept",
  "Origin",
];

export async function middleware(request: NextRequest) {
  console.log(
    "[MIDDLEWARE] ⚡ Middleware exécuté pour:",
    request.nextUrl.pathname
  );

  // Gérer uniquement les routes API
  if (request.nextUrl.pathname.startsWith("/api/")) {
    console.log(
      "[MIDDLEWARE] Route API détectée:",
      request.nextUrl.pathname,
      "Method:",
      request.method
    );
    const origin = request.headers.get("origin");
    const isAllowedOrigin = !origin || allowedOrigins.includes(origin);

    // Gérer les requêtes OPTIONS (preflight) - pas besoin d'auth pour OPTIONS
    if (request.method === "OPTIONS") {
      const response = new NextResponse(null, { status: 204 });

      // Headers CORS pour preflight
      if (isAllowedOrigin) {
        response.headers.set("Access-Control-Allow-Origin", origin!);
        response.headers.set("Access-Control-Allow-Credentials", "true");
      }
      response.headers.set(
        "Access-Control-Allow-Methods",
        allowedMethods.join(", ")
      );
      response.headers.set(
        "Access-Control-Allow-Headers",
        allowedHeaders.join(", ")
      );
      response.headers.set("Access-Control-Max-Age", "86400"); // 24 heures

      return response;
    }

    // RATE LIMITING pour les routes API (sauf login/register qui ont leur propre rate limit)
    const isAuthRoute =
      request.nextUrl.pathname.startsWith("/api/auth/login") ||
      request.nextUrl.pathname.startsWith("/api/auth/register");

    if (!isAuthRoute) {
      const rateLimitResult = checkRateLimit(request, rateLimitConfigs.api);
      if (!rateLimitResult.allowed) {
        // Ajouter les headers CORS même pour les erreurs de rate limit
        const errorResponse = rateLimitResult.response!;
        if (isAllowedOrigin) {
          errorResponse.headers.set("Access-Control-Allow-Origin", origin!);
          errorResponse.headers.set("Access-Control-Allow-Credentials", "true");
        }
        return errorResponse;
      }
    }

    // VÉRIFICATION D'AUTHENTIFICATION (sauf pour OPTIONS)
    const authResult = await requireAuth(request);
    console.log("[MIDDLEWARE] Auth result:", {
      authorized: authResult.authorized,
      pathname: request.nextUrl.pathname,
      method: request.method,
    });

    if (!authResult.authorized) {
      console.log("[MIDDLEWARE] ❌ Accès refusé - pas autorisé pour:", request.nextUrl.pathname);
      // Ajouter les headers CORS même pour les erreurs d'auth
      const errorResponse = authResult.response!;
      if (isAllowedOrigin) {
        errorResponse.headers.set("Access-Control-Allow-Origin", origin!);
        errorResponse.headers.set("Access-Control-Allow-Credentials", "true");
      }
      return errorResponse;
    }

    console.log("[MIDDLEWARE] ✅ Accès autorisé pour:", request.nextUrl.pathname);

    // Pour les autres méthodes, ajouter les headers CORS à la réponse
    const response = NextResponse.next();

    // Ajouter l'utilisateur dans les headers pour utilisation dans les routes
    if (authResult.user) {
      const userIdHeader =
        authResult.user.userId ?? authResult.user.agentId ?? null;
      if (userIdHeader !== null) {
        response.headers.set("x-user-id", userIdHeader.toString());
      }
      response.headers.set("x-user-matricule", authResult.user.matricule);
      if (authResult.user.role) {
        response.headers.set("x-user-role", authResult.user.role);
      }
    }

    // Headers CORS pour les requêtes normales
    if (isAllowedOrigin) {
      response.headers.set("Access-Control-Allow-Origin", origin!);
      response.headers.set("Access-Control-Allow-Credentials", "true");
    }
    response.headers.set(
      "Access-Control-Allow-Methods",
      allowedMethods.join(", ")
    );
    response.headers.set(
      "Access-Control-Allow-Headers",
      allowedHeaders.join(", ")
    );
    response.headers.set(
      "Access-Control-Expose-Headers",
      "Content-Length, Content-Type"
    );

    return response;
  }

  // Pour les routes non-API, continuer normalement
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
