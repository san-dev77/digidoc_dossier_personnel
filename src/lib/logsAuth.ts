import jwt from "jsonwebtoken";
import type { NextRequest } from "next/server";

// Secret dédié à la session de consultation des logs : distinct de l'auth
// applicative pour rester accessible même si celle-ci est en panne.
const LOGS_JWT_SECRET =
  process.env.LOGS_ACCESS_PASSWORD ||
  process.env.JWT_SECRET ||
  "changez-moi-en-production-urgence";

export const LOGS_COOKIE_NAME = "logs_session";
const SESSION_DURATION = "12h";

export function createLogsSessionToken(): string {
  return jwt.sign({ scope: "logs" }, LOGS_JWT_SECRET, {
    expiresIn: SESSION_DURATION,
  });
}

export function verifyLogsSession(req: NextRequest): boolean {
  const token = req.cookies.get(LOGS_COOKIE_NAME)?.value;
  if (!token) return false;

  try {
    const decoded = jwt.verify(token, LOGS_JWT_SECRET) as { scope?: string };
    return decoded.scope === "logs";
  } catch {
    return false;
  }
}
