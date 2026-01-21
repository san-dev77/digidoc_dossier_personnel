/**
 * JWT verification for Edge Runtime (middleware)
 * Uses 'jose' library which is compatible with Edge Runtime
 */
import * as jose from "jose";

const JWT_SECRET = process.env.JWT_SECRET || "changez-moi-en-production-urgence";

export interface JWTPayload {
  userId?: number;
  agentId?: number;
  matricule: string;
  email?: string;
  role?: string;
}

/**
 * Vérifie un token JWT dans le Edge Runtime
 */
export async function verifyTokenEdge(token: string): Promise<JWTPayload | null> {
  try {
    console.log("[JWT-EDGE] Vérification du token...");
    const secret = new TextEncoder().encode(JWT_SECRET);
    const { payload } = await jose.jwtVerify(token, secret);
    console.log("[JWT-EDGE] Token vérifié avec succès, matricule:", payload.matricule);
    return payload as unknown as JWTPayload;
  } catch (error) {
    console.error("[JWT-EDGE] ❌ Erreur de vérification:", error);
    return null;
  }
}

/**
 * Extrait le token des headers de la requête
 */
export function extractTokenFromRequest(
  request: Request
): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}
