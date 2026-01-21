/**
 * Middleware pour protéger les routes API avec les permissions
 */

import { NextRequest, NextResponse } from "next/server";
import {
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
} from "./permissionService";
import { verifyToken } from "@/lib/auth/jwt";

/**
 * Extrait l'ID utilisateur du token JWT
 */
async function getUserIdFromRequest(req: NextRequest): Promise<number | null> {
  const authHeader = req.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.substring(7);
  try {
    const decoded = verifyToken(token);
    if (!decoded) return null;
    // Priorité: userId (nouveau système), sinon agentId (legacy)
    return decoded.userId ?? decoded.agentId ?? null;
  } catch {
    return null;
  }
}

/**
 * Middleware : Vérifie qu'un utilisateur a UNE permission spécifique
 */
export function requirePermission(permissionCode: string) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
    }

    const allowed = await hasPermission(userId, permissionCode);

    if (!allowed) {
      return NextResponse.json(
        {
          message: "Permission refusée",
          required: permissionCode,
        },
        { status: 403 }
      );
    }

    return null; // Permission OK, continuer
  };
}

/**
 * Middleware : Vérifie qu'un utilisateur a TOUTES les permissions données
 */
export function requireAllPermissions(permissionCodes: string[]) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
    }

    const allowed = await hasAllPermissions(userId, permissionCodes);

    if (!allowed) {
      return NextResponse.json(
        {
          message: "Permissions insuffisantes",
          required: permissionCodes,
        },
        { status: 403 }
      );
    }

    return null;
  };
}

/**
 * Middleware : Vérifie qu'un utilisateur a AU MOINS UNE des permissions données
 */
export function requireAnyPermission(permissionCodes: string[]) {
  return async (req: NextRequest): Promise<NextResponse | null> => {
    const userId = await getUserIdFromRequest(req);

    if (!userId) {
      return NextResponse.json({ message: "Non authentifié" }, { status: 401 });
    }

    const allowed = await hasAnyPermission(userId, permissionCodes);

    if (!allowed) {
      return NextResponse.json(
        {
          message: "Permission refusée - aucune permission requise trouvée",
          requiredOneOf: permissionCodes,
        },
        { status: 403 }
      );
    }

    return null;
  };
}

/**
 * Helper : Applique un middleware à une route
 *
 * Usage:
 * export async function GET(req: NextRequest) {
 *   const authError = await requirePermission('agents.read')(req);
 *   if (authError) return authError;
 *
 *   // Suite du code...
 * }
 */
export async function applyMiddleware(
  req: NextRequest,
  middleware: (req: NextRequest) => Promise<NextResponse | null>
): Promise<NextResponse | null> {
  return await middleware(req);
}
