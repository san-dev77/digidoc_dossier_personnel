import { prisma } from "@/lib/prisma";

/**
 * Configuration applicative modifiable à l'exécution (table `app_settings`),
 * sans redéploiement. Chaque clé a une valeur par défaut utilisée tant
 * qu'aucune ligne n'existe encore en base pour elle.
 */
export const DEFAULT_SETTINGS = {
  "ldap.enabled": "false",
  "ldap.server": "",
  "ldap.port": "636",
  "ldap.baseDn": "",
  "ldap.bindDn": "",
  "ldap.bindPasswordEncrypted": "",
  "ldap.loginAttribute": "sAMAccountName",
  "ldap.useTls": "true",
  "security.lockoutThreshold": "5",
  "security.lockoutDurationMinutes": "30",
  "security.sessionMaxHours": "8",
  "security.idleTimeoutMinutes": "20",
  "security.passwordMinLength": "12",
} as const;

export type SettingKey = keyof typeof DEFAULT_SETTINGS;

export async function getSetting(key: SettingKey): Promise<string> {
  const row = await prisma.app_settings.findUnique({ where: { key } });
  return row?.value ?? DEFAULT_SETTINGS[key];
}

export async function getSettings(
  keys: SettingKey[]
): Promise<Record<string, string>> {
  const rows = await prisma.app_settings.findMany({
    where: { key: { in: keys } },
  });
  const stored = new Map(rows.map((r) => [r.key, r.value]));

  const result: Record<string, string> = {};
  for (const key of keys) {
    result[key] = stored.get(key) ?? DEFAULT_SETTINGS[key];
  }
  return result;
}

export async function getAllSettings(): Promise<Record<string, string>> {
  return getSettings(Object.keys(DEFAULT_SETTINGS) as SettingKey[]);
}

export async function setSetting(
  key: SettingKey,
  value: string,
  updatedBy?: number
): Promise<void> {
  await prisma.app_settings.upsert({
    where: { key },
    update: { value, updated_by: updatedBy },
    create: { key, value, updated_by: updatedBy },
  });
}

export async function setSettings(
  entries: Partial<Record<SettingKey, string>>,
  updatedBy?: number
): Promise<void> {
  await Promise.all(
    Object.entries(entries).map(([key, value]) =>
      setSetting(key as SettingKey, value as string, updatedBy)
    )
  );
}

export async function getNumberSetting(key: SettingKey): Promise<number> {
  const value = await getSetting(key);
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : Number(DEFAULT_SETTINGS[key]);
}

export async function getBooleanSetting(key: SettingKey): Promise<boolean> {
  const value = await getSetting(key);
  return value === "true";
}
