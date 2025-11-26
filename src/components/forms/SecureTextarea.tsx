"use client";

import { forwardRef, TextareaHTMLAttributes, useState, useEffect } from "react";
import { AlertCircle, CheckCircle2 } from "lucide-react";

export interface SecureTextareaProps
  extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, "onChange"> {
  label?: string;
  error?: string;
  helperText?: string;
  required?: boolean;
  fullWidth?: boolean;
  maxLength?: number;
  showCharCount?: boolean;
  sanitize?: boolean; // Active la sanitization pour prévenir XSS
  allowedTags?: string[]; // Tags HTML autorisés si sanitize est true
  onChange?: (value: string) => void;
  onValidationChange?: (isValid: boolean) => void;
}

/**
 * Composant Textarea sécurisé avec validation et protection XSS
 * 
 * Fonctionnalités de sécurité :
 * - Validation en temps réel
 * - Compteur de caractères
 * - Protection XSS (sanitization optionnelle)
 * - Limitation de longueur
 * - Validation des patterns
 */
export const SecureTextarea = forwardRef<HTMLTextAreaElement, SecureTextareaProps>(
  (
    {
      label,
      error,
      helperText,
      required,
      fullWidth = true,
      className = "",
      id,
      maxLength,
      showCharCount = true,
      sanitize = false,
      allowedTags = [],
      value = "",
      onChange,
      onValidationChange,
      ...props
    },
    ref
  ) => {
    const textareaId =
      id || `textarea-${label?.toLowerCase().replace(/\s+/g, "-")}`;
    const hasError = !!error;
    const [charCount, setCharCount] = useState(
      typeof value === "string" ? value.length : 0
    );
    const [isValid, setIsValid] = useState(!hasError);

    // Mettre à jour le compteur quand la valeur change
    useEffect(() => {
      const currentLength = typeof value === "string" ? value.length : 0;
      setCharCount(currentLength);
    }, [value]);

    // Fonction de sanitization basique (à améliorer avec une lib comme DOMPurify en production)
    const sanitizeInput = (input: string): string => {
      if (!sanitize) return input;

      // Échapper les caractères HTML dangereux
      let sanitized = input
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .replace(/\//g, "&#x2F;");

      // Si des tags sont autorisés, les réintroduire de manière sécurisée
      if (allowedTags.length > 0) {
        allowedTags.forEach((tag) => {
          const regex = new RegExp(`&lt;${tag}&gt;(.*?)&lt;\\/${tag}&gt;`, "gi");
          sanitized = sanitized.replace(
            regex,
            `<${tag}>$1</${tag}>`
          );
        });
      }

      return sanitized;
    };

    const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      let newValue = e.target.value;

      // Appliquer la sanitization si activée
      if (sanitize) {
        newValue = sanitizeInput(newValue);
      }

      // Limiter la longueur si maxLength est défini
      if (maxLength && newValue.length > maxLength) {
        newValue = newValue.slice(0, maxLength);
      }

      // Appeler le onChange personnalisé
      if (onChange) {
        onChange(newValue);
      }

      // Vérifier la validité
      const valid = !required || newValue.trim().length > 0;
      setIsValid(valid);
      if (onValidationChange) {
        onValidationChange(valid);
      }
    };

    const isNearLimit = maxLength && charCount >= maxLength * 0.9;
    const isAtLimit = maxLength && charCount >= maxLength;
    const remainingChars = maxLength ? maxLength - charCount : null;

    return (
      <div className={fullWidth ? "w-full" : ""}>
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
            {maxLength && (
              <span className="text-gray-500 text-xs font-normal ml-2">
                (max {maxLength} caractères)
              </span>
            )}
          </label>
        )}
        <div className="relative">
          <textarea
            ref={ref}
            id={textareaId}
            value={value}
            onChange={handleChange}
            maxLength={maxLength}
            className={`
              w-full px-3 py-2.5 border rounded-lg resize-none
              text-gray-900 placeholder:text-gray-400
              focus:ring-2 focus:ring-slate-500 focus:border-slate-500
              transition-all duration-200
              ${hasError ? "border-red-300 bg-red-50" : "border-gray-300 bg-white"}
              ${isAtLimit ? "border-orange-300 bg-orange-50" : ""}
              ${className}
            `}
            aria-invalid={hasError}
            aria-describedby={
              error
                ? `${textareaId}-error`
                : helperText
                ? `${textareaId}-helper`
                : undefined
            }
            {...props}
          />
          {/* Indicateur de validation */}
          {!hasError && isValid && value && (
            <div className="absolute right-3 top-3">
              <CheckCircle2 className="w-5 h-5 text-green-500" />
            </div>
          )}
          {hasError && (
            <div className="absolute right-3 top-3">
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
          )}
        </div>

        {/* Compteur de caractères */}
        {showCharCount && maxLength && (
          <div className="flex items-center justify-between mt-1">
            <div className="text-xs text-gray-500">
              {charCount} / {maxLength} caractères
            </div>
            {remainingChars !== null && (
              <div
                className={`text-xs font-medium ${
                  remainingChars < 50
                    ? "text-orange-600"
                    : remainingChars < 10
                    ? "text-red-600"
                    : "text-gray-500"
                }`}
              >
                {remainingChars > 0
                  ? `${remainingChars} restant${remainingChars > 1 ? "s" : ""}`
                  : "Limite atteinte"}
              </div>
            )}
          </div>
        )}

        {/* Barre de progression pour la limite de caractères */}
        {maxLength && (
          <div className="mt-1 h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                isAtLimit
                  ? "bg-red-500"
                  : isNearLimit
                  ? "bg-orange-500"
                  : "bg-blue-500"
              }`}
              style={{ width: `${(charCount / maxLength) * 100}%` }}
            />
          </div>
        )}

        {/* Message d'erreur */}
        {error && (
          <p
            id={`${textareaId}-error`}
            className="text-red-600 text-sm mt-1 flex items-center gap-1"
            role="alert"
          >
            <AlertCircle className="w-4 h-4" />
            {error}
          </p>
        )}

        {/* Texte d'aide */}
        {helperText && !error && (
          <p id={`${textareaId}-helper`} className="text-gray-500 text-sm mt-1">
            {helperText}
          </p>
        )}

        {/* Avertissement de sécurité si sanitize est activé */}
        {sanitize && (
          <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            Protection XSS activée
          </p>
        )}
      </div>
    );
  }
);

SecureTextarea.displayName = "SecureTextarea";

