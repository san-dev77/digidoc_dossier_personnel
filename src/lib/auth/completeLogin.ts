import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateToken } from "@/lib/auth/jwt";
import { createSession } from "@/lib/auth/sessions";
import { getNumberSetting } from "@/lib/settings";

export interface LoginableUser {
  id: number;
  agent_id: number | null;
  username: string;
  email: string;
  agents: { matricule: string } | null;
  roles: { code: string };
}

/**
 * Étape finale commune à toute connexion réussie (avec ou sans MFA) :
 * crée la session suivie en base, met à jour les compteurs de connexion,
 * et émet un access token de courte durée (borné par le délai d'inactivité
 * configuré — la durée max de session, elle, vit sur la session elle-même).
 */
export async function issueSessionForUser(
  utilisateur: LoginableUser,
  req: NextRequest
): Promise<string> {
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ipAddress =
    forwardedFor?.split(",")[0]?.trim() ||
    req.headers.get("x-real-ip") ||
    null;
  const userAgent = req.headers.get("user-agent");

  const { jti } = await createSession(utilisateur.id, {
    ipAddress,
    userAgent,
  });

  await prisma.utilisateurs.update({
    where: { id: utilisateur.id },
    data: {
      derniere_connexion: new Date(),
      nombre_connexions: { increment: 1 },
    },
  });
  await prisma.connexion_logs.create({
    data: { utilisateur_id: utilisateur.id },
  });

  const idleTimeoutMinutes = await getNumberSetting(
    "security.idleTimeoutMinutes"
  );

  return generateToken(
    {
      userId: utilisateur.id,
      agentId: utilisateur.agent_id || undefined,
      matricule: utilisateur.agents?.matricule || utilisateur.username,
      email: utilisateur.email,
      role: utilisateur.roles.code,
      jti,
    },
    `${idleTimeoutMinutes}m`
  );
}
