import { NextRequest, NextResponse } from "next/server";
import { createLogsSessionToken, LOGS_COOKIE_NAME } from "@/lib/logsAuth";

/**
 * POST /api/logs-auth
 * Authentification dédiée à la consultation des logs — indépendante du
 * système de connexion de l'application (mot de passe séparé, stocké dans
 * LOGS_ACCESS_PASSWORD), pour rester accessible même si l'auth principale
 * est en panne.
 */
export async function POST(req: NextRequest) {
  const expected = process.env.LOGS_ACCESS_PASSWORD;

  if (!expected) {
    return NextResponse.json(
      {
        message:
          "Accès aux logs non configuré : définissez LOGS_ACCESS_PASSWORD dans .env",
      },
      { status: 500 }
    );
  }

  try {
    const { password } = await req.json();

    if (password !== expected) {
      return NextResponse.json(
        { message: "Mot de passe incorrect" },
        { status: 401 }
      );
    }

    const token = createLogsSessionToken();
    const res = NextResponse.json({ success: true });
    res.cookies.set(LOGS_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 12,
      path: "/",
    });
    return res;
  } catch {
    return NextResponse.json({ message: "Requête invalide" }, { status: 400 });
  }
}

/**
 * DELETE /api/logs-auth
 * Déconnexion de la session de consultation des logs.
 */
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete(LOGS_COOKIE_NAME);
  return res;
}
