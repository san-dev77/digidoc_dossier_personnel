/**
 * Utilitaires pour la gestion des rubriques
 */

export interface Rubrique {
  id: string;
  nom: string;
  description?: string;
}

/**
 * Détecte si une rubrique est un dossier de crédit
 */
export function isDossierCredit(rubrique: Rubrique): boolean {
  const nomLower = rubrique.nom.toLowerCase();
  const descriptionLower = rubrique.description?.toLowerCase() || "";

  // Mots-clés pour identifier les dossiers de crédit
  const creditKeywords = [
    "crédit",
    "credit",
    "dossier de crédit",
    "dossier credit",
    "dossier de prêt",
    "dossier prêt",
    "pret",
    "financement",
    "emprunt",
    "banque",
  ];

  return creditKeywords.some(
    (keyword) =>
      nomLower.includes(keyword) || descriptionLower.includes(keyword)
  );
}

/**
 * Types de métadonnées spécifiques aux dossiers de crédit
 */
export const CREDIT_METADATA_TYPES = [
  { value: "text", label: "Texte" },
  { value: "number", label: "Nombre" },
  { value: "date", label: "Date" },
] as const;

/**
 * Métadonnées par défaut pour les dossiers de crédit
 */
export const DEFAULT_CREDIT_METADATA = [
  { nom_meta: "Montant du crédit", type_meta: "currency" },
  { nom_meta: "Taux d'intérêt", type_meta: "percentage" },
  { nom_meta: "Durée du crédit", type_meta: "number" },
  { nom_meta: "Date de demande", type_meta: "date" },
  { nom_meta: "Statut du dossier", type_meta: "select" },
  { nom_meta: "Agent responsable", type_meta: "text" },
  { nom_meta: "Commentaires", type_meta: "text" },
];
