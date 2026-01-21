export interface RoleData {
  id: number;
  code: string;
  nom: string;
  description?: string | null;
  couleur: string | null;
  is_system: boolean;
  _count?: { utilisateurs: number };
}

export interface Utilisateur {
  id: number;
  username: string;
  email: string;
  nom_complet: string;
  role_id: number;
  roles: RoleData;
  statut: string;
  telephone: string | null;
  departement: string | null;
  derniere_connexion: string | null;
  created_at: string;
  agent_id?: number | null;
}

