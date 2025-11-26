import { z } from "zod";

// Schéma de validation pour les emails
export const emailSchema = z
  .string()
  .email("Format d'email invalide")
  .optional()
  .or(z.literal(""))
  .or(z.undefined());

// Schéma de validation pour les téléphones
export const phoneSchema = z
  .union([
    z.string().regex(
      /^[\d\s\-\+\(\)]+$/,
      "Format de téléphone invalide (utilisez uniquement des chiffres, espaces, tirets, + et parenthèses)"
    ),
    z.literal(""),
    z.undefined(),
  ])
  .optional();

// Schéma de validation pour les mots de passe
export const passwordSchema = z
  .string()
  .min(6, "Le mot de passe doit contenir au moins 6 caractères")
  .max(100, "Le mot de passe ne peut pas dépasser 100 caractères")
  .optional();

// Schéma de validation pour les matricules
export const matriculeSchema = z
  .string()
  .min(1, "Le matricule est requis")
  .max(50, "Le matricule ne peut pas dépasser 50 caractères")
  .regex(/^[A-Z0-9\-_]+$/i, "Le matricule ne peut contenir que des lettres, chiffres, tirets et underscores");

// Schéma de validation pour les noms
export const nameSchema = z
  .string()
  .min(1, "Ce champ est requis")
  .max(200, "Ce champ ne peut pas dépasser 200 caractères")
  .regex(/^[a-zA-ZÀ-ÿ\s\-'\.]+$/, "Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes");

// Schéma de validation pour les dates
export const dateSchema = z
  .union([
    z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format de date invalide (YYYY-MM-DD)"),
    z.literal(""),
    z.undefined(),
  ])
  .optional();

// Schéma de validation pour les URLs
export const urlSchema = z
  .string()
  .url("Format d'URL invalide")
  .optional()
  .or(z.literal(""));

// Schéma de validation pour les nombres
export const numberSchema = z
  .string()
  .regex(/^\d+$/, "Ce champ doit être un nombre")
  .optional()
  .or(z.literal(""));

// Schéma de validation pour les textes génériques
export const textSchema = z
  .string()
  .min(1, "Ce champ est requis")
  .max(500, "Ce champ ne peut pas dépasser 500 caractères");

// Schéma de validation pour les descriptions (optionnel mais avec limite si rempli)
export const descriptionSchema = z
  .union([
    z.string().max(1000, "La description ne peut pas dépasser 1000 caractères"),
    z.literal(""),
    z.undefined(),
  ])
  .optional();

// Schéma complet pour Agent
export const agentFormSchema = z.object({
  matricule: matriculeSchema,
  nom_complet: nameSchema,
  email: emailSchema,
  fonction: textSchema,
  date_naissance: dateSchema,
  lieu_naissance: z.union([z.string().max(100), z.literal(""), z.undefined()]).optional(),
  sexe: z.enum(["M", "F"], {
    errorMap: () => ({ message: "Le sexe doit être M ou F" }),
  }),
  situationMatrimoniale: z.string().optional(),
  adresse: z.union([z.string().max(500), z.literal(""), z.undefined()]).optional(),
  telephone: phoneSchema,
  password: passwordSchema.optional(),
});

// Schéma pour Rubrique
export const rubriqueFormSchema = z.object({
  nom: textSchema,
  description: descriptionSchema,
});

// Schéma pour SousDossier
export const sousDossierFormSchema = z.object({
  titre: textSchema,
  description: descriptionSchema,
  rubrique_id: z.string().min(1, "La rubrique est requise"),
});

// Schéma pour Piece
export const pieceFormSchema = z.object({
  nom: textSchema,
  description: descriptionSchema,
  has_meta: z.boolean(),
  sous_dossier_id: z.string().min(1, "Le sous-dossier est requis"),
});

// Schéma pour Metadata
export const metadataFormSchema = z.object({
  nom: textSchema,
  type: z.enum(["text", "number", "date", "email", "url"], {
    errorMap: () => ({ message: "Type invalide" }),
  }),
  obligatoire: z.boolean(),
  description: descriptionSchema,
});

// Types TypeScript dérivés des schémas
export type AgentFormData = z.infer<typeof agentFormSchema>;
export type RubriqueFormData = z.infer<typeof rubriqueFormSchema>;
export type SousDossierFormData = z.infer<typeof sousDossierFormSchema>;
export type PieceFormData = z.infer<typeof pieceFormSchema>;
export type MetadataFormData = z.infer<typeof metadataFormSchema>;

