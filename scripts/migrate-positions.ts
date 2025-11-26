import { query } from "../src/lib/db";
import * as fs from "fs";
import * as path from "path";

async function migratePositions() {
  try {
    console.log("🔄 Début de la migration des tables de positions...");

    const sqlFile = path.join(
      __dirname,
      "../prisma/migrations/add_positions_tables.sql"
    );
    const sql = fs.readFileSync(sqlFile, "utf-8");

    // Exécuter le script SQL
    await query(sql);

    console.log("✅ Migration terminée avec succès !");
    console.log("📋 Tables créées :");
    console.log("   - sous_dossier_positions");
    console.log("   - piece_positions");
  } catch (error) {
    console.error("❌ Erreur lors de la migration:", error);
    process.exit(1);
  } finally {
    process.exit(0);
  }
}

migratePositions();

