"use client";

import { useState, useCallback } from "react";
import { z, ZodSchema } from "zod";

export interface ValidationErrors {
  [key: string]: string | undefined;
}

/**
 * Hook personnalisé pour la validation de formulaires avec Zod
 * @param schema - Schéma Zod pour la validation
 * @param initialValues - Valeurs initiales du formulaire
 * @returns Objet contenant les fonctions et états pour la gestion du formulaire
 */
export function useFormValidation<T extends Record<string, any>>(
  schema: ZodSchema<T>,
  initialValues: T
) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  /**
   * Valide un champ spécifique
   */
  const validateField = useCallback(
    (fieldName: keyof T, value: any) => {
      try {
        // Créer un schéma partiel pour valider uniquement ce champ
        const fieldSchema = schema.shape?.[fieldName as string];
        if (fieldSchema) {
          fieldSchema.parse(value);
          setErrors((prev) => ({ ...prev, [fieldName]: undefined }));
          return true;
        }
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors[0]?.message || "Erreur de validation";
          setErrors((prev) => ({ ...prev, [fieldName]: fieldError }));
          return false;
        }
        return false;
      }
    },
    [schema]
  );

  /**
   * Valide tout le formulaire
   */
  const validateForm = useCallback((): boolean => {
    try {
      schema.parse(values);
      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: ValidationErrors = {};
        error.errors.forEach((err) => {
          const path = err.path[0] as string;
          if (path) {
            newErrors[path] = err.message;
          }
        });
        setErrors(newErrors);
        return false;
      }
      return false;
    }
  }, [schema, values]);

  /**
   * Met à jour la valeur d'un champ et valide si nécessaire
   */
  const setValue = useCallback(
    (fieldName: keyof T, value: any, validate = true) => {
      setValues((prev) => ({ ...prev, [fieldName]: value }));
      
      // Marquer le champ comme touché
      setTouched((prev) => ({ ...prev, [fieldName as string]: true }));
      
      // Valider si le champ a déjà été touché ou si validate est true
      if (validate || touched[fieldName as string]) {
        validateField(fieldName, value);
      }
      
      // Effacer l'erreur si elle existe
      if (errors[fieldName as string]) {
        setErrors((prev) => ({ ...prev, [fieldName as string]: undefined }));
      }
    },
    [validateField, touched, errors]
  );

  /**
   * Marque un champ comme touché
   */
  const setFieldTouched = useCallback((fieldName: keyof T) => {
    setTouched((prev) => ({ ...prev, [fieldName as string]: true }));
    // Valider le champ quand il est touché
    validateField(fieldName, values[fieldName]);
  }, [validateField, values]);

  /**
   * Réinitialise le formulaire
   */
  const reset = useCallback((newValues?: T) => {
    setValues(newValues || initialValues);
    setErrors({});
    setTouched({});
  }, [initialValues]);

  /**
   * Réinitialise uniquement les erreurs
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Obtient l'erreur d'un champ spécifique
   */
  const getFieldError = useCallback(
    (fieldName: keyof T): string | undefined => {
      return errors[fieldName as string];
    },
    [errors]
  );

  /**
   * Vérifie si un champ a une erreur
   */
  const hasFieldError = useCallback(
    (fieldName: keyof T): boolean => {
      return !!errors[fieldName as string];
    },
    [errors]
  );

  /**
   * Vérifie si le formulaire est valide
   */
  const isValid = useCallback((): boolean => {
    try {
      schema.parse(values);
      return true;
    } catch {
      return false;
    }
  }, [schema, values]);

  return {
    values,
    errors,
    touched,
    setValue,
    setFieldTouched,
    validateField,
    validateForm,
    reset,
    clearErrors,
    getFieldError,
    hasFieldError,
    isValid,
  };
}

