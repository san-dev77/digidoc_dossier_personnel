// Types pour les dossiers de crédit

export interface MetadataCredit {
  id: number;
  sous_dossier_id: number;
  nom_meta: string;
  type_meta: string;
  created_at: string;
  meta_credit_values?: MetaCreditValue[];
}

export interface MetaCreditValue {
  id: number;
  metadata_credit_id: number;
  valeur: string;
  created_at: string;
  updated_at?: string;
  metadata_credit?: {
    nom_meta: string;
    type_meta: string;
  };
}

export interface CreditDossierData {
  sousDossier: {
    id: number;
    titre: string;
    description: string;
    rubrique_id: number;
    createdAt: string;
    updatedAt: string;
  };
  metadata: MetadataCredit[];
  totalMetadata: number;
  lastActivity: string;
}

export interface CreditDossierFormData {
  [metadataId: string]: string;
}
