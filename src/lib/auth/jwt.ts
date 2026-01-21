import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import type { NextRequest } from "next/server";

const JWT_SECRET: Secret =
  (process.env.JWT_SECRET as Secret) || "changez-moi-en-production-urgence";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";

export interface JWTPayload {
  // Compte utilisateur (nouveau système)
  userId?: number;

  // Agent lié (optionnel) ou legacy (ancien système)
  agentId?: number;
  matricule: string;
  email?: string;
  role?: string;
}

/**
 * Génère un token JWT (utilisateur ou agent legacy)
 */
export function generateToken(payload: JWTPayload): string {
  const options: SignOptions = {
    // jsonwebtoken v9 typage strict: expiresIn est un StringValue (ms) ou number
    expiresIn: JWT_EXPIRES_IN as SignOptions["expiresIn"],
  };
  return jwt.sign(payload, JWT_SECRET, options);
}

/**
 * Vérifie et décode un token JWT
 */
export function verifyToken(token: string): JWTPayload | null {
  try {
    console.log("[JWT] Vérification du token...");
    console.log("[JWT] JWT_SECRET utilisé:", JWT_SECRET ? "défini" : "NON DÉFINI");
    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    console.log("[JWT] Token vérifié avec succès, matricule:", decoded.matricule);
    return decoded;
  } catch (error) {
    console.error("[JWT] ❌ Erreur de vérification:", error);
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
