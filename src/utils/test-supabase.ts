// Script de test pour vérifier la connexion Supabase et la structure de la table agents
import { supabase } from "@/lib/supabase";

export const testSupabaseConnection = async () => {
  try {
    console.log("🔍 Test de connexion Supabase...");

    // Test 1: Vérifier la connexion
    const { data: connectionTest, error: connectionError } = await supabase
      .from("agents")
      .select("count")
      .limit(1);

    if (connectionError) {
      console.error("❌ Erreur de connexion:", connectionError);
      return false;
    }

    console.log("✅ Connexion Supabase OK");

    // Test 2: Vérifier la structure de la table
    const { data: structureTest, error: structureError } = await supabase
      .from("agents")
      .select("*")
      .limit(1);

    if (structureError) {
      console.error("❌ Erreur de structure:", structureError);
      return false;
    }

    console.log("✅ Structure de table OK");
    console.log(
      "📋 Colonnes disponibles:",
      structureTest.length > 0 ? Object.keys(structureTest[0]) : "Table vide"
    );

    // Test 3: Essayer d'insérer un agent de test
    const testAgent = {
      matricule: "TEST001",
      nom: "Test",
      prenom: "User",
      email: "test@example.com",
      fonction: "Testeur",
      date_naissance: "1990-01-01",
      lieu_naissance: "Test City",
      sexe: "M",
      situation_matrimoniale: "Célibataire",
      adresse: "123 Test Street",
      telephone: "0123456789",
    };

    const { data: insertTest, error: insertError } = await supabase
      .from("agents")
      .insert([testAgent])
      .select()
      .single();

    if (insertError) {
      console.error("❌ Erreur d'insertion:", insertError);
      return false;
    }

    console.log("✅ Insertion test OK:", insertTest);

    // Nettoyer l'agent de test
    await supabase.from("agents").delete().eq("id", insertTest.id);
    console.log("🧹 Agent de test supprimé");

    return true;
  } catch (error) {
    console.error("❌ Erreur générale:", error);
    return false;
  }
};

// Fonction pour créer la table agents si elle n'existe pas
export const createAgentsTable = async () => {
  try {
    console.log("🔧 Création de la table agents...");

    // Note: Cette requête SQL doit être exécutée dans l'éditeur SQL de Supabase
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS agents (
        id SERIAL PRIMARY KEY,
        matricule VARCHAR(50) UNIQUE NOT NULL,
        nom VARCHAR(100) NOT NULL,
        prenom VARCHAR(100) NOT NULL,
        email VARCHAR(255) NOT NULL,
        fonction VARCHAR(100),
        date_naissance DATE,
        lieu_naissance VARCHAR(100),
        sexe VARCHAR(1) CHECK (sexe IN ('M', 'F')),
        situation_matrimoniale VARCHAR(20) CHECK (situation_matrimoniale IN ('Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve')),
        adresse TEXT,
        telephone VARCHAR(20),
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    console.log("📝 SQL à exécuter dans Supabase:");
    console.log(createTableSQL);

    return createTableSQL;
  } catch (error) {
    console.error("❌ Erreur lors de la création de la table:", error);
    return null;
  }
};
