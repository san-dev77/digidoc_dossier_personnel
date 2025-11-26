import { PrismaClient } from "@prisma/client";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);
const prisma = new PrismaClient();

export interface MigrationResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

export class MigrationService {
  /**
   * Vérifie si la base de données est initialisée
   */
  static async checkDatabaseStatus(): Promise<MigrationResult> {
    try {
      // Test de connexion à la base de données
      await prisma.$connect();

      // Vérifier si les tables existent en essayant de compter les agents
      const agentCount = await prisma.agents.count();

      return {
        success: true,
        message: `Base de données connectée. ${agentCount} agents trouvés.`,
        details: { agentCount },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      return {
        success: false,
        message: `Erreur de connexion: ${errorMessage}`,
        details: { error: errorMessage },
      };
    }
  }

  /**
   * Génère le client Prisma
   */
  static async generatePrismaClient(): Promise<MigrationResult> {
    try {
      const { stdout, stderr } = await execAsync("npx prisma generate");

      if (stderr && !stderr.includes("warning")) {
        return {
          success: false,
          message: `Erreur lors de la génération du client: ${stderr}`,
          details: { stderr },
        };
      }

      return {
        success: true,
        message: "Client Prisma généré avec succès",
        details: { stdout },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      return {
        success: false,
        message: `Erreur lors de la génération: ${errorMessage}`,
        details: { error: errorMessage },
      };
    }
  }

  /**
   * Exécute les migrations Prisma
   */
  static async runMigrations(): Promise<MigrationResult> {
    try {
      const { stdout, stderr } = await execAsync(
        "npx prisma db push --accept-data-loss"
      );

      if (stderr && !stderr.includes("warning")) {
        return {
          success: false,
          message: `Erreur lors des migrations: ${stderr}`,
          details: { stderr },
        };
      }

      return {
        success: true,
        message: "Migrations exécutées avec succès",
        details: { stdout },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      return {
        success: false,
        message: `Erreur lors des migrations: ${errorMessage}`,
        details: { error: errorMessage },
      };
    }
  }

  /**
   * Reset complet de la base de données
   */
  static async resetDatabase(): Promise<MigrationResult> {
    try {
      const { stdout, stderr } = await execAsync(
        "npx prisma db push --force-reset"
      );

      if (stderr && !stderr.includes("warning")) {
        return {
          success: false,
          message: `Erreur lors du reset: ${stderr}`,
          details: { stderr },
        };
      }

      return {
        success: true,
        message: "Base de données réinitialisée avec succès",
        details: { stdout },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      return {
        success: false,
        message: `Erreur lors du reset: ${errorMessage}`,
        details: { error: errorMessage },
      };
    }
  }

  /**
   * Initialise complètement la base de données
   */
  static async initializeDatabase(): Promise<MigrationResult> {
    try {
      console.log("🚀 Initialisation de la base de données...");

      // 1. Générer le client Prisma
      console.log("📦 Génération du client Prisma...");
      const generateResult = await this.generatePrismaClient();
      if (!generateResult.success) {
        return generateResult;
      }

      // 2. Exécuter les migrations
      console.log("🔄 Exécution des migrations...");
      const migrationResult = await this.runMigrations();
      if (!migrationResult.success) {
        return migrationResult;
      }

      // 3. Vérifier le statut final
      console.log("✅ Vérification du statut...");
      const statusResult = await this.checkDatabaseStatus();

      return {
        success: true,
        message: "Base de données initialisée avec succès",
        details: {
          generate: generateResult.details,
          migration: migrationResult.details,
          status: statusResult.details,
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      return {
        success: false,
        message: `Erreur lors de l'initialisation: ${errorMessage}`,
        details: { error: errorMessage },
      };
    }
  }

  /**
   * Sauvegarde la base de données (pour PostgreSQL)
   */
  static async backupDatabase(): Promise<MigrationResult> {
    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupFile = `backup_${timestamp}.sql`;

      // Cette commande nécessite pg_dump installé
      const { stdout, stderr } = await execAsync(
        `pg_dump ${process.env.DATABASE_URL} > ${backupFile}`
      );

      if (stderr && !stderr.includes("warning")) {
        return {
          success: false,
          message: `Erreur lors de la sauvegarde: ${stderr}`,
          details: { stderr },
        };
      }

      return {
        success: true,
        message: `Sauvegarde créée: ${backupFile}`,
        details: { backupFile, stdout },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Erreur inconnue";
      return {
        success: false,
        message: `Erreur lors de la sauvegarde: ${errorMessage}`,
        details: { error: errorMessage },
      };
    }
  }
}
