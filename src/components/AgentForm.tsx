"use client";

import { useState, useEffect } from "react";
import { X, Save, User } from "lucide-react";
import { Agent, AgentFormData } from "@/types";

interface AgentFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: AgentFormData) => void;
  agent?: Agent | null;
  mode: "create" | "edit";
}

export default function AgentForm({
  isOpen,
  onClose,
  onSubmit,
  agent,
  mode,
}: AgentFormProps) {
  const [formData, setFormData] = useState<AgentFormData>({
    matricule: "",
    nom_complet: "",
    email: "",
    fonction: "",
    date_naissance: "",
    lieu_naissance: "",
    sexe: "M",
    situationMatrimoniale: "Célibataire",
    adresse: "",
    telephone: "",
    password: "",
  });

  const [errors, setErrors] = useState<Partial<AgentFormData>>({});
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  useEffect(() => {
    if (mode === "edit" && agent) {
      // Gérer nom_complet depuis la DB ou combiner nom + prenom
      const nomComplet =
        (agent as any).nom_complet || `${agent.prenom || ""} ${agent.nom || ""}`.trim();

      setFormData({
        matricule: agent.matricule || "",
        nom_complet: nomComplet,
        email: agent.email || "",
        fonction: agent.fonction || "",
        date_naissance: agent.date_naissance || "",
        lieu_naissance: agent.lieu_naissance || "",
        sexe: agent.sexe || "M",
        situationMatrimoniale: agent.situationMatrimoniale || "Célibataire",
        adresse: agent.adresse || "",
        telephone: agent.telephone || "",
      });
    } else {
      setFormData({
        matricule: "",
        nom_complet: "",
        email: "",
        fonction: "",
        date_naissance: "",
        lieu_naissance: "",
        sexe: "M",
        situationMatrimoniale: "Célibataire",
        adresse: "",
        telephone: "",
        password: "",
      });
    }
    setErrors({});
  }, [mode, agent, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<AgentFormData> = {};

    // Champs obligatoires
    if (!formData.matricule.trim())
      newErrors.matricule = "Le matricule est requis";
    if (!formData.nom_complet.trim())
      newErrors.nom_complet = "Le nom complet est requis";
    if (!formData.fonction.trim())
      newErrors.fonction = "La fonction est requise";
    if (mode === "create" && !formData.password?.trim())
      newErrors.password = "Le mot de passe est requis";

    // Champs optionnels (masqués mais peuvent être remplis)
    // Email, date de naissance, lieu, sexe, situation matrimoniale, adresse, téléphone
    // sont maintenant optionnels

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: keyof AgentFormData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-gray-700" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">
                {mode === "create" ? "Nouvel Agent" : "Modifier l'Agent"}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5 text-slate-600" />
            </button>
          </div>

          {/* Formulaire */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Informations personnelles */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-900 border-b border-gray-200 pb-2">
                Informations personnelles
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Matricule *
                  </label>
                  <input
                    type="text"
                    value={formData.matricule}
                    onChange={(e) => handleChange("matricule", e.target.value)}
                    className={`w-full text-black px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                      errors.matricule ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Ex: AG001"
                  />
                  {errors.matricule && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.matricule}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Fonction *
                  </label>
                  <input
                    type="text"
                    value={formData.fonction}
                    onChange={(e) => handleChange("fonction", e.target.value)}
                    className={`w-full text-black px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                      errors.fonction ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Ex: Manager, Développeur, Chef de projet..."
                  />
                  {errors.fonction && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.fonction}
                    </p>
                  )}
                </div>

                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Nom complet *
                  </label>
                  <input
                    type="text"
                    value={formData.nom_complet}
                    onChange={(e) => handleChange("nom_complet", e.target.value)}
                    className={`w-full text-black px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                      errors.nom_complet ? "border-red-300" : "border-gray-300"
                    }`}
                    placeholder="Ex: Jean Dupont"
                  />
                  {errors.nom_complet && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.nom_complet}
                    </p>
                  )}
                </div>

                {mode === "create" && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Mot de passe *
                    </label>
                    <input
                      type="password"
                      value={formData.password || ""}
                      onChange={(e) => handleChange("password", e.target.value)}
                      className={`w-full text-black px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                        errors.password ? "border-red-300" : "border-gray-300"
                      }`}
                      placeholder="Mot de passe"
                    />
                    {errors.password && (
                      <p className="text-red-600 text-sm mt-1">
                        {errors.password}
                      </p>
                    )}
                  </div>
                )}
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

            {/* Champs optionnels (masqués par défaut) */}
            {showOptionalFields && (
              <div className="space-y-4 bg-gray-50 p-6 rounded-xl border-2 border-gray-200">
                <h4 className="text-lg font-semibold text-slate-900 border-b border-gray-300 pb-2 flex items-center gap-2">
                  <span className="text-gray-500">📋</span>
                  Informations complémentaires
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleChange("email", e.target.value)}
                      className="w-full text-black px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="Ex: jean.dupont@entreprise.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      value={formData.telephone}
                      onChange={(e) => handleChange("telephone", e.target.value)}
                      className="w-full text-black px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="Ex: 01 23 45 67 89"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Date de naissance
                    </label>
                    <input
                      type="date"
                      value={formData.date_naissance}
                      onChange={(e) =>
                        handleChange("date_naissance", e.target.value)
                      }
                      className="w-full text-white bg-gray-700 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Lieu de naissance
                    </label>
                    <input
                      type="text"
                      value={formData.lieu_naissance}
                      onChange={(e) =>
                        handleChange("lieu_naissance", e.target.value)
                      }
                      className="w-full text-black px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="Ville de naissance"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Sexe
                    </label>
                    <select
                      value={formData.sexe}
                      onChange={(e) =>
                        handleChange("sexe", e.target.value as "M" | "F")
                      }
                      className="w-full text-black px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    >
                      <option value="M">Masculin</option>
                      <option value="F">Féminin</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Situation matrimoniale
                    </label>
                    <select
                      value={formData.situationMatrimoniale}
                      onChange={(e) =>
                        handleChange("situationMatrimoniale", e.target.value)
                      }
                      className="w-full text-black px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                    >
                      <option value="Célibataire">Célibataire</option>
                      <option value="Marié(e)">Marié(e)</option>
                      <option value="Divorcé(e)">Divorcé(e)</option>
                      <option value="Veuf/Veuve">Veuf/Veuve</option>
                    </select>
                  </div>

                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Adresse
                    </label>
                    <textarea
                      value={formData.adresse}
                      onChange={(e) => handleChange("adresse", e.target.value)}
                      rows={3}
                      className="w-full text-black px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                      placeholder="Adresse complète"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-primary-700 text-white rounded-lg hover:bg-primary-800 transition-colors flex items-center space-x-2"
              >
                <Save className="w-4 h-4" />
                <span>{mode === "create" ? "Créer" : "Modifier"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
