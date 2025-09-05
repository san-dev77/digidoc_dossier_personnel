// Types de base pour l'application

export interface Agent {
  id: string;
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  fonction: string;
  dateNaissance: string;
  lieuNaissance: string;
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
}

export interface Rubrique {
  id: string;
  nom: string;
  description: string;
  createdAt: string;
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
  lienFichier: string;
  typeFichier: string;
  tailleFichier: number;
  dateAjout: string;
  statut: "valide" | "en_attente" | "rejeté";
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

// Types pour les formulaires
export interface AgentFormData {
  matricule: string;
  nom: string;
  prenom: string;
  email: string;
  fonction: string;
  dateNaissance: string;
  lieuNaissance: string;
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
}

export interface PieceFormData {
  nom: string;
  fichier: File;
  description?: string;
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
