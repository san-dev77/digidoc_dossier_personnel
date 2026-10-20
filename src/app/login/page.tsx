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
  MessageSquare,
  Mail,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useAuthStore } from "@/store/authStore";
import { Input } from "@/components/forms";
import { useFormValidation } from "@/hooks/useFormValidation";
import { z } from "zod";
import RateLimitModal from "@/components/RateLimitModal";
import LoginErrorModal from "@/components/LoginErrorModal";
import type { RateLimitInfo, AuthError } from "@/services/auth";

const loginSchema = z.object({
  identifier: z.string().min(1, "L'identifiant est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

interface MfaChallengeState {
  challengeId: number;
  maskedDestination: string;
  channel: "sms" | "email";
  // Le SMS n'est propose en secours que si le compte porte un numero : la
  // colonne telephone est facultative, contrairement a l'e-mail.
  smsDisponible: boolean;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(
    null
  );
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string>("");
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [loginError, setLoginError] = useState<string>("");

  const [mfaChallenge, setMfaChallenge] = useState<MfaChallengeState | null>(
    null
  );
  const [otpCode, setOtpCode] = useState("");
  const [otpError, setOtpError] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [isResending, setIsResending] = useState(false);

  const { login, error: authError, loading } = useAuth();
  const router = useRouter();

  const completeClientLogin = (data: Record<string, unknown>) => {
    sessionStorage.setItem("auth-token", data.token as string);
    sessionStorage.setItem("user", JSON.stringify(data));

    const authStore = useAuthStore.getState();
    authStore.setAppUser(data as never);
    authStore.setLastSessionCheck(Date.now());

    if (data.mustChangePassword) {
      router.push("/changer-mot-de-passe");
    } else {
      router.push("/dashboard");
    }
  };

  const {
    values: formData,
    errors,
    setValue,
    setFieldTouched,
    validateForm,
  } = useFormValidation(loginSchema, {
    identifier: "",
    password: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setRateLimitError("");

      // Utiliser la route unifiée
      const response = await fetch("/api/auth/login-unified", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setLoginError(data.message || data.hint || "Erreur de connexion");
        setShowErrorModal(true);
        return; // Juste afficher le modal, pas de throw
      }

      // Étape MFA requise : on affiche l'écran de saisie du code au lieu
      // de terminer la connexion tout de suite.
      if (data.mfaRequired) {
        setMfaChallenge({
          challengeId: data.challengeId,
          maskedDestination: data.maskedDestination,
          channel: data.channel,
          smsDisponible: Boolean(data.smsDisponible),
        });
        return;
      }

      // Mettre à jour les infos de rate limit si disponibles (même en cas de succès)
      if (data && "rateLimitInfo" in data && data.rateLimitInfo) {
        setRateLimitInfo(data.rateLimitInfo);
      }

      completeClientLogin(data);
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

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaChallenge || isVerifyingOtp) return;

    setOtpError("");
    setIsVerifyingOtp(true);
    try {
      const response = await fetch("/api/auth/mfa/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          challengeId: mfaChallenge.challengeId,
          code: otpCode,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpError(data.message || "Code incorrect");
        return;
      }

      completeClientLogin(data);
    } catch (error) {
      console.error("Erreur de vérification MFA:", error);
      setOtpError("Erreur réseau, veuillez réessayer");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  const handleResendOtp = async (channel: "sms" | "email") => {
    if (!mfaChallenge || isResending) return;

    setIsResending(true);
    setOtpError("");
    try {
      const response = await fetch("/api/auth/mfa/resend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId: mfaChallenge.challengeId, channel }),
      });

      const data = await response.json();

      if (!response.ok) {
        setOtpError(data.message || "Impossible de renvoyer le code");
        return;
      }

      setMfaChallenge({
        challengeId: data.challengeId,
        maskedDestination: data.maskedDestination,
        channel: data.channel,
        smsDisponible: Boolean(data.smsDisponible),
      });
      setOtpCode("");
    } catch (error) {
      console.error("Erreur lors du renvoi du code:", error);
      setOtpError("Erreur réseau, veuillez réessayer");
    } finally {
      setIsResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center relative overflow-hidden px-6 py-16">
      {/* Fond ambiant discret : halos qui dérivent lentement + grain léger */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <span className="absolute -top-44 left-[4%] w-[30rem] h-[30rem] rounded-full blur-[64px] opacity-[0.05] bg-blue-500 bg-drift-a motion-reduce:animate-none"></span>
        <span className="absolute -bottom-40 right-[6%] w-[26rem] h-[26rem] rounded-full blur-[64px] opacity-[0.045] bg-slate-400 bg-drift-b motion-reduce:animate-none"></span>
        <span className="absolute top-[35%] left-[55%] w-80 h-80 rounded-full blur-[64px] opacity-[0.028] bg-blue-500 bg-drift-c motion-reduce:animate-none"></span>
        <span className="absolute -inset-[10%] opacity-[0.035] mix-blend-overlay bg-grain"></span>
      </div>

      {/* Bouton retour */}
      <Link
        href="/"
        className="absolute top-7 left-7 z-10 flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors duration-200 bg-white border border-slate-200 px-4 py-2.5 rounded-full text-sm font-semibold hover:border-slate-300"
      >
        <ArrowLeft className="w-4 h-4" />
        <span>Retour</span>
      </Link>

      <div className="w-full max-w-md mx-auto relative z-10 animate-rise motion-reduce:animate-none">
        {/* Titre */}
        <div className="text-center mb-9">
          <h1 className="text-4xl font-bold text-slate-900 mb-2 tracking-tight">
            {mfaChallenge ? "Vérification" : "Connexion"}
          </h1>
          <p className="text-slate-600 text-base">
            {mfaChallenge
              ? `Code envoyé par ${mfaChallenge.channel === "sms" ? "SMS" : "e-mail"} à ${mfaChallenge.maskedDestination}`
              : "Accédez à votre espace personnel"}
          </p>
        </div>

        {/* Formulaire */}
        <div className="bg-white rounded-2xl shadow-[0_30px_60px_-20px_rgba(30,41,59,0.22),0_8px_18px_-6px_rgba(30,41,59,0.08)] border border-slate-200 p-9 relative overflow-hidden">
          {/* Fil d'accent discret en haut de la carte */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-blue-500 via-blue-500/40 to-transparent"></div>

          {mfaChallenge ? (
            <form onSubmit={handleVerifyOtp} className="space-y-6 relative z-10">
              {otpError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-none mt-0.5" />
                  <span className="text-red-700 font-medium text-sm">{otpError}</span>
                </div>
              )}

              <div>
                <label
                  htmlFor="otp"
                  className="flex text-sm font-semibold text-slate-800 mb-2 items-center"
                >
                  {mfaChallenge.channel === "sms" ? (
                    <MessageSquare className="w-4 h-4 mr-2.5 text-blue-600" />
                  ) : (
                    <Mail className="w-4 h-4 mr-2.5 text-blue-600" />
                  )}
                  Code de vérification
                </label>
                <input
                  id="otp"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  maxLength={6}
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, ""))}
                  disabled={isVerifyingOtp}
                  autoFocus
                  className="w-full px-4 py-3.5 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white text-slate-900 text-center text-2xl tracking-[0.5em] font-semibold disabled:opacity-50"
                  placeholder="······"
                />
                <p className="text-xs text-slate-500 mt-2">
                  Le code expire dans 5 minutes.
                </p>
              </div>

              <button
                type="submit"
                disabled={isVerifyingOtp || otpCode.length !== 6}
                className="w-full bg-slate-900 cursor-pointer text-white py-3.5 px-6 rounded-xl hover:bg-slate-800 transition-all duration-200 font-semibold text-base shadow-[0_14px_28px_-14px_rgba(30,41,59,0.35)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <span className="flex items-center justify-center gap-2.5">
                  {isVerifyingOtp ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                  {isVerifyingOtp ? "Vérification..." : "Valider"}
                </span>
              </button>

              <div className="flex items-center justify-between text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setMfaChallenge(null);
                    setOtpCode("");
                    setOtpError("");
                  }}
                  className="text-slate-500 hover:text-slate-700 font-medium"
                >
                  ← Retour
                </button>
                <div className="flex items-center gap-3">
                  {mfaChallenge.channel === "email"
                    ? mfaChallenge.smsDisponible && (
                        <button
                          type="button"
                          onClick={() => handleResendOtp("sms")}
                          disabled={isResending}
                          className="text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
                        >
                          Recevoir par SMS
                        </button>
                      )
                    : (
                        <button
                          type="button"
                          onClick={() => handleResendOtp("email")}
                          disabled={isResending}
                          className="text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
                        >
                          Recevoir par e-mail
                        </button>
                      )}
                  <button
                    type="button"
                    onClick={() => handleResendOtp(mfaChallenge.channel)}
                    disabled={isResending}
                    className="text-blue-600 hover:text-blue-800 font-semibold disabled:opacity-50"
                  >
                    {isResending ? "Envoi..." : "Renvoyer le code"}
                  </button>
                </div>
              </div>
            </form>
          ) : (
            <>
          {/* Affichage des erreurs */}
          {authError && !rateLimitError && (
            <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-none mt-0.5" />
              <span className="text-red-700 font-medium text-sm">{authError}</span>
            </div>
          )}

          {/* Compteur de tentatives restantes */}
          {rateLimitInfo && rateLimitInfo.remaining < rateLimitInfo.limit && (
            <div className="mb-5 p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 flex-none" />
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
                <div className="w-20 h-1.5 bg-amber-200 rounded-full overflow-hidden flex-none">
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
          )}

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            <div>
              <label
                htmlFor="identifier"
                className="flex text-sm font-semibold text-slate-800 mb-2 items-center"
              >
                <User className="w-4 h-4 mr-2.5 text-blue-600" />
                Identifiant
              </label>
              <div className="relative">
                <Input
                  type="text"
                  id="identifier"
                  value={formData.identifier}
                  onChange={(e) => setValue("identifier", e.target.value)}
                  onBlur={() => setFieldTouched("identifier")}
                  error={errors.identifier}
                  required
                  disabled={isSubmitting || loading}
                  className="w-full px-4 py-3.5 pl-11 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Username, email ou matricule"
                  fullWidth={false}
                  label=""
                />
                <User className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>
              <p className="text-xs text-slate-500 mt-2">
                Utilisez votre <strong className="text-slate-600">username</strong> (ex: digidoc) pour les utilisateurs, ou <strong className="text-slate-600">matricule</strong> pour les agents
              </p>
            </div>

            <div>
              <label
                htmlFor="password"
                className="flex text-sm font-semibold text-slate-800 mb-2 items-center"
              >
                <Lock className="w-4 h-4 mr-2.5 text-blue-600" />
                Mot de passe
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  value={formData.password}
                  onChange={(e) => setValue("password", e.target.value)}
                  onBlur={() => setFieldTouched("password")}
                  error={errors.password}
                  required
                  disabled={isSubmitting || loading}
                  className="w-full px-4 py-3.5 pl-11 pr-11 border border-slate-200 rounded-xl focus:ring-4 focus:ring-blue-500/15 focus:border-blue-500 transition-all duration-200 bg-slate-50 focus:bg-white text-slate-900 placeholder-slate-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  placeholder="Entrez votre mot de passe"
                  fullWidth={false}
                  label=""
                />
                <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isSubmitting || loading}
                  className="absolute right-2.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-700 transition-colors duration-150 p-1.5 hover:bg-slate-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed z-10"
                >
                  {showPassword ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full bg-slate-900 cursor-pointer text-white py-3.5 px-6 rounded-xl hover:bg-slate-800 transition-all duration-200 font-semibold text-base shadow-[0_14px_28px_-14px_rgba(30,41,59,0.35)] hover:shadow-[0_20px_40px_-15px_rgba(30,41,59,0.4)] hover:-translate-y-0.5 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="flex items-center justify-center">
                <div className="w-5 h-5 mr-2.5 flex items-center justify-center">
                  {isSubmitting ? (
                    <Loader2 key="loading" className="w-5 h-5 animate-spin" />
                  ) : (
                    <Shield key="shield" className="w-5 h-5" />
                  )}
                </div>
                <span>{isSubmitting ? "Connexion..." : "Se connecter"}</span>
              </span>
            </button>
          </form>
            </>
          )}
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

      {/* Modale d'erreur détaillée */}
      <LoginErrorModal
        isOpen={showErrorModal}
        onClose={() => {
          setShowErrorModal(false);
          setLoginError("");
        }}
        error={loginError}
      />
    </div>
  );
}
