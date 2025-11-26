import type { PieceWithCheck } from "@/types";

export interface SousDossierConformity {
  id: string;
  titre: string;
  description: string;
  createdAt: string;
  pieces: PieceWithCheck[];
  conformityPercentage: number;
  checkedCount: number;
  totalPieces: number;
  status: "all_checked" | "partial_checked" | "none_checked" | "no_pieces";
}

export interface RubriqueConformity {
  rubrique: {
    id: string;
    nom: string;
    description: string;
  };
  sousDossiers: SousDossierConformity[];
  conformityPercentage: number;
  totalPieces: number;
  checkedPieces: number;
}

export interface AgentInfo {
  id: string;
  nom: string;
  matricule: string;
  fonction: string;
  email?: string;
  telephone?: string;
  createdAt: string;
}

export interface ConformityReport {
  agent: AgentInfo;
  rubriques: RubriqueConformity[];
  globalConformity: number;
}

