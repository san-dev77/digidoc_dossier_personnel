import { NextRequest, NextResponse } from "next/server";
import {
  requireSuperAdmin,
  getUserIdFromRequest,
} from "@/lib/permissions/permissionMiddleware";
import {
  getAllSettings,
  setSettings,
  DEFAULT_SETTINGS,
  type SettingKey,
} from "@/lib/settings";
import { encryptSecret } from "@/lib/crypto/settingsEncryption";
import { withLogging } from "@/lib/apiLogger";
import { logger } from "@/lib/logger";

/**
 * GET /api/settings
 * Lit la configuration de sécurité (LDAP, seuils MFA/verrouillage/session).
 * Réservé aux super-administrateurs.
 */
export const GET = withLogging("settings.get", async (req: NextRequest) => {
  const authError = await requireSuperAdmin()(req);
  if (authError) return authError;

  try {
    const settings = await getAllSettings();
    // Le mot de passe de bind LDAP (même chiffré) ne quitte jamais le serveur.
    const { "ldap.bindPasswordEncrypted": bindPasswordEncrypted, ...safeSettings } =
      settings;

    return NextResponse.json({
      settings: safeSettings,
      hasLdapPassword: !!bindPasswordEncrypted,
    });
  } catch (error) {
    console.error("Erreur lecture des paramètres:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
});

/**
 * PUT /api/settings
 * Met à jour un sous-ensemble de paramètres. Le mot de passe de bind LDAP
 * (`ldap.bindPassword`, en clair dans la requête) est chiffré avant stockage.
 */
export const PUT = withLogging("settings.update", async (req: NextRequest) => {
  const authError = await requireSuperAdmin()(req);
  if (authError) return authError;

  try {
    const body = await req.json();
    const userId = await getUserIdFromRequest(req);

    const updates: Partial<Record<SettingKey, string>> = {};
    for (const key of Object.keys(body)) {
      if (key === "ldap.bindPassword") continue; // traité séparément ci-dessous
      if (!(key in DEFAULT_SETTINGS)) continue; // ignore les clés inconnues
      updates[key as SettingKey] = String(body[key]);
    }

    if (body["ldap.bindPassword"]) {
      updates["ldap.bindPasswordEncrypted"] = encryptSecret(
        body["ldap.bindPassword"]
      );
    }

    await setSettings(updates, userId ?? undefined);

    logger.success("Paramètres de sécurité mis à jour", {
      context: "settings.update",
      meta: { userId, keys: Object.keys(updates) },
    });

    return NextResponse.json({ message: "Paramètres mis à jour" });
  } catch (error) {
    console.error("Erreur mise à jour des paramètres:", error);
    return NextResponse.json({ message: "Erreur serveur" }, { status: 500 });
  }
});
