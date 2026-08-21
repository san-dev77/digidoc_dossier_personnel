"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import AuthGuard from "@/components/AuthGuard";
import DashboardLayout from "@/components/DashboardLayout";
import { usePermissions } from "@/hooks/usePermissions";
import { ToastContainer, useToast } from "@/components/Toast";
import {
  Lock,
  Shield,
  Server,
  Users,
  Loader2,
  CheckCircle2,
  XCircle,
  Save,
  MonitorSmartphone,
} from "lucide-react";

interface SettingsState {
  "security.lockoutThreshold": string;
  "security.lockoutDurationMinutes": string;
  "security.sessionMaxHours": string;
  "security.idleTimeoutMinutes": string;
  "security.passwordMinLength": string;
  "ldap.enabled": string;
  "ldap.server": string;
  "ldap.port": string;
  "ldap.baseDn": string;
  "ldap.bindDn": string;
  "ldap.loginAttribute": string;
  "ldap.useTls": string;
}

interface SessionRow {
  id: number;
  utilisateur_id: number;
  ip_address: string | null;
  user_agent: string | null;
  created_at: string;
  last_activity_at: string;
  expires_at: string;
  utilisateurs: { username: string; nom_complet: string };
}

function authHeaders(): HeadersInit {
  const token = sessionStorage.getItem("auth-token");
  return {
    "Content-Type": "application/json",
    Authorization: `Bearer ${token}`,
  };
}

