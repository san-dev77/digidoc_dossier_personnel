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
    nom: "",
    prenom: "",
    fonction: "",
    dateNaissance: "",
    lieuNaissance: "",
    sexe: "M",
    situationMatrimoniale: "Célibataire",
    adresse: "",
    telephone: "",
  });

  const [errors, setErrors] = useState<Partial<AgentFormData>>({});

  useEffect(() => {
    if (mode === "edit" && agent) {
      setFormData({
        matricule: agent.matricule,
        nom: agent.nom,
        prenom: agent.prenom,
        fonction: agent.fonction,
        dateNaissance: agent.dateNaissance,
        lieuNaissance: agent.lieuNaissance,
        sexe: agent.sexe,
        situationMatrimoniale: agent.situationMatrimoniale,
        adresse: agent.adresse,
        telephone: agent.telephone,
      });
    } else {
      setFormData({
        matricule: "",
        nom: "",
        prenom: "",
        fonction: "",
        dateNaissance: "",
        lieuNaissance: "",
        sexe: "M",
        situationMatrimoniale: "Célibataire",
        adresse: "",
        telephone: "",
      });
    }
    setErrors({});
  }, [mode, agent, isOpen]);

  const validateForm = (): boolean => {
    const newErrors: Partial<AgentFormData> = {};

    if (!formData.matricule.trim())
      newErrors.matricule = "Le matricule est requis";
    if (!formData.nom.trim()) newErrors.nom = "Le nom est requis";
    if (!formData.prenom.trim()) newErrors.prenom = "Le prénom est requis";
    if (!formData.fonction.trim())
      newErrors.fonction = "La fonction est requise";
    if (!formData.dateNaissance)
      newErrors.dateNaissance = "La date de naissance est requise";
    if (!formData.lieuNaissance.trim())
      newErrors.lieuNaissance = "Le lieu de naissance est requis";
    if (!formData.adresse.trim()) newErrors.adresse = "L'adresse est requise";
    if (!formData.telephone.trim())
      newErrors.telephone = "Le téléphone est requis";

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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-slate-100 rounded-xl flex items-center justify-center shadow-sm">
                <User className="w-5 h-5 text-slate-700" />
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
              <h4 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                Informations personnelles
              </h4>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Matricule *
                  </label>
                  <input
                    type="text"
                    value={formData.matricule}
                    onChange={(e) => handleChange("matricule", e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                      errors.matricule ? "border-red-300" : "border-slate-300"
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
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Fonction *
                  </label>
                  <select
                    value={formData.fonction}
                    onChange={(e) => handleChange("fonction", e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                      errors.fonction ? "border-red-300" : "border-slate-300"
                    }`}
                  >
                    <option value="">Sélectionner une fonction</option>
                    <option value="Manager">Manager</option>
                    <option value="Développeur">Développeur</option>
                    <option value="Analyste">Analyste</option>
                    <option value="Designer">Designer</option>
                    <option value="Chef de projet">Chef de projet</option>
                    <option value="Consultant">Consultant</option>
                  </select>
                  {errors.fonction && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.fonction}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Prénom *
                  </label>
                  <input
                    type="text"
                    value={formData.prenom}
                    onChange={(e) => handleChange("prenom", e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                      errors.prenom ? "border-red-300" : "border-slate-300"
                    }`}
                    placeholder="Prénom"
                  />
                  {errors.prenom && (
                    <p className="text-red-600 text-sm mt-1">{errors.prenom}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Nom *
                  </label>
                  <input
                    type="text"
                    value={formData.nom}
                    onChange={(e) => handleChange("nom", e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                      errors.nom ? "border-red-300" : "border-slate-300"
                    }`}
                    placeholder="Nom"
                  />
                  {errors.nom && (
                    <p className="text-red-600 text-sm mt-1">{errors.nom}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Date de naissance *
                  </label>
                  <input
                    type="date"
                    value={formData.dateNaissance}
                    onChange={(e) =>
                      handleChange("dateNaissance", e.target.value)
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                      errors.dateNaissance
                        ? "border-red-300"
                        : "border-slate-300"
                    }`}
                  />
                  {errors.dateNaissance && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.dateNaissance}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Lieu de naissance *
                  </label>
                  <input
                    type="text"
                    value={formData.lieuNaissance}
                    onChange={(e) =>
                      handleChange("lieuNaissance", e.target.value)
                    }
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                      errors.lieuNaissance
                        ? "border-red-300"
                        : "border-slate-300"
                    }`}
                    placeholder="Ville de naissance"
                  />
                  {errors.lieuNaissance && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.lieuNaissance}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Sexe *
                  </label>
                  <select
                    value={formData.sexe}
                    onChange={(e) =>
                      handleChange("sexe", e.target.value as "M" | "F")
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  >
                    <option value="M">Masculin</option>
                    <option value="F">Féminin</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Situation matrimoniale
                  </label>
                  <select
                    value={formData.situationMatrimoniale}
                    onChange={(e) =>
                      handleChange("situationMatrimoniale", e.target.value)
                    }
                    className="w-full px-3 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500"
                  >
                    <option value="Célibataire">Célibataire</option>
                    <option value="Marié(e)">Marié(e)</option>
                    <option value="Divorcé(e)">Divorcé(e)</option>
                    <option value="Veuf/Veuve">Veuf/Veuve</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Informations de contact */}
            <div className="space-y-4">
              <h4 className="text-lg font-semibold text-slate-900 border-b border-slate-200 pb-2">
                Informations de contact
              </h4>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Téléphone *
                  </label>
                  <input
                    type="tel"
                    value={formData.telephone}
                    onChange={(e) => handleChange("telephone", e.target.value)}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                      errors.telephone ? "border-red-300" : "border-slate-300"
                    }`}
                    placeholder="Ex: 01 23 45 67 89"
                  />
                  {errors.telephone && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.telephone}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">
                    Adresse *
                  </label>
                  <textarea
                    value={formData.adresse}
                    onChange={(e) => handleChange("adresse", e.target.value)}
                    rows={3}
                    className={`w-full px-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-slate-500 focus:border-slate-500 ${
                      errors.adresse ? "border-red-300" : "border-slate-300"
                    }`}
                    placeholder="Adresse complète"
                  />
                  {errors.adresse && (
                    <p className="text-red-600 text-sm mt-1">
                      {errors.adresse}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-6 border-t border-slate-200">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-700 text-white rounded-lg hover:bg-slate-800 transition-colors flex items-center space-x-2"
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
