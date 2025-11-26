import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "./middleware";

/**
 * Wrapper pour protéger une route API
 * Utilisez cette fonction pour protéger vos routes API
 * 
 * @example
 * export async function GET(request: NextRequest) {
 *   const authResult = await protectRoute(request);
 *   if (!authResult.authorized) {
 *     return authResult.response;
 *   }
 *   // Votre code ici avec authResult.user disponible
 * }
 */
export async function protectRoute(request: NextRequest): Promise<{
  authorized: boolean;
  response?: NextResponse;
  user?: { agentId: number; matricule: string; email?: string; role?: string };
}> {
  return requireAuth(request);
}

/**
 * Helper pour protéger une route API de manière simple
 * Retourne directement la réponse d'erreur si non autorisé
 */
export function withAuth(
  handler: (
    request: NextRequest,
    user: { agentId: number; matricule: string; email?: string; role?: string }
  ) => Promise<NextResponse>
) {
  return async (request: NextRequest) => {
    const authResult = requireAuth(request);
    
    if (!authResult.authorized) {
      return authResult.response!;
    }

    if (!authResult.user) {
      return NextResponse.json(
        { message: "Utilisateur non trouvé" },
        { status: 401 }
      );
    }

    return handler(request, authResult.user);
  };
}

