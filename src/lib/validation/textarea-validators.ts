import { z } from "zod";

/**
 * Validateurs spécifiques pour les textarea avec règles de sécurité
 */

// Validateur pour les descriptions avec protection XSS
export const safeDescriptionSchema = z
  .string()
  .max(1000, "La description ne peut pas dépasser 1000 caractères")
  .refine(
    (val) => {
      // Détecter les tentatives d'injection XSS basiques
      const dangerousPatterns = [
        /<script/i,
        /javascript:/i,
        /onerror=/i,
        /onload=/i,
        /onclick=/i,
        /<iframe/i,
        /<object/i,
        /<embed/i,
      ];
      return !dangerousPatterns.some((pattern) => pattern.test(val));
    },
    {
      message: "Le contenu contient des caractères non autorisés",
    }
  )
  .optional()
  .or(z.literal(""));

// Validateur pour les commentaires
export const commentSchema = z
  .string()
  .min(1, "Le commentaire est requis")
  .max(500, "Le commentaire ne peut pas dépasser 500 caractères")
  .refine(
    (val) => {
      // Vérifier qu'il n'y a pas trop de caractères spéciaux suspects
      const specialCharCount = (val.match(/[<>{}[\]\\]/g) || []).length;
      return specialCharCount < val.length * 0.1; // Moins de 10% de caractères spéciaux
    },
    {
      message: "Le commentaire contient trop de caractères spéciaux",
    }
  );

// Validateur pour les adresses (plus permissif mais avec limites)
export const addressSchema = z
  .string()
  .max(500, "L'adresse ne peut pas dépasser 500 caractères")
  .refine(
    (val) => {
      if (!val) return true;
      // Vérifier qu'il n'y a pas de scripts
      return !/<script/i.test(val);
    },
    {
      message: "L'adresse contient du contenu non autorisé",
    }
  )
  .optional()
  .or(z.literal(""));

// Validateur pour les notes (très permissif mais avec protection basique)
export const notesSchema = z
  .string()
  .max(2000, "Les notes ne peuvent pas dépasser 2000 caractères")
  .refine(
    (val) => {
      if (!val) return true;
      // Protection contre les scripts
      const scriptPattern = /<script[\s\S]*?>[\s\S]*?<\/script>/gi;
      return !scriptPattern.test(val);
    },
    {
      message: "Les notes contiennent du code non autorisé",
    }
  )
  .optional()
  .or(z.literal(""));

// Validateur pour les champs de texte libre avec validation stricte
export const strictTextSchema = z
  .string()
  .min(1, "Ce champ est requis")
  .max(1000, "Ce champ ne peut pas dépasser 1000 caractères")
  .refine(
    (val) => {
      // Vérifier qu'il n'y a pas de balises HTML non autorisées
      const htmlTagPattern = /<[^>]+>/g;
      const tags = val.match(htmlTagPattern) || [];
      
      // Autoriser uniquement les balises de formatage basiques
      const allowedTags = ["b", "i", "u", "strong", "em", "p", "br"];
      const hasUnauthorizedTags = tags.some((tag) => {
        const tagName = tag.replace(/[<>\/]/g, "").split(" ")[0].toLowerCase();
        return !allowedTags.includes(tagName);
      });
      
      return !hasUnauthorizedTags;
    },
    {
      message: "Seules les balises de formatage basiques sont autorisées (b, i, u, strong, em, p, br)",
    }
  );

// Fonction utilitaire pour sanitizer le contenu (version basique)
export function sanitizeTextareaContent(
  content: string,
  options: {
    allowHtml?: boolean;
    allowedTags?: string[];
    maxLength?: number;
  } = {}
): string {
  let sanitized = content;

  // Limiter la longueur
  if (options.maxLength) {
    sanitized = sanitized.slice(0, options.maxLength);
  }

  // Si HTML n'est pas autorisé, échapper tous les caractères HTML
  if (!options.allowHtml) {
    sanitized = sanitized
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;");
  } else if (options.allowedTags && options.allowedTags.length > 0) {
    // Si certains tags sont autorisés, supprimer les autres
    const tagPattern = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
    sanitized = sanitized.replace(tagPattern, (match, tagName) => {
      if (options.allowedTags!.includes(tagName.toLowerCase())) {
        return match;
      }
      return "";
    });
  }

  return sanitized;
}

// Fonction pour détecter les tentatives d'injection
export function detectInjectionAttempts(content: string): {
  hasXSS: boolean;
  hasSQL: boolean;
  hasCommand: boolean;
  warnings: string[];
} {
  const warnings: string[] = [];
  let hasXSS = false;
  let hasSQL = false;
  let hasCommand = false;

  // Détection XSS
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i,
    /<iframe/i,
    /<object/i,
    /<embed/i,
    /eval\(/i,
    /expression\(/i,
  ];

  if (xssPatterns.some((pattern) => pattern.test(content))) {
    hasXSS = true;
    warnings.push("Tentative d'injection XSS détectée");
  }

  // Détection SQL
  const sqlPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b)/i,
    /('|(\\')|(;)|(\\;)|(\|)|(\\|)|(\*)|(\\*)|(%)|(\\%))/i,
    /(\bOR\b.*=.*)/i,
    /(\bAND\b.*=.*)/i,
  ];

  if (sqlPatterns.some((pattern) => pattern.test(content))) {
    hasSQL = true;
    warnings.push("Tentative d'injection SQL détectée");
  }

  // Détection de commandes système
  const commandPatterns = [
    /[;&|`$(){}[\]]/,
    /\b(cat|ls|pwd|whoami|id|uname|ps|kill|rm|mv|cp)\b/i,
    /\.(sh|bat|cmd|exe|ps1)$/i,
  ];

  if (commandPatterns.some((pattern) => pattern.test(content))) {
    hasCommand = true;
    warnings.push("Tentative d'injection de commande détectée");
  }

  return {
    hasXSS,
    hasSQL,
    hasCommand,
    warnings,
  };
}

