import { NextRequest } from "next/server";

/**
 * Récupère les informations de l'utilisateur depuis les headers de la requête
 * (ajoutés par le middleware d'authentification)
 */
export function getUserFromRequest(request: NextRequest): {
  agentId: number;
  matricule: string;
  email?: string;
  role?: string;
} | null {
  const agentId = request.headers.get("x-user-id");
  const matricule = request.headers.get("x-user-matricule");
  const role = request.headers.get("x-user-role");

  if (!agentId || !matricule) {
    return null;
  }

  return {
    agentId: parseInt(agentId, 10),
    matricule,
    email: request.headers.get("x-user-email") || undefined,
    role: role || undefined,
  };
}

