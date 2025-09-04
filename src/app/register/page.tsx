"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Building2,
  Eye,
  EyeOff,
  ArrowLeft,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  Users,
  Shield,
  CheckCircle,
  FileText,
  Briefcase,
  Heart,
  AlertCircle,
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    matricule: "",
    nom: "",
    prenom: "",
    fonction: "",
    date_naissance: "",
    lieu_naissance: "",
    sexe: "",
    situation_matrimoniale: "",
    adresse: "",
    telephone: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  const { register, error: authError, loading } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    if (formData.password !== formData.confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }

    try {
      setIsSubmitting(true);
      const { password, confirmPassword, ...userData } = formData;
      await register({ ...userData, password });
      router.push("/dashboard"); // Redirection vers le tableau de bord
    } catch (error) {
      console.error("Erreur d'inscription:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
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
          {authError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-center space-x-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <span className="text-red-700 font-medium">{authError}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8 relative z-10">
            {/* Informations d'identification */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Shield className="w-5 h-5 mr-3 text-slate-600" />
                Informations d&apos;identification
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="matricule"
                    className="block text-sm font-semibold text-slate-700 mb-3 flex items-center"
                  >
                    <User className="w-4 h-4 mr-2 text-slate-600" />
                    Matricule *
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="matricule"
                      name="matricule"
                      value={formData.matricule}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting || loading}
                      className="w-full px-4 py-4 pl-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Votre matricule unique"
                    />
                    <User className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-semibold text-slate-700 mb-3 flex items-center"
                  >
                    <Mail className="w-4 h-4 mr-2 text-slate-600" />
                    Email *
                  </label>
                  <div className="relative">
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting || loading}
                      className="w-full px-4 py-4 pl-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="votre.email@exemple.com"
                    />
                    <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Informations personnelles */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <User className="w-5 h-5 mr-3 text-slate-600" />
                Informations personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="prenom"
                    className="block text-sm font-semibold text-slate-700 mb-3"
                  >
                    Prénom *
                  </label>
                  <input
                    type="text"
                    id="prenom"
                    name="prenom"
                    value={formData.prenom}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting || loading}
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Votre prénom"
                  />
                </div>

                <div>
                  <label
                    htmlFor="nom"
                    className="block text-sm font-semibold text-slate-700 mb-3"
                  >
                    Nom *
                  </label>
                  <input
                    type="text"
                    id="nom"
                    name="nom"
                    value={formData.nom}
                    onChange={handleChange}
                    required
                    disabled={isSubmitting || loading}
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Votre nom"
                  />
                </div>
              </div>
            </div>

            {/* Informations professionnelles */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Briefcase className="w-5 h-5 mr-3 text-slate-600" />
                Informations professionnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="fonction"
                    className="block text-sm font-semibold text-slate-700 mb-3"
                  >
                    Fonction
                  </label>
                  <input
                    type="text"
                    id="fonction"
                    name="fonction"
                    value={formData.fonction}
                    onChange={handleChange}
                    disabled={isSubmitting || loading}
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder="Votre fonction"
                  />
                </div>

                <div>
                  <label
                    htmlFor="date_naissance"
                    className="block text-sm font-semibold text-slate-700 mb-3 flex items-center"
                  >
                    <Calendar className="w-4 h-4 mr-2 text-slate-600" />
                    Date de naissance
                  </label>
                  <input
                    type="date"
                    id="date_naissance"
                    name="date_naissance"
                    value={formData.date_naissance}
                    onChange={handleChange}
                    disabled={isSubmitting || loading}
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-slate-800 text-white hover:bg-slate-700 cursor-pointer font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                </div>
              </div>
            </div>

            {/* Informations démographiques */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-3 text-slate-600" />
                Informations démographiques
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="lieu_naissance"
                    className="block text-sm font-semibold text-slate-700 mb-3 flex items-center"
                  >
                    <MapPin className="w-4 h-4 mr-2 text-slate-600" />
                    Lieu de naissance
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      id="lieu_naissance"
                      name="lieu_naissance"
                      value={formData.lieu_naissance}
                      onChange={handleChange}
                      disabled={isSubmitting || loading}
                      className="w-full px-4 py-4 pl-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Ville, Pays"
                    />
                    <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="sexe"
                    className="block text-sm font-semibold text-slate-700 mb-3 flex items-center"
                  >
                    <Users className="w-4 h-4 mr-2 text-slate-600" />
                    Sexe
                  </label>
                  <select
                    id="sexe"
                    name="sexe"
                    value={formData.sexe}
                    onChange={handleChange}
                    disabled={isSubmitting || loading}
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Sélectionnez</option>
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Informations personnelles supplémentaires */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <Heart className="w-5 h-5 mr-3 text-slate-600" />
                Informations personnelles
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label
                    htmlFor="situation_matrimoniale"
                    className="block text-sm font-semibold text-slate-700 mb-3"
                  >
                    Situation matrimoniale
                  </label>
                  <select
                    id="situation_matrimoniale"
                    name="situation_matrimoniale"
                    value={formData.situation_matrimoniale}
                    onChange={handleChange}
                    disabled={isSubmitting || loading}
                    className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <option value="">Sélectionnez</option>
                    <option value="Célibataire">Célibataire</option>
                    <option value="Marié(e)">Marié(e)</option>
                    <option value="Divorcé(e)">Divorcé(e)</option>
                    <option value="Veuf/Veuve">Veuf/Veuve</option>
                  </select>
                </div>

                <div>
                  <label
                    htmlFor="telephone"
                    className="block text-sm font-semibold text-slate-700 mb-3 flex items-center"
                  >
                    <Phone className="w-4 h-4 mr-2 text-slate-600" />
                    Téléphone
                  </label>
                  <div className="relative">
                    <input
                      type="tel"
                      id="telephone"
                      name="telephone"
                      value={formData.telephone}
                      onChange={handleChange}
                      disabled={isSubmitting || loading}
                      className="w-full px-4 py-4 pl-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="+33 6 12 34 56 78"
                    />
                    <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                  </div>
                </div>
              </div>
            </div>

            {/* Adresse */}
            <div className="bg-slate-50/80 rounded-2xl p-6 border border-slate-200/60">
              <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
                <MapPin className="w-5 h-5 mr-3 text-slate-600" />
                Adresse
              </h3>
              <textarea
                id="adresse"
                name="adresse"
                value={formData.adresse}
                onChange={(e) =>
                  setFormData({ ...formData, adresse: e.target.value })
                }
                rows={3}
                disabled={isSubmitting || loading}
                className="w-full px-4 py-4 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                placeholder="Votre adresse complète"
              />
            </div>

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
                    className="block text-sm font-semibold text-slate-700 mb-3 flex items-center"
                  >
                    <Shield className="w-4 h-4 mr-2 text-slate-600" />
                    Mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? "text" : "password"}
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting || loading}
                      className="w-full px-4 py-4 pl-12 pr-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Créez un mot de passe"
                    />
                    <Shield className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isSubmitting || loading}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all duration-300 p-2 hover:bg-slate-100 rounded-xl hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    className="block text-sm font-semibold text-slate-700 mb-3 flex items-center"
                  >
                    <CheckCircle className="w-4 h-4 mr-2 text-slate-600" />
                    Confirmer le mot de passe *
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      id="confirmPassword"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      required
                      disabled={isSubmitting || loading}
                      className="w-full px-4 py-4 pl-12 pr-12 border-2 border-slate-200 rounded-xl focus:ring-4 focus:ring-slate-500/20 focus:border-slate-500 transition-all duration-300 bg-white/90 backdrop-blur-sm hover:bg-white text-slate-900 placeholder-slate-500 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                      placeholder="Confirmez votre mot de passe"
                    />
                    <CheckCircle className="absolute left-4 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      disabled={isSubmitting || loading}
                      className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-all duration-300 p-2 hover:bg-slate-100 rounded-xl hover:scale-110 disabled:opacity-50 disabled:cursor-not-allowed"
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
    </div>
  );
}
