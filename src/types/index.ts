// Types de base pour l'application

export interface Agent {
  id: string;
  matricule: string;
  nom: string; // Nom complet
  prenom: string; // Gardé pour compatibilité, sera vide
  email: string;
  fonction: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: "M" | "F";
  situationMatrimoniale:
    | "Célibataire"
    | "Marié(e)"
    | "Divorcé(e)"
    | "Veuf/Veuve";
  adresse: string;
  telephone: string;
  createdAt: string;
  updatedAt: string;
  // Champs additionnels pour les utilisateurs (optionnels)
  role?: string; // Code du rôle (ex: 'super_admin', 'admin_rh')
  roles?: { code: string; nom?: string; couleur?: string | null } | null; // Rôle provenant de la table roles (utilisateurs)
  userId?: number; // ID utilisateur si c'est un utilisateur connecté
  agentId?: number; // ID agent
  accountType?: string; // 'utilisateur' ou 'agent'
}

export interface Rubrique {
  id: string;
  nom: string;
  description: string;
  created_at: string;
  updatedAt: string;
}

export interface AgentRubrique {
  id: string;
  agentId: string;
  rubriqueId: string;
  dateDebut: string;
  dateFin?: string;
  statut: "active" | "inactive";
  createdAt: string;
  updatedAt: string;
}

export interface SousDossier {
  id: string;
  agentRubriqueId: string;
  rubrique_id: string;
  titre: string;
  description: string;
  dateCreation: string;
  statut: "ouvert" | "fermé" | "archivé";
  documentsCount?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Piece {
  id: string;
  sousDossierId: string;
  nom: string;
  description?: string;
  aMetadonnees: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface MetadataModel {
  id: string;
  nom: string;
  type: "text" | "number" | "date" | "boolean" | "select";
  obligatoire: boolean;
  options?: string[];
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface PieceMetadata {
  id: string;
  pieceId: string;
  metadataModelId: string;
  valeur: string;
  createdAt: string;
  updatedAt: string;
}

export interface PieceWithMetadata extends Piece {
  metadonnees?: MetadataModel[];
}

// Types pour les formulaires (sans password - géré dans utilisateurs)
export interface AgentFormData {
  matricule: string;
  nom_complet: string; // Nom complet (nom et prénom)
  email: string;
  fonction: string;
  date_naissance: string;
  lieu_naissance: string;
  sexe: "M" | "F";
  situationMatrimoniale:
    | "Célibataire"
    | "Marié(e)"
    | "Divorcé(e)"
    | "Veuf/Veuve";
  adresse: string;
  telephone: string;
}

export interface RubriqueFormData {
  nom: string;
  description: string;
}

export interface SousDossierFormData {
  titre: string;
  description: string;
  rubrique_id: string;
  statut?: string;
}

export interface PieceFormData {
  nom: string;
  description?: string;
  has_meta: boolean;
  metadonnees?: Omit<MetadataModel, "id" | "createdAt" | "updatedAt">[];
  fichier?: File;
  rubriqueId?: string;
}

// Types pour les réponses API
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// Types pour les filtres et recherche
export interface AgentFilters {
  fonction?: string;
  sexe?: "M" | "F";
  situationMatrimoniale?: string;
  search?: string;
}

export interface DossierFilters {
  rubriqueId?: string;
  statut?: string;
  dateDebut?: string;
  dateFin?: string;
  search?: string;
}

// Types pour les statistiques
export interface DashboardStats {
  totalAgents: number;
  totalDossiers: number;
  totalPieces: number;
  dossiersOuverts: number;
  dossiersEnAttente: number;
}

// Types pour les notifications
export interface Notification {
  id: string;
  type: "info" | "success" | "warning" | "error";
  titre: string;
  message: string;
  date: string;
  lu: boolean;
}

// Types pour le suivi de disponibilité des pièces
export interface PieceCheck {
  id: string;
  piece_id: string;
  disponible: boolean;
  date_check: string;
  agent_id: string;
}

export interface PieceWithCheck extends Piece {
  pieces_check?: PieceCheck[];
  isDisponible?: boolean | null; // null = non vérifié, true = disponible, false = non disponible
  lastCheckDate?: string;
}

// Types pour les métadonnées des pièces
export interface MetaValue {
  id: string;
  meta_model_id: string;
  valeur: string;
  created_at: string;
  metadataModel?: {
    libelle: string;
    type: string;
    obligatoire: boolean;
  };
}
