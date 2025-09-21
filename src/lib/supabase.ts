import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  "https://mxebqeomwpvfeyehwibi.supabase.co";
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14ZWJxZW9td3B2ZmV5ZWh3aWJpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY4NTQ4MTAsImV4cCI6MjA3MjQzMDgxMH0.61f8ukAnkAmNt5ac21RXCDtUMPcvOCV-ogEtKp6AfYE";

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

// Création du client avec persistance de session et auto-refresh activés
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    // Important: utiliser le storage du navigateur côté client
    storage: typeof window !== "undefined" ? window.localStorage : undefined,
    storageKey: "sb-auth",
  },
});

// Types pour les tables
export interface Agent {
  id?: number; // ID auto-incrémenté de la table agents
  matricule: string;
  email: string;
  nom: string;
  prenom: string;
  fonction?: string;
  date_naissance?: string;
  lieu_naissance?: string;
  sexe?: string;
  situation_matrimoniale?: string;
  adresse?: string;
  telephone?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AuthUser {
  id: string;
  email: string;
  matricule: string;
}