export default function ParametresSecuritePage() {
  const router = useRouter();
  const { isAdmin } = usePermissions();
  const { toasts, removeToast, success, error: showError } = useToast();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ ok: boolean; message?: string } | null>(null);
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [ldapPassword, setLdapPassword] = useState("");
  const [hasLdapPassword, setHasLdapPassword] = useState(false);
  const [sessions, setSessions] = useState<SessionRow[]>([]);

  useEffect(() => {
    if (!isAdmin) router.push("/dashboard");
  }, [isAdmin, router]);

  const loadSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/settings", { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setSettings(data.settings);
      setHasLdapPassword(data.hasLdapPassword);
    } catch (err) {
      console.error("Erreur chargement des paramètres:", err);
    }
  }, []);

  const loadSessions = useCallback(async () => {
    try {
      const res = await fetch("/api/sessions", { headers: authHeaders() });
      if (!res.ok) return;
      const data = await res.json();
      setSessions(data.sessions || []);
    } catch (err) {
      console.error("Erreur chargement des sessions:", err);
    }
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    (async () => {
      setLoading(true);
      await Promise.all([loadSettings(), loadSessions()]);
      setLoading(false);
    })();
  }, [isAdmin, loadSettings, loadSessions]);

  const updateField = (key: keyof SettingsState, value: string) => {
    setSettings((prev) => (prev ? { ...prev, [key]: value } : prev));
  };

  const handleSave = async () => {
    if (!settings) return;
    setSaving(true);
    try {
      const payload: Record<string, string> = { ...settings };
      if (ldapPassword) {
        payload["ldap.bindPassword"] = ldapPassword;
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: authHeaders(),
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Échec de la mise à jour");

      setLdapPassword("");
      success("Paramètres enregistrés", "Les réglages de sécurité ont été mis à jour.");
      await loadSettings();
    } catch (err) {
      console.error(err);
      showError("Erreur", "Impossible d'enregistrer les paramètres.");
    } finally {
      setSaving(false);
    }
  };

  const handleTestLdap = async () => {
    if (!settings) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await fetch("/api/settings/ldap/test", {
        method: "POST",
        headers: authHeaders(),
        body: JSON.stringify({
          server: settings["ldap.server"],
          port: settings["ldap.port"],
          baseDn: settings["ldap.baseDn"],
          bindDn: settings["ldap.bindDn"],
          bindPassword: ldapPassword,
          loginAttribute: settings["ldap.loginAttribute"],
          useTls: settings["ldap.useTls"] !== "false",
        }),
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      console.error(err);
      setTestResult({ ok: false, message: "Erreur réseau" });
    } finally {
      setTesting(false);
    }
  };

  const handleRevokeSession = async (id: number) => {
    try {
      const res = await fetch(`/api/sessions/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error();
      success("Session révoquée", "L'utilisateur devra se reconnecter.");
      setSessions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error(err);
      showError("Erreur", "Impossible de révoquer cette session.");
    }
  };

  if (!isAdmin) return null;

  return (
    <AuthGuard>
      <DashboardLayout>
        <div className="mb-8">
          <div className="bg-primary-700 rounded-2xl shadow-xl p-8 flex items-center gap-5">
            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center flex-shrink-0">
              <Lock className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Paramètres de sécurité</h1>
              <p className="text-primary-200 mt-1">
                MFA, LDAP et sessions — réservé aux super-administrateurs
              </p>
            </div>
          </div>
        </div>

        {loading || !settings ? (
          <div className="flex items-center justify-center py-24">
            <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Sécurité générale */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                <Shield className="w-5 h-5 text-primary-700" />
                <h2 className="text-lg font-bold text-gray-900">
                  Verrouillage, session et mot de passe
                </h2>
              </div>
              <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-5">
                <Field
                  label="Échecs avant verrouillage"
                  value={settings["security.lockoutThreshold"]}
                  onChange={(v) => updateField("security.lockoutThreshold", v)}
                  suffix="tentatives"
                />
                <Field
                  label="Durée du verrouillage"
                  value={settings["security.lockoutDurationMinutes"]}
                  onChange={(v) => updateField("security.lockoutDurationMinutes", v)}
                  suffix="minutes"
                />
                <Field
                  label="Durée maximale de session"
                  value={settings["security.sessionMaxHours"]}
                  onChange={(v) => updateField("security.sessionMaxHours", v)}
                  suffix="heures"
                />
                <Field
                  label="Déconnexion après inactivité"
                  value={settings["security.idleTimeoutMinutes"]}
                  onChange={(v) => updateField("security.idleTimeoutMinutes", v)}
                  suffix="minutes"
                />
                <Field
                  label="Longueur minimale du mot de passe"
                  value={settings["security.passwordMinLength"]}
                  onChange={(v) => updateField("security.passwordMinLength", v)}
                  suffix="caractères"
                />
              </div>
            </div>

            {/* LDAP */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <Server className="w-5 h-5 text-primary-700" />
                  <h2 className="text-lg font-bold text-gray-900">
                    Annuaire LDAP / Active Directory
                  </h2>
                </div>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <span className="text-sm font-semibold text-gray-700">
                    {settings["ldap.enabled"] === "true" ? "Activé" : "Désactivé"}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      updateField(
                        "ldap.enabled",
                        settings["ldap.enabled"] === "true" ? "false" : "true"
                      )
                    }
                    className="relative rounded-full transition-colors"
                    style={{
                      width: 38,
                      height: 21,
                      background:
                        settings["ldap.enabled"] === "true" ? "#16a34a" : "#cbd5e1",
                    }}
                  >
                    <span
                      className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform"
                      style={{
                        transform:
                          settings["ldap.enabled"] === "true"
                            ? "translateX(17px)"
                            : "translateX(0)",
                      }}
                    />
                  </button>
                </label>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-5">
                <Field
                  label="Serveur"
                  value={settings["ldap.server"]}
                  onChange={(v) => updateField("ldap.server", v)}
                  placeholder="ad.banque.example"
                />
                <Field
                  label="Port"
                  value={settings["ldap.port"]}
                  onChange={(v) => updateField("ldap.port", v)}
                  placeholder="636"
                />
                <Field
                  label="Base DN"
                  value={settings["ldap.baseDn"]}
                  onChange={(v) => updateField("ldap.baseDn", v)}
                  placeholder="dc=banque,dc=example"
                />
                <Field
                  label="Bind DN (compte de service)"
                  value={settings["ldap.bindDn"]}
                  onChange={(v) => updateField("ldap.bindDn", v)}
                  placeholder="cn=service-digidoc,dc=banque,dc=example"
                />
                <Field
                  label={`Mot de passe du compte de service ${
                    hasLdapPassword ? "(déjà défini)" : ""
                  }`}
                  value={ldapPassword}
                  onChange={setLdapPassword}
                  type="password"
                  placeholder={hasLdapPassword ? "Laisser vide pour conserver" : ""}
                />
                <Field
                  label="Attribut de connexion"
                  value={settings["ldap.loginAttribute"]}
                  onChange={(v) => updateField("ldap.loginAttribute", v)}
                  placeholder="sAMAccountName"
                />
              </div>

              <div className="px-6 pb-6 flex items-center gap-4 flex-wrap">
                <button
                  onClick={handleTestLdap}
                  disabled={testing}
                  className="px-4 py-2.5 border-2 border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 transition-colors disabled:opacity-50 flex items-center gap-2"
                >
                  {testing ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Server className="w-4 h-4" />
                  )}
                  Tester la connexion
                </button>

                {testResult && (
                  <span
                    className={`flex items-center gap-2 text-sm font-semibold ${
                      testResult.ok ? "text-accent-green" : "text-red-600"
                    }`}
                  >
                    {testResult.ok ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {testResult.ok
                      ? "Connexion réussie"
                      : testResult.message || "Échec de connexion"}
                  </span>
                )}
              </div>

              <div className="mx-6 mb-6 p-3.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
                LDAPS (connexion chiffrée) est utilisé par défaut. Le mot de passe du
                compte de service est chiffré avant stockage — jamais en clair en base.
              </div>
            </div>

            {/* Sessions actives */}
            <div className="bg-white rounded-2xl shadow-md border border-gray-100 overflow-hidden">
              <div className="px-6 py-5 border-b border-gray-100 flex items-center gap-3">
                <MonitorSmartphone className="w-5 h-5 text-primary-700" />
                <h2 className="text-lg font-bold text-gray-900">
                  Sessions actives ({sessions.length})
                </h2>
              </div>

              {sessions.length === 0 ? (
                <div className="p-10 text-center text-sm text-gray-500">
                  <Users className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  Aucune session active
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                          Utilisateur
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                          IP
                        </th>
                        <th className="px-5 py-3 text-left text-xs font-bold text-gray-600 uppercase">
                          Dernière activité
                        </th>
                        <th className="px-5 py-3 text-right text-xs font-bold text-gray-600 uppercase">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {sessions.map((s) => (
                        <tr key={s.id} className="hover:bg-primary-50/40">
                          <td className="px-5 py-3">
                            <div className="font-semibold text-gray-900 text-sm">
                              {s.utilisateurs.nom_complet}
                            </div>
                            <div className="text-xs text-gray-500">
                              @{s.utilisateurs.username}
                            </div>
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {s.ip_address || "—"}
                          </td>
                          <td className="px-5 py-3 text-sm text-gray-600">
                            {new Date(s.last_activity_at).toLocaleString("fr-FR")}
                          </td>
                          <td className="px-5 py-3 text-right">
                            <button
                              onClick={() => handleRevokeSession(s.id)}
                              className="px-3 py-1.5 bg-red-50 text-red-700 border border-red-200 rounded-lg text-xs font-bold hover:bg-red-100 transition-colors"
                            >
                              Révoquer
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-3 bg-primary-700 text-white rounded-xl font-semibold hover:bg-primary-800 transition-colors disabled:opacity-50 flex items-center gap-2.5 shadow-lg"
              >
                {saving ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Save className="w-5 h-5" />
                )}
                {saving ? "Enregistrement..." : "Enregistrer les paramètres"}
              </button>
            </div>
          </div>
        )}

        <ToastContainer toasts={toasts} onClose={removeToast} />
      </DashboardLayout>
    </AuthGuard>
  );
}

function Field({
  label,
  value,
  onChange,
  suffix,
  type = "text",
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  suffix?: string;
  type?: string;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label}
      </label>
      <div className="relative">
        <input
          type={type}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full px-3.5 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 text-gray-900 text-sm pr-20"
        />
        {suffix && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-medium">
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}
