import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

const JWT_SECRET =
  process.env.JWT_SECRET || "changez-moi-en-production-urgence";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JWTPayload {
  agentId: number;
  matricule: string;
  email?: string;
  role?: string;
}

/**
 * Génère un token JWT pour un agent
 */
export function generateToken(payload: JWTPayload): string {
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });
}

/**
 * Vérifie et décode un token JWT
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    return decoded;
  } catch (error) {
    console.error("Erreur de vérification du token:", error);
    return null;
  }
}

/**
 * Extrait le token depuis les headers de la requête
 */
export function extractTokenFromRequest(
  request: NextRequest | Request
): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  // Format: "Bearer <token>"
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0] !== "Bearer") {
    return null;
  }

  return parts[1];
}
