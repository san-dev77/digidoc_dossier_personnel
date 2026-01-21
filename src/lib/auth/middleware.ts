import { NextRequest, NextResponse } from "next/server";
import { verifyTokenEdge, extractTokenFromRequest } from "./jwt-edge";

// Routes publiques qui ne nécessitent pas d'authentification
const publicRoutes = ["/api/auth/login", "/api/auth/register", "/api/agent-rubriques"];

// Routes administratives qui nécessitent le rôle admin
// Note: Les routes migration et database-schema ont été supprimées pour des raisons de sécurité
const adminRoutes: string[] = [];

/**
 * Middleware d'authentification pour protéger les routes API
 * Version async pour supporter jose (Edge Runtime compatible)
 */
export async function requireAuth(request: NextRequest): Promise<{
  authorized: boolean;
  response?: NextResponse;
  user?: {
    userId?: number;
    agentId?: number;
    matricule: string;
    email?: string;
    role?: string;
  };
}> {
  const pathname = request.nextUrl.pathname;

  // Routes publiques : pas besoin d'authentification
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return { authorized: true };
  }

  // Extraire le token
  const token = extractTokenFromRequest(request);
  console.log(
    "[AUTH] Token extrait:",
    token ? "présent" : "absent",
    "pour route:",
    pathname
  );

  if (!token) {
    console.log("[AUTH] ❌ Pas de token pour route:", pathname);
    return {
      authorized: false,
      response: NextResponse.json(
        { message: "Token d'authentification manquant" },
        { status: 401 }
      ),
    };
  }

  // Vérifier le token (async avec jose)
  const payload = await verifyTokenEdge(token);

  if (!payload) {
    return {
      authorized: false,
      response: NextResponse.json(
        { message: "Token invalide ou expiré" },
        { status: 401 }
      ),
    };
  }

  // Vérifier les routes admin
  if (adminRoutes.some((route) => pathname.startsWith(route))) {
    if (payload.role !== "admin") {
      return {
        authorized: false,
        response: NextResponse.json(
          { message: "Accès refusé : droits administrateur requis" },
          { status: 403 }
        ),
      };
    }
  }

  return {
    authorized: true,
    user: {
      userId: payload.userId,
      agentId: payload.agentId,
      matricule: payload.matricule,
      email: payload.email,
      role: payload.role,
    },
  };
}

