"use client";

import { useEffect, useState } from "react";
import { X, Save, User } from "lucide-react";
import { Agent, AgentFormData } from "@/types";
import { Input, SecureTextarea, Select } from "@/components/forms";
import { useFormValidation } from "@/hooks/useFormValidation";
import { agentFormSchema, type AgentFormData as AgentFormDataZod } from "@/lib/validation/schemas";

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
  const [showOptionalFields, setShowOptionalFields] = useState(false);

  const initialValues: AgentFormDataZod = {
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
  };

  const {
    values: formData,
    errors,
    setValue,
    setFieldTouched,
    validateForm,
    reset,
  } = useFormValidation(agentFormSchema, initialValues);

  useEffect(() => {
    if (mode === "edit" && agent) {
      // Gérer nom_complet depuis la DB ou combiner nom + prenom
      interface AgentWithNomComplet extends Agent {
        nom_complet?: string;
      }
      const agentWithNomComplet = agent as AgentWithNomComplet;
      const nomComplet =
        agentWithNomComplet.nom_complet || `${agent.prenom || ""} ${agent.nom || ""}`.trim();

      reset({
        matricule: agent.matricule || "",
        nom_complet: nomComplet,
        email: agent.email || "",
        fonction: agent.fonction || "",
        date_naissance: agent.date_naissance || "",
        lieu_naissance: agent.lieu_naissance || "",
        sexe: (agent.sexe as "M" | "F") || "M",
        situationMatrimoniale: agent.situationMatrimoniale || "Célibataire",
        adresse: agent.adresse || "",
        telephone: agent.telephone || "",
        password: "",
      });
    } else {
      reset(initialValues);
    }
  }, [mode, agent, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      // Convertir les valeurs pour correspondre au type AgentFormData attendu
      const submitData: AgentFormData = {
        matricule: formData.matricule,
        nom_complet: formData.nom_complet,
        email: formData.email || "", // Convertir undefined en chaîne vide
        fonction: formData.fonction || "",
        date_naissance: formData.date_naissance || "",
        lieu_naissance: formData.lieu_naissance || "",
        sexe: formData.sexe,
        situationMatrimoniale: (formData.situationMatrimoniale ||
          "Célibataire") as "Célibataire" | "Marié(e)" | "Divorcé(e)" | "Veuf/Veuve",
        adresse: formData.adresse || "",
        telephone: formData.telephone || "",
        password: formData.password || undefined,
      };
      onSubmit(submitData);
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
                <Input
                  label="Matricule"
                  value={formData.matricule}
                  onChange={(e) => setValue("matricule", e.target.value)}
                  onBlur={() => setFieldTouched("matricule")}
                  error={errors.matricule}
                  required
                  placeholder="Ex: AG001"
                />

                <Input
                  label="Fonction"
                  value={formData.fonction}
                  onChange={(e) => setValue("fonction", e.target.value)}
                  onBlur={() => setFieldTouched("fonction")}
                  error={errors.fonction}
                  required
                  placeholder="Ex: Manager, Développeur, Chef de projet..."
                />

                <div className="md:col-span-2">
                  <Input
                    label="Nom complet"
                    value={formData.nom_complet}
                    onChange={(e) => setValue("nom_complet", e.target.value)}
                    onBlur={() => setFieldTouched("nom_complet")}
                    error={errors.nom_complet}
                    required
                    placeholder="Ex: Jean Dupont"
                  />
                </div>

                {mode === "create" && (
                  <Input
                    type="password"
                    label="Mot de passe"
                    value={formData.password || ""}
                    onChange={(e) => setValue("password", e.target.value)}
                    onBlur={() => setFieldTouched("password")}
                    error={errors.password}
                    required
                    helperText="Minimum 6 caractères"
                    placeholder="Mot de passe"
                  />
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
                  <Input
                    type="email"
                    label="Email"
                    value={formData.email || ""}
                    onChange={(e) => setValue("email", e.target.value)}
                    onBlur={() => setFieldTouched("email")}
                    error={errors.email}
                    placeholder="Ex: jean.dupont@entreprise.com"
                  />

                  <Input
                    type="tel"
                    label="Téléphone"
                    value={formData.telephone || ""}
                    onChange={(e) => setValue("telephone", e.target.value)}
                    onBlur={() => setFieldTouched("telephone")}
                    error={errors.telephone}
                    placeholder="Ex: 01 23 45 67 89"
                  />

                  <Input
                    type="date"
                    label="Date de naissance"
                    value={formData.date_naissance || ""}
                    onChange={(e) => setValue("date_naissance", e.target.value)}
                    onBlur={() => setFieldTouched("date_naissance")}
                    error={errors.date_naissance}
                  />

                  <Input
                    label="Lieu de naissance"
                    value={formData.lieu_naissance || ""}
                    onChange={(e) => setValue("lieu_naissance", e.target.value)}
                    onBlur={() => setFieldTouched("lieu_naissance")}
                    error={errors.lieu_naissance}
                    placeholder="Ville de naissance"
                  />

                  <Select
                    label="Sexe"
                    value={formData.sexe}
                    onChange={(e) => setValue("sexe", e.target.value as "M" | "F")}
                    onBlur={() => setFieldTouched("sexe")}
                    error={errors.sexe}
                    options={[
                      { value: "M", label: "Masculin" },
                      { value: "F", label: "Féminin" },
                    ]}
                  />

                  <Select
                    label="Situation matrimoniale"
                    value={formData.situationMatrimoniale}
                    onChange={(e) => setValue("situationMatrimoniale", e.target.value)}
                    onBlur={() => setFieldTouched("situationMatrimoniale")}
                    error={errors.situationMatrimoniale}
                    options={[
                      { value: "Célibataire", label: "Célibataire" },
                      { value: "Marié(e)", label: "Marié(e)" },
                      { value: "Divorcé(e)", label: "Divorcé(e)" },
                      { value: "Veuf/Veuve", label: "Veuf/Veuve" },
                    ]}
                  />

                  <div className="md:col-span-2">
                    <SecureTextarea
                      label="Adresse"
                      value={formData.adresse || ""}
                      onChange={(value) => {
                        setValue("adresse", value);
                        setFieldTouched("adresse");
                      }}
                      error={errors.adresse}
                      maxLength={500}
                      sanitize={true}
                      rows={3}
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
