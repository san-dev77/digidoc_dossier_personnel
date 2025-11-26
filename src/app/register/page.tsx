"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Eye,
  EyeOff,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Shield,
  CheckCircle,
  FileText,
  Briefcase,
  AlertCircle,
  AlertTriangle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { Input, SecureTextarea, Select } from "@/components/forms";
import { useFormValidation } from "@/hooks/useFormValidation";
import { agentFormSchema } from "@/lib/validation/schemas";
import RateLimitModal from "@/components/RateLimitModal";
import type { RateLimitInfo, AuthError } from "@/services/auth";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [confirmPassword, setConfirmPassword] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [rateLimitInfo, setRateLimitInfo] = useState<RateLimitInfo | null>(
    null
  );
  const [showRateLimitModal, setShowRateLimitModal] = useState(false);
  const [rateLimitError, setRateLimitError] = useState<string>("");

  const { register, error: authError, loading } = useAuth();
  const router = useRouter();

  const initialValues = {
    matricule: "",
    nom_complet: "",
    fonction: "",
    date_naissance: "",
    lieu_naissance: "",
    sexe: "M" as "M" | "F",
    situationMatrimoniale: "Célibataire",
    adresse: "",
    telephone: "",
    email: "",
    password: "",
  };

  const {
    values: formData,
    errors,
    setValue,
    setFieldTouched,
    validateForm,
  } = useFormValidation(agentFormSchema, initialValues);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Vérifier la confirmation du mot de passe
    if (formData.password !== confirmPassword) {
      setConfirmPasswordError("Les mots de passe ne correspondent pas");
      return;
    }
    setConfirmPasswordError("");

    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      setRateLimitError("");
      const { password, ...restData } = formData;
      const registerData = {
        matricule: restData.matricule,
        password: password || "",
        nom_complet: restData.nom_complet,
        fonction: restData.fonction || undefined,
        email: restData.email || undefined,
        date_naissance: restData.date_naissance || undefined,
        lieu_naissance: restData.lieu_naissance || undefined,
        sexe: restData.sexe || undefined,
        situation_matrimoniale: restData.situationMatrimoniale || undefined,
        adresse: restData.adresse || undefined,
        telephone: restData.telephone || undefined,
      };
      console.log("📝 Données d'inscription envoyées:", {
        ...registerData,
        password: "***",
      });
      const result = await register(registerData);

      // Mettre à jour les infos de rate limit si disponibles (même en cas de succès)
      if (result && "rateLimitInfo" in result && result.rateLimitInfo) {
        setRateLimitInfo(result.rateLimitInfo);
      }

      router.push("/dashboard"); // Redirection vers le tableau de bord
    } catch (error) {
      console.error("Erreur d'inscription:", error);

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
            authError.message || "Trop de tentatives d'inscription"
          );
          setShowRateLimitModal(true);
        }
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-200 via-white to-slate-600 flex items-center justify-center relative overflow-hidden py-8">
      {/* Éléments de fond subtils */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(71,85,105,0.08)_0%,transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(71,85,105,0.05)_0%,transparent_50%)]"></div>

      {/* Formes décoratives */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-gradient-to-br from-slate-200/40 to-slate-300/40 rounded-full blur-3xl"></div>
      <div className="absolute bottom-20 right-20 w-40 h-40 bg-gradient-to-br from-slate-200/40 to-slate-300/40 rounded-full blur-3xl"></div>

      {/* Bouton retour */}
      <Link
        href="/"
        className="absolute top-8 left-8 flex items-center space-x-2 text-slate-700 hover:text-slate-900 transition-all duration-300 group bg-white/90 backdrop-blur-md px-5 py-3 rounded-2xl border border-slate-200/60 shadow-lg hover:shadow-xl hover:scale-105 hover:-translate-y-1"
      >
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform duration-300" />
        <span className="font-semibold">Retour</span>
      </Link>

      <div className="w-full max-w-5xl mx-auto px-6 relative z-10">
        {/* Logo et titre */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-3 tracking-tight">
            Inscription
          </h1>
          <p className="text-slate-600 text-lg mb-6">
            Créez votre compte personnel
          </p>

          {/* Indicateurs de sécurité */}
          <div className="flex items-center justify-center space-x-6">
            <div className="flex items-center space-x-2 text-sm text-emerald-600 bg-emerald-50 px-4 py-2 rounded-full border border-emerald-200">
              <Shield className="w-4 h-4" />
              <span className="font-medium">Données sécurisées</span>
            </div>
            <div className="flex items-center space-x-2 text-sm text-slate-600 bg-slate-50 px-4 py-2 rounded-full border border-slate-200">
              <CheckCircle className="w-4 h-4" />
              <span className="font-medium">Confidentialité garantie</span>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="bg-white/95 backdrop-blur-2xl rounded-3xl shadow-[0_35px_60px_-12px_rgba(0,0,0,0.15)] border border-slate-200/50 p-8 relative overflow-hidden">
          {/* Éléments décoratifs de la carte */}
          <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-br from-slate-100/80 to-slate-200/80 rounded-full -translate-y-20 translate-x-20 blur-3xl"></div>
          <div
            className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-br from-slate-100/80 to-slate-200/80 rounded-full translate-y-16 -translate-x-16 blur-3xl"
            style={{ transitionDelay: "0.2s" }}
          ></div>

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

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {/* Informations essentielles */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-3 text-slate-600" />
                Informations essentielles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="matricule"
                    className="bloc text-sm font-semibold text-slate-700 mb-3 flex items-center"
                  >
                    <User className="w-4 h-4 mr-2 text-slate-600" />
                    Matricule *
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      id="matricule"
                      value={formData.matricule}
                      onChange={(e) => setValue("matricule", e.target.value)}
                      onBlur={() => setFieldTouched("matricule")}
                      error={errors.matricule}
                      required
                      disabled={isSubmitting || loading}
                      className="w-full px-4 py-4 pl-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Ex: M001"
                      fullWidth={false}
                      label=""
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="fonction"
                    className=" text-sm font-semibold text-slate-700 mb-3 flex items-center"
                  >
                    <Briefcase className="w-4 h-4 mr-2 text-slate-600" />
                    Fonction *
                  </label>
                  <div className="relative">
                    <Input
                      type="text"
                      id="fonction"
                      value={formData.fonction}
                      onChange={(e) => setValue("fonction", e.target.value)}
                      onBlur={() => setFieldTouched("fonction")}
                      error={errors.fonction}
                      required
                      disabled={isSubmitting || loading}
                      className="w-full px-4 py-4 pl-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Ex: Directeur, Manager..."
                      fullWidth={false}
                      label=""
                    />
                    <Briefcase className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                <div className="md:col-span-2">
                  <Input
                    label="Nom complet"
                    type="text"
                    id="nom_complet"
                    value={formData.nom_complet}
                    onChange={(e) => setValue("nom_complet", e.target.value)}
                    onBlur={() => setFieldTouched("nom_complet")}
                    error={errors.nom_complet}
                    required
                    disabled={isSubmitting || loading}
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Ex: Jean Dupont"
                    fullWidth={false}
                  />
                </div>
              </div>
            </div>

            {/* Bouton pour afficher les champs optionnels */}
            <div className="border-t border-gray-200 pt-4">
              <button
                type="button"
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                className="w-full px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 border border-gray-300"
              >
                <svg
                  className={`w-5 h-5 transition-transform duration-200 ${
                    showOptionalFields ? "rotate-180" : ""
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
                <span>
                  {showOptionalFields ? "Masquer" : "Afficher"} les informations
                  complémentaires (optionnelles)
                </span>
              </button>
            </div>

            {/* Champs optionnels */}
            {showOptionalFields && (
              <div className="space-y-6 bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                <h4 className="text-lg font-semibold text-slate-900 border-b border-gray-300 pb-2 flex items-center gap-2">
                  <span className="text-gray-500">📋</span>
                  Informations complémentaires
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label
                      htmlFor="email"
                      className=" text-sm font-semibold text-slate-700 mb-3 flex items-center"
                    >
                      <Mail className="w-4 h-4 mr-2 text-slate-600" />
                      Email
                    </label>
                    <div className="relative">
                      <Input
                        type="email"
                        id="email"
                        value={formData.email || ""}
                        onChange={(e) => setValue("email", e.target.value)}
                        onBlur={() => setFieldTouched("email")}
                        error={errors.email}
                        disabled={isSubmitting || loading}
                        className="w-full px-4 py-4 pl-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="votre.email@exemple.com"
                        fullWidth={false}
                        label=""
                      />
                      <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="telephone"
                      className="bloc text-sm font-semibold text-slate-700 mb-3 flex items-center"
                    >
                      <Phone className="w-4 h-4 mr-2 text-slate-600" />
                      Téléphone
                    </label>
                    <div className="relative">
                      <Input
                        type="tel"
                        id="telephone"
                        value={formData.telephone || ""}
                        onChange={(e) => setValue("telephone", e.target.value)}
                        onBlur={() => setFieldTouched("telephone")}
                        error={errors.telephone}
                        disabled={isSubmitting || loading}
                        className="w-full px-4 py-4 pl-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="+33 6 12 34 56 78"
                        fullWidth={false}
                        label=""
                      />
                      <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <Input
                      label="Date de naissance"
                      type="date"
                      id="date_naissance"
                      value={formData.date_naissance || ""}
                      onChange={(e) =>
                        setValue("date_naissance", e.target.value)
                      }
                      onBlur={() => setFieldTouched("date_naissance")}
                      error={errors.date_naissance}
                      disabled={isSubmitting || loading}
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-slate-800 text-white hover:bg-slate-700 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      fullWidth={false}
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="lieu_naissance"
                      className=" text-sm font-semibold text-slate-700 mb-3 flex items-center"
                    >
                      <MapPin className="w-4 h-4 mr-2 text-slate-600" />
                      Lieu de naissance
                    </label>
                    <div className="relative">
                      <Input
                        type="text"
                        id="lieu_naissance"
                        value={formData.lieu_naissance || ""}
                        onChange={(e) =>
                          setValue("lieu_naissance", e.target.value)
                        }
                        onBlur={() => setFieldTouched("lieu_naissance")}
                        error={errors.lieu_naissance}
                        disabled={isSubmitting || loading}
                        className="w-full px-4 py-4 pl-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        placeholder="Ville, Pays"
                        fullWidth={false}
                        label=""
                      />
                      <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    </div>
                  </div>

                  <div>
                    <Select
                      label="Sexe"
                      id="sexe"
                      value={formData.sexe}
                      onChange={(e) =>
                        setValue("sexe", e.target.value as "M" | "F")
                      }
                      onBlur={() => setFieldTouched("sexe")}
                      error={errors.sexe}
                      disabled={isSubmitting || loading}
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      options={[
                        { value: "", label: "Sélectionnez" },
                        { value: "M", label: "Masculin" },
                        { value: "F", label: "Féminin" },
                      ]}
                      fullWidth={false}
                    />
                  </div>

                  <div>
                    <Select
                      label="Situation matrimoniale"
                      id="situation_matrimoniale"
                      value={formData.situationMatrimoniale}
                      onChange={(e) =>
                        setValue("situationMatrimoniale", e.target.value)
                      }
                      onBlur={() => setFieldTouched("situationMatrimoniale")}
                      error={errors.situationMatrimoniale}
                      disabled={isSubmitting || loading}
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      options={[
                        { value: "", label: "Sélectionnez" },
                        { value: "Célibataire", label: "Célibataire" },
                        { value: "Marié(e)", label: "Marié(e)" },
                        { value: "Divorcé(e)", label: "Divorcé(e)" },
                        { value: "Veuf/Veuve", label: "Veuf/Veuve" },
                      ]}
                      fullWidth={false}
                    />
                  </div>

                  <div className="md:col-span-2">
                    <SecureTextarea
                      label="Adresse"
                      id="adresse"
                      value={formData.adresse || ""}
                      onChange={(value) => {
                        setValue("adresse", value);
                        setFieldTouched("adresse");
                      }}
                      error={errors.adresse}
                      disabled={isSubmitting || loading}
                      maxLength={500}
                      sanitize={true}
                      rows={3}
                      className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Votre adresse complète"
                      fullWidth={false}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Mots de passe */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-3 text-slate-600" />
                Sécurité du compte
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="password"
                    className=" text-sm font-semibold text-slate-700 mb-3 flex items-center"
                  >
                    <Shield className="w-4 h-4 mr-2 text-slate-600" />
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      value={formData.password || ""}
                      onChange={(e) => setValue("password", e.target.value)}
                      onBlur={() => setFieldTouched("password")}
                      error={errors.password}
                      required
                      disabled={isSubmitting || loading}
                      className="w-full px-4 py-4 pl-12 pr-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Créez un mot de passe"
                      fullWidth={false}
                      label=""
                      helperText="Minimum 6 caractères"
                    />
                    <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting || loading}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all duration-300 p-2 hover:bg-slate-100 rounded-xl hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                    >
                      {showPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="confirmPassword"
                    className=" text-sm font-semibold text-slate-700 mb-3 flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2 text-slate-600" />
                    Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (confirmPasswordError) setConfirmPasswordError("");
                      }}
                      onBlur={() => {
                        if (
                          formData.password &&
                          confirmPassword !== formData.password
                        ) {
                          setConfirmPasswordError(
                            "Les mots de passe ne correspondent pas"
                          );
                        }
                      }}
                      error={confirmPasswordError}
                      required
                      disabled={isSubmitting || loading}
                      className="w-full px-4 py-4 pl-12 pr-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Confirmez votre mot de passe"
                      fullWidth={false}
                      label=""
                    />
                    <CheckCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isSubmitting || loading}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all duration-300 p-2 hover:bg-slate-100 rounded-xl hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed z-10"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-5 h-5" />
                      ) : (
                        <Eye className="w-5 h-5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || loading}
              className="w-full bg-slate-800 text-white py-5 px-8 rounded-2xl hover:bg-slate-700 transition-all duration-300 font-bold text-lg shadow-[0_20px_40px_-10px_rgba(71,85,105,0.3)] hover:shadow-[0_25px_50px_-15px_rgba(71,85,105,0.4)] transform hover:-translate-y-1 border border-slate-700/20 relative overflow-hidden group disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              <span className="relative z-10 flex items-center justify-center">
                {isSubmitting ? (
                  <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin mr-3"></div>
                ) : (
                  <FileText className="w-6 h-6 mr-3 group-hover:scale-110 transition-transform duration-300" />
                )}
                {isSubmitting ? "Création du compte..." : "Créer mon compte"}
              </span>
            </button>
          </form>

          <div className="mt-8 text-center relative z-10">
            <p className="text-sm text-slate-600 font-medium">
              Déjà un compte ?{" "}
              <Link
                href="/login"
                className="text-slate-700 hover:text-slate-900 font-bold transition-all duration-300 hover:underline hover:scale-105 inline-block"
              >
                Se connecter
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
          "Trop de tentatives d'inscription. Réessayez dans une heure."
        }
        retryAfter={rateLimitInfo?.retryAfter}
      />
    </div>
  );
}
