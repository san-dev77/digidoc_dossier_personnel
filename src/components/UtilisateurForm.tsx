"use client";

import { useEffect, useState } from "react";
import { X, Save, Shield, User, Mail, Lock, Building2, Phone } from "lucide-react";
import { Input, Select } from "@/components/forms";
import { useFormValidation } from "@/hooks/useFormValidation";
import { z } from "zod";

interface Role {
  id: number;
  code: string;
  nom: string;
  couleur: string | null;
}

interface UtilisateurData {
  id?: number;
  username: string;
  email: string;
  nom_complet: string;
  password?: string;
  role_id: number;
  telephone?: string | null;
  departement?: string | null;
  statut?: string;
  roles?: Role;
}

interface UtilisateurFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  utilisateur?: UtilisateurData | null;
  roles: Role[];
  mode: "create" | "edit";
}

const utilisateurSchema = z.object({
  username: z.string().min(3, "Au moins 3 caractères").max(50),
  email: z.string().email("Email invalide"),
  nom_complet: z.string().min(1, "Nom complet requis"),
  password: z.union([
    z.string().min(6, "Au moins 6 caractères"),
    z.literal(""),
    z.undefined(),
  ]).optional(),
  role_id: z.string().refine((val) => val !== "" && val !== undefined, {
    message: "Veuillez sélectionner un rôle",
  }),
  telephone: z.union([z.string(), z.literal(""), z.undefined()]).optional(),
  departement: z.union([z.string(), z.literal(""), z.undefined()]).optional(),
});

export default function UtilisateurForm({
  isOpen,
  onClose,
  onSubmit,
  utilisateur,
  roles,
  mode,
}: UtilisateurFormProps) {
  const initialValues = {
    username: "",
    email: "",
    nom_complet: "",
    password: "",
    role_id: "",
    telephone: "",
    departement: "",
  };

  const {
    values: formData,
    errors,
    setValue,
    setFieldTouched,
    validateForm,
    reset,
  } = useFormValidation(utilisateurSchema, initialValues);

  useEffect(() => {
    if (mode === "edit" && utilisateur) {
      reset({
        username: utilisateur.username || "",
        email: utilisateur.email || "",
        nom_complet: utilisateur.nom_complet || "",
        password: "",
        role_id: utilisateur.role_id?.toString() || "",
        telephone: utilisateur.telephone || "",
        departement: utilisateur.departement || "",
      });
    } else {
      reset(initialValues);
    }
  }, [mode, utilisateur, isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit({
        ...formData,
        role_id: parseInt(formData.role_id),
      });
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden border-2 border-gray-200/50 animate-slideUp">
        {/* Header */}
        <div className="bg-gradient-to-r from-red-500 to-pink-600 px-6 py-5 flex items-center justify-between border-b border-gray-200/20">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-white">
              {mode === "create" ? "Nouvel Utilisateur" : "Modifier l'Utilisateur"}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="text-white/80 hover:text-white hover:bg-white/20 p-2 rounded-xl transition-all duration-200 hover:rotate-90"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          {/* Informations de base */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <User className="w-4 h-4 inline mr-2" />
                Nom d'utilisateur
              </label>
              <Input
                value={formData.username}
                onChange={(e) => setValue("username", e.target.value)}
                onBlur={() => setFieldTouched("username")}
                error={errors.username}
                placeholder="ex: jdupont"
                disabled={mode === "edit"} // Username non modifiable en édition
                fullWidth
                label=""
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(e) => setValue("email", e.target.value)}
                onBlur={() => setFieldTouched("email")}
                error={errors.email}
                placeholder="email@digidoc.com"
                fullWidth
                label=""
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Nom complet
            </label>
            <Input
              value={formData.nom_complet}
              onChange={(e) => setValue("nom_complet", e.target.value)}
              onBlur={() => setFieldTouched("nom_complet")}
              error={errors.nom_complet}
              placeholder="Jean Dupont"
              fullWidth
              label=""
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Lock className="w-4 h-4 inline mr-2" />
              Mot de passe {mode === "edit" && "(laisser vide pour ne pas changer)"}
            </label>
            <Input
              type="password"
              value={formData.password}
              onChange={(e) => setValue("password", e.target.value)}
              onBlur={() => setFieldTouched("password")}
              error={errors.password}
              placeholder={mode === "create" ? "Au moins 6 caractères" : "Laisser vide pour conserver"}
              fullWidth
              label=""
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              <Shield className="w-4 h-4 inline mr-2" />
              Rôle
            </label>
            <Select
              value={formData.role_id}
              onChange={(e) => setValue("role_id", e.target.value)}
              onBlur={() => setFieldTouched("role_id")}
              error={errors.role_id}
              options={roles.map(r => ({ value: r.id.toString(), label: r.nom }))}
              placeholder="Sélectionner un rôle"
              fullWidth
              label=""
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Téléphone
              </label>
              <Input
                value={formData.telephone}
                onChange={(e) => setValue("telephone", e.target.value)}
                onBlur={() => setFieldTouched("telephone")}
                error={errors.telephone}
                placeholder="+33 6 12 34 56 78"
                fullWidth
                label=""
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                <Building2 className="w-4 h-4 inline mr-2" />
                Département
              </label>
              <Input
                value={formData.departement}
                onChange={(e) => setValue("departement", e.target.value)}
                onBlur={() => setFieldTouched("departement")}
                error={errors.departement}
                placeholder="Ressources Humaines"
                fullWidth
                label=""
              />
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 bg-white border-2 border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-200 font-semibold hover:shadow-md"
          >
            Annuler
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="button-primary px-6 py-3 flex items-center gap-2"
          >
            <Save className="w-5 h-5" />
            {mode === "create" ? "Créer" : "Enregistrer"}
          </button>
        </div>
      </div>
    </div>
  );
}

