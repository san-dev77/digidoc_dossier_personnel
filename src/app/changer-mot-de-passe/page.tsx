"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, Eye, EyeOff, AlertCircle, Loader2, ShieldCheck } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import AuthGuard from "@/components/AuthGuard";

export default function ChangerMotDePassePage() {
  return (
    <AuthGuard>
      <ChangerMotDePasseContent />
    </AuthGuard>
  );
}

function ChangerMotDePasseContent() {
  const router = useRouter();
  const { appUser } = useAuth();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<string[]>([]);

  const isForced = !!appUser?.mustChangePassword;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors([]);

    if (newPassword !== confirmPassword) {
      setError("Les deux mots de passe ne correspondent pas");
      return;
    }

    setIsSubmitting(true);
    try {
      const token = sessionStorage.getItem("auth-token");
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || "Erreur lors du changement de mot de passe");
        setFieldErrors(data.errors || []);
        return;
      }

      // Mettre à jour l'utilisateur en session pour lever le flag obligatoire
      if (appUser) {
        useAuthStore.getState().setAppUser({ ...appUser, mustChangePassword: false });
      }

      router.push("/dashboard");
    } catch (err) {
      console.error("Erreur changement de mot de passe:", err);
      setError("Erreur réseau, veuillez réessayer");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 py-16">
      <div className="w-full max-w-md mx-auto">
        <div className="text-center mb-9">
          <div className="w-14 h-14 bg-primary-700 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">
            {isForced ? "Changement de mot de passe requis" : "Changer mon mot de passe"}
          </h1>
          <p className="text-slate-600 text-sm">
            {isForced
              ? "Pour des raisons de sécurité, vous devez définir un nouveau mot de passe avant de continuer."
              : "Choisissez un nouveau mot de passe."}
          </p>
        </div>

        <div className="bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {error && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-none mt-0.5" />
              <div>
                <p className="text-red-700 font-medium text-sm">{error}</p>
                {fieldErrors.length > 0 && (
                  <ul className="mt-1.5 space-y-0.5">
                    {fieldErrors.map((e, i) => (
                      <li key={i} className="text-red-600 text-xs">
                        • {e}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="flex text-sm font-semibold text-slate-800 mb-2 items-center">
                <Lock className="w-4 h-4 mr-2.5 text-primary-600" />
                Mot de passe actuel
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 bg-slate-50 focus:bg-white text-slate-900 disabled:opacity-50"
              />
            </div>

            <div>
              <label className="flex text-sm font-semibold text-slate-800 mb-2 items-center">
                <Lock className="w-4 h-4 mr-2.5 text-primary-600" />
                Nouveau mot de passe
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 bg-slate-50 focus:bg-white text-slate-900 disabled:opacity-50"
              />
              <p className="text-xs text-slate-500 mt-1.5">
                Au moins 12 caractères, avec majuscule, minuscule, chiffre et caractère spécial.
              </p>
            </div>

            <div>
              <label className="flex text-sm font-semibold text-slate-800 mb-2 items-center">
                <Lock className="w-4 h-4 mr-2.5 text-primary-600" />
                Confirmer le nouveau mot de passe
              </label>
              <input
                type={showPasswords ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 border border-slate-200 rounded-xl focus:ring-4 focus:ring-primary-500/15 focus:border-primary-500 bg-slate-50 focus:bg-white text-slate-900 disabled:opacity-50"
              />
            </div>

            <button
              type="button"
              onClick={() => setShowPasswords((v) => !v)}
              className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-700"
            >
              {showPasswords ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              {showPasswords ? "Masquer" : "Afficher"} les mots de passe
            </button>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 text-white py-3.5 px-6 rounded-xl hover:bg-slate-800 transition-colors font-semibold text-base disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5"
            >
              {isSubmitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ShieldCheck className="w-5 h-5" />}
              {isSubmitting ? "Mise à jour..." : "Valider le nouveau mot de passe"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
