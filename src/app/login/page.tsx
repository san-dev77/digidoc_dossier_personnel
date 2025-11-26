"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  User,
  Lock,
  Shield,
  AlertCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input } from "@/components/forms";
import { useFormValidation } from "@/hooks/useFormValidation";
import { z } from "zod";
import RateLimitModal from "@/components/RateLimitModal";
import type { RateLimitInfo, AuthError } from "@/services/auth";

const loginSchema = z.object({
  matricule: z.string().min(1, "Le matricule est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(
    null
  );
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string>("");

  const { login, error: authError, loading } = useAuth();
  const router = useRouter();

  const {
    values: formData,
    errors,
    setValue,
    setFieldTouched,
    validateForm,
  } = useFormValidation(loginSchema, {
    matricule: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setRateLimitError("");
      const result = await login(formData.matricule, formData.password);

      // Mettre à jour les infos de rate limit si disponibles (même en cas de succès)
      if (result && "rateLimitInfo" in result && result.rateLimitInfo) {
        setRateLimitInfo(result.rateLimitInfo);
      }

      router.push("/dashboard"); // Redirection vers le tableau de bord
    } catch (error) {
      console.error("Erreur de connexion:", error);

      // Vérifier si c'est une erreur avec rate limit info
      const authError = error as AuthError;

      // Toujours mettre à jour les infos de rate limit si disponibles
      if (authError?.rateLimitInfo) {
        setRateLimitInfo(authError.rateLimitInfo);

        // Si c'est une erreur 429 (rate limit atteint), afficher la modale
        if (
          authError.message?.includes("Trop de tentatives") ||
          authError.message?.includes("Réessayez")
        ) {
          setRateLimitError(
            authError.message || "Trop de tentatives de connexion"
          );
          setShowRateLimitModal(true);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-gray-200 to-slate-700/40 flex items-center justify-center relative overflow-hidden">
      {/* Éléments de fond animés */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(99,102,241,0.08)_0%,transparent_50%)] animate-pulse"></div>
      <div
        className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(6,182,212,0.06)_0%,transparent_50%)] animate-pulse"
        style={{ animationDelay: "1s" }}
      ></div>

      {/* Formes décoratives flottantes */}
      <div
        className="absolute top-20 left-20 w-40 h-40 bg-gradient-to-br from-indigo-200/30 to-purple-200/30 rounded-full blur-3xl animate-bounce"
        style={{ animationDuration: "6s" }}
      ></div>
      <div
        className="absolute bottom-20 right-20 w-48 h-48 bg-gradient-to-br from-cyan-200/30 to-blue-200/30 rounded-full blur-3xl animate-bounce"
        style={{ animationDuration: "8s", animationDelay: "1s" }}
      ></div>
      <div
        className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-gradient-to-br from-pink-100/20 to-rose-100/20 rounded-full blur-3xl animate-pulse"
        style={{ animationDuration: "10s" }}
      ></div>

      {/* Bouton retour amélioré */}
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center space-x-2 text-slate-700 hover:text-indigo-600 transition-all duration-300 group bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-200/60 shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
        <span className="font-semibold">Retour</span>
      </Link>

      <div className="w-full max-w-lg mx-auto px-6 relative z-10">
        {/* Logo et titre améliorés */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold bg-gradient-to-r from-slate-900 via-indigo-800 to-slate-900 bg-clip-text text-transparent mb-4 tracking-tight">
            Connexion
          </h1>
          <p className="text-primary-600 text-xl font-medium">
            Accédez à votre espace personnel
          </p>
        </div>

        {/* Formulaire amélioré */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_35px_60px_-12px_rgba(0,0,0,0.25)] border border-white/20 p-10 relative overflow-hidden group hover:shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] transition-all duration-500">
          {/* Éléments décoratifs de la carte */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-indigo-50/80 to-purple-50/80 rounded-full -translate-y-20 translate-x-20 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
          <div
            className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-cyan-50/80 to-blue-50/80 rounded-full translate-y-16 -translate-x-16 blur-3xl group-hover:scale-110 transition-transform duration-700"
            style={{ transitionDelay: "0.2s" }}
          ></div>

          {/* Effet de brillance */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>

          {/* Affichage des erreurs */}
          {authError && !rateLimitError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 font-medium">{authError}</span>
            </div>
          )}

          {/* Compteur de tentatives restantes */}
          {rateLimitInfo && rateLimitInfo.remaining < rateLimitInfo.limit && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600" />
                  <div>
                    <p className="text-amber-800 font-semibold text-sm">
                      Tentatives restantes
                    </p>
                    <p className="text-amber-700 text-xs">
                      {rateLimitInfo.remaining} / {rateLimitInfo.limit}{" "}
                      tentatives
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-amber-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-amber-600 transition-all duration-300"
                      style={{
                        width: `${
                          (rateLimitInfo.remaining / rateLimitInfo.limit) * 100
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            <div className="group">
              <label
                htmlFor="matricule"
                className="flex text-sm font-bold text-slate-800 mb-3 items-center group-hover:text-indigo-600 transition-colors duration-300"
              >
                <User className="w-4 h-4 mr-3 text-indigo-600 group-hover:scale-110 transition-transform duration-300" />
                Matricule
              </label>
              <div className="relative group">
                <Input
                  type="text"
                  id="matricule"
                  value={formData.matricule}
                  onChange={(e) => setValue("matricule", e.target.value)}
                  onBlur={() => setFieldTouched("matricule")}
                  error={errors.matricule}
                  required
                  disabled={isSubmitting || loading}
                  className="w-full px-5 py-5 pl-14 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-primary-300 text-primary-900 placeholder-slate-500 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Entrez votre matricule"
                  fullWidth={false}
                  label=""
                />
                <User className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors duration-300 pointer-events-none" />
              </div>
            </div>

            <div className="group">
              <label
                htmlFor="password"
                className="flex text-sm font-bold text-slate-800 mb-3 items-center group-hover:text-indigo-600 transition-colors duration-300"
              >
                <Lock className="w-4 h-4 mr-3 text-indigo-600 group-hover:scale-110 transition-transform duration-300" />
                Mot de passe
              </label>
              <div className="relative group">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setValue("password", e.target.value)}
                  onBlur={() => setFieldTouched("password")}
                  error={errors.password}
                  required
                  disabled={isSubmitting || loading}
                  className="w-full px-5 py-5 pl-14 pr-14 border-2 border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all duration-300 bg-white/80 backdrop-blur-sm hover:bg-white hover:border-primary-300 text-primary-900 placeholder-slate-500 font-medium shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Entrez votre mot de passe"
                  fullWidth={false}
                  label=""
                />
                <Lock className="absolute left-5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 group-hover:text-indigo-500 transition-colors duration-300 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || loading}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-all duration-300 p-2 hover:bg-indigo-50 rounded-xl hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                >
                  {showPassword ? (
                    <EyeOff className="w-5 h-5" />
                  ) : (
                    <Eye className="w-5 h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full bg-slate-800 cursor-pointer text-white py-5 px-8 rounded-2xl hover:from-indigo-700 hover:via-purple-700 hover:to-indigo-800 transition-all duration-500 font-bold text-lg shadow-[0_20px_40px_-10px_rgba(99,102,241,0.4)] hover:shadow-[0_25px_50px_-15px_rgba(99,102,241,0.5)] transform hover:-translate-y-2 border border-indigo-500/20 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="relative z-10 flex items-center justify-center">
                <div className="w-6 h-6 mr-3 flex items-center justify-center">
                  {isSubmitting ? (
                    <Loader2 key="loading" className="w-6 h-6 animate-spin" />
                  ) : (
                    <Shield
                      key="shield"
                      className="w-6 h-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300"
                    />
                  )}
                </div>
                <span>{isSubmitting ? "Connexion..." : "Se connecter"}</span>
              </span>
              <div className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
            </button>
          </form>

          <div className="mt-10 text-center relative z-10">
            <p className="text-sm text-primary-600 font-medium">
              Pas encore de compte ?{" "}
              <Link
                href="/register"
                className="text-indigo-600 hover:text-indigo-700 font-bold transition-all duration-300 hover:underline hover:scale-105 inline-block"
              >
                S&apos;inscrire
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* Modale de rate limiting */}
      <RateLimitModal
        isOpen={showRateLimitModal}
        onClose={() => setShowRateLimitModal(false)}
        message={
          rateLimitError ||
          "Trop de tentatives de connexion. Réessayez dans quelques minutes."
        }
        retryAfter={rateLimitInfo?.retryAfter}
      />
    </div>
  );
}
