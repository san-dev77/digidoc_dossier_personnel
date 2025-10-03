import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export interface TableInfo {
  name: string;
  description: string;
  columns: ColumnInfo[];
  relationships: RelationshipInfo[];
  indexes: string[];
  sampleData?: Record<string, unknown>[];
}

export interface ColumnInfo {
  name: string;
  type: string;
  nullable: boolean;
  defaultValue?: string;
  description: string;
  isPrimaryKey: boolean;
  isForeignKey: boolean;
  references?: string;
}

export interface RelationshipInfo {
  type: "one-to-one" | "one-to-many" | "many-to-many" | "many-to-one";
  table: string;
  field: string;
  description: string;
}

export class DatabaseSchemaService {
  /**
   * Obtient la description complète de toutes les tables
   */
  static getTablesDescription(): TableInfo[] {
    return [
      {
        name: "agents",
        description:
          "Table principale des agents/employés du système. Contient toutes les informations personnelles et professionnelles des agents.",
        columns: [
          {
            name: "id",
            type: "Int",
            nullable: false,
            description: "Identifiant unique de l'agent",
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "matricule",
            type: "String (50)",
            nullable: false,
            description: "Numéro de matricule unique de l'agent",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "nom_complet",
            type: "String (255)",
            nullable: false,
            description: "Nom et prénom complet de l'agent",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "fonction",
            type: "String (255)",
            nullable: true,
            description: "Fonction/poste occupé par l'agent",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "date_naissance",
            type: "DateTime (Date)",
            nullable: true,
            description: "Date de naissance de l'agent",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "lieu_naissance",
            type: "String (255)",
            nullable: true,
            description: "Lieu de naissance de l'agent",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "sexe",
            type: "String (255)",
            nullable: true,
            description: "Sexe de l'agent",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "situation_matrimoniale",
            type: "String (50)",
            nullable: true,
            description:
              "Situation matrimoniale (célibataire, marié, divorcé, etc.)",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "adresse",
            type: "String",
            nullable: true,
            description: "Adresse complète de l'agent",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "telephone",
            type: "String (50)",
            nullable: true,
            description: "Numéro de téléphone de l'agent",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "email",
            type: "String (255)",
            nullable: true,
            description: "Adresse email de l'agent",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "password",
            type: "String (255)",
            nullable: false,
            description: "Mot de passe hashé de l'agent",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "created_at",
            type: "DateTime",
            nullable: true,
            defaultValue: "now()",
            description: "Date de création de l'enregistrement",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "updated_at",
            type: "DateTime",
            nullable: true,
            defaultValue: "now()",
            description: "Date de dernière modification",
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        relationships: [
          {
            type: "one-to-many",
            table: "agent_rubriques",
            field: "agent_id",
            description: "Un agent peut être assigné à plusieurs rubriques",
          },
          {
            type: "one-to-many",
            table: "fiabilisations",
            field: "agent_id",
            description:
              "Un agent peut avoir plusieurs fiabilisations de pièces",
          },
          {
            type: "one-to-many",
            table: "notifications",
            field: "agent_id",
            description: "Un agent peut recevoir plusieurs notifications",
          },
          {
            type: "one-to-many",
            table: "pieces_check",
            field: "agent_id",
            description: "Un agent peut vérifier plusieurs pièces",
          },
        ],
        indexes: ["matricule", "email"],
      },
      {
        name: "rubriques",
        description:
          "Table des rubriques/catégories de documents. Organise les différents types de documents du système.",
        columns: [
          {
            name: "id",
            type: "Int",
            nullable: false,
            description: "Identifiant unique de la rubrique",
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "nom",
            type: "String (255)",
            nullable: false,
            description:
              "Nom de la rubrique (ex: Documents d'identité, Diplômes, etc.)",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "description",
            type: "String",
            nullable: true,
            description: "Description détaillée de la rubrique",
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        relationships: [
          {
            type: "one-to-many",
            table: "agent_rubriques",
            field: "rubrique_id",
            description: "Une rubrique peut être assignée à plusieurs agents",
          },
          {
            type: "one-to-many",
            table: "sous_dossiers",
            field: "rubrique_id",
            description: "Une rubrique peut contenir plusieurs sous-dossiers",
          },
        ],
        indexes: ["nom"],
      },
      {
        name: "agent_rubriques",
        description:
          "Table de liaison entre les agents et les rubriques. Définit quelles rubriques sont assignées à quels agents.",
        columns: [
          {
            name: "id",
            type: "Int",
            nullable: false,
            description: "Identifiant unique de la relation",
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "agent_id",
            type: "Int",
            nullable: false,
            description: "Référence vers l'agent",
            isPrimaryKey: false,
            isForeignKey: true,
            references: "agents.id",
          },
          {
            name: "rubrique_id",
            type: "Int",
            nullable: false,
            description: "Référence vers la rubrique",
            isPrimaryKey: false,
            isForeignKey: true,
            references: "rubriques.id",
          },
        ],
        relationships: [
          {
            type: "many-to-one",
            table: "agents",
            field: "agent_id",
            description:
              "Plusieurs assignations peuvent concerner le même agent",
          },
          {
            type: "many-to-one",
            table: "rubriques",
            field: "rubrique_id",
            description:
              "Plusieurs assignations peuvent concerner la même rubrique",
          },
        ],
        indexes: ["agent_id", "rubrique_id"],
      },
      {
        name: "sous_dossiers",
        description:
          "Table des sous-dossiers. Organise les documents par sous-catégories au sein d'une rubrique.",
        columns: [
          {
            name: "id",
            type: "Int",
            nullable: false,
            description: "Identifiant unique du sous-dossier",
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "rubrique_id",
            type: "Int",
            nullable: false,
            description: "Référence vers la rubrique parente",
            isPrimaryKey: false,
            isForeignKey: true,
            references: "rubriques.id",
          },
          {
            name: "titre",
            type: "String (255)",
            nullable: false,
            description: "Titre du sous-dossier",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "description",
            type: "String",
            nullable: true,
            description: "Description du sous-dossier",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "statut",
            type: "String (50)",
            nullable: false,
            defaultValue: "ouvert",
            description: "Statut du sous-dossier (ouvert, fermé, archivé)",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "created_at",
            type: "DateTime",
            nullable: true,
            defaultValue: "now()",
            description: "Date de création du sous-dossier",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "updated_at",
            type: "DateTime",
            nullable: true,
            defaultValue: "now()",
            description: "Date de dernière modification",
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        relationships: [
          {
            type: "many-to-one",
            table: "rubriques",
            field: "rubrique_id",
            description: "Un sous-dossier appartient à une rubrique",
          },
          {
            type: "one-to-many",
            table: "pieces",
            field: "sous_dossier_id",
            description: "Un sous-dossier peut contenir plusieurs pièces",
          },
          {
            type: "one-to-many",
            table: "metadata_credit",
            field: "sous_dossier_id",
            description:
              "Un sous-dossier peut avoir plusieurs métadonnées de crédit",
          },
        ],
        indexes: ["rubrique_id", "statut"],
      },
      {
        name: "pieces",
        description:
          "Table des pièces/documents. Contient les informations sur chaque document uploadé.",
        columns: [
          {
            name: "id",
            type: "Int",
            nullable: false,
            description: "Identifiant unique de la pièce",
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "sous_dossier_id",
            type: "Int",
            nullable: false,
            description: "Référence vers le sous-dossier parent",
            isPrimaryKey: false,
            isForeignKey: true,
            references: "sous_dossiers.id",
          },
          {
            name: "nom",
            type: "String (255)",
            nullable: false,
            description: "Nom de la pièce/document",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "description",
            type: "String",
            nullable: true,
            description: "Description de la pièce",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "has_meta",
            type: "Boolean",
            nullable: true,
            defaultValue: "false",
            description: "Indique si la pièce a des métadonnées associées",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "created_at",
            type: "DateTime",
            nullable: true,
            defaultValue: "now()",
            description: "Date de création de la pièce",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "updated_at",
            type: "DateTime",
            nullable: true,
            defaultValue: "now()",
            description: "Date de dernière modification",
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        relationships: [
          {
            type: "many-to-one",
            table: "sous_dossiers",
            field: "sous_dossier_id",
            description: "Une pièce appartient à un sous-dossier",
          },
          {
            type: "one-to-many",
            table: "metadata_model",
            field: "piece_id",
            description:
              "Une pièce peut avoir plusieurs modèles de métadonnées",
          },
          {
            type: "one-to-many",
            table: "pieces_check",
            field: "piece_id",
            description: "Une pièce peut être vérifiée plusieurs fois",
          },
          {
            type: "one-to-many",
            table: "piece_file",
            field: "id_piece",
            description: "Une pièce peut avoir plusieurs fichiers associés",
          },
        ],
        indexes: ["sous_dossier_id", "has_meta"],
      },
      {
        name: "metadata_model",
        description:
          "Table des modèles de métadonnées. Définit les champs de métadonnées pour chaque type de pièce.",
        columns: [
          {
            name: "id",
            type: "Int",
            nullable: false,
            description: "Identifiant unique du modèle de métadonnée",
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "piece_id",
            type: "Int",
            nullable: false,
            description: "Référence vers la pièce",
            isPrimaryKey: false,
            isForeignKey: true,
            references: "pieces.id",
          },
          {
            name: "libelle",
            type: "String (255)",
            nullable: false,
            description: "Libellé du champ de métadonnée",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "type",
            type: "String (50)",
            nullable: false,
            description: "Type du champ (text, number, date, etc.)",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "description",
            type: "String",
            nullable: true,
            description: "Description du champ",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "obligatoire",
            type: "Boolean",
            nullable: true,
            defaultValue: "false",
            description: "Indique si le champ est obligatoire",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "created_at",
            type: "DateTime",
            nullable: true,
            defaultValue: "now()",
            description: "Date de création du modèle",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "updated_at",
            type: "DateTime",
            nullable: true,
            defaultValue: "now()",
            description: "Date de dernière modification",
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        relationships: [
          {
            type: "many-to-one",
            table: "pieces",
            field: "piece_id",
            description: "Un modèle de métadonnée appartient à une pièce",
          },
          {
            type: "one-to-many",
            table: "meta_values",
            field: "meta_model_id",
            description: "Un modèle peut avoir plusieurs valeurs",
          },
        ],
        indexes: ["piece_id", "obligatoire"],
      },
      {
        name: "meta_values",
        description:
          "Table des valeurs de métadonnées. Stocke les valeurs réelles des métadonnées pour chaque pièce.",
        columns: [
          {
            name: "id",
            type: "Int",
            nullable: false,
            description: "Identifiant unique de la valeur",
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "meta_model_id",
            type: "Int",
            nullable: false,
            description: "Référence vers le modèle de métadonnée",
            isPrimaryKey: false,
            isForeignKey: true,
            references: "metadata_model.id",
          },
          {
            name: "valeur",
            type: "String",
            nullable: false,
            description: "Valeur de la métadonnée",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "created_at",
            type: "DateTime",
            nullable: false,
            defaultValue: "now()",
            description: "Date de création de la valeur",
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        relationships: [
          {
            type: "many-to-one",
            table: "metadata_model",
            field: "meta_model_id",
            description: "Une valeur appartient à un modèle de métadonnée",
          },
        ],
        indexes: ["meta_model_id"],
      },
      {
        name: "piece_file",
        description:
          "Table des fichiers. Stocke les informations sur les fichiers physiques uploadés.",
        columns: [
          {
            name: "id",
            type: "Int",
            nullable: false,
            description: "Identifiant unique du fichier",
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "id_piece",
            type: "Int",
            nullable: false,
            description: "Référence vers la pièce",
            isPrimaryKey: false,
            isForeignKey: true,
            references: "pieces.id",
          },
          {
            name: "file_path",
            type: "String",
            nullable: false,
            description: "Chemin vers le fichier sur le serveur",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "created_at",
            type: "DateTime",
            nullable: false,
            defaultValue: "now()",
            description: "Date de création du fichier",
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        relationships: [
          {
            type: "many-to-one",
            table: "pieces",
            field: "id_piece",
            description: "Un fichier appartient à une pièce",
          },
        ],
        indexes: ["id_piece"],
      },
      {
        name: "pieces_check",
        description:
          "Table de vérification des pièces. Enregistre les vérifications effectuées par les agents.",
        columns: [
          {
            name: "id",
            type: "Int",
            nullable: false,
            description: "Identifiant unique de la vérification",
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "piece_id",
            type: "Int",
            nullable: false,
            description: "Référence vers la pièce vérifiée",
            isPrimaryKey: false,
            isForeignKey: true,
            references: "pieces.id",
          },
          {
            name: "agent_id",
            type: "Int",
            nullable: false,
            description: "Référence vers l'agent qui a vérifié",
            isPrimaryKey: false,
            isForeignKey: true,
            references: "agents.id",
          },
          {
            name: "disponible",
            type: "Boolean",
            nullable: false,
            description: "Indique si la pièce est disponible/disponible",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "date_check",
            type: "DateTime",
            nullable: false,
            defaultValue: "now()",
            description: "Date de la vérification",
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        relationships: [
          {
            type: "many-to-one",
            table: "pieces",
            field: "piece_id",
            description: "Une vérification concerne une pièce",
          },
          {
            type: "many-to-one",
            table: "agents",
            field: "agent_id",
            description: "Une vérification est effectuée par un agent",
          },
        ],
        indexes: ["piece_id", "agent_id", "date_check"],
      },
      {
        name: "fiabilisations",
        description:
          "Table des fiabilisations. Enregistre les actions de fiabilisation des pièces par les agents.",
        columns: [
          {
            name: "id",
            type: "Int",
            nullable: false,
            description: "Identifiant unique de la fiabilisation",
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "agent_id",
            type: "Int",
            nullable: false,
            description: "Référence vers l'agent qui a fiabilisé",
            isPrimaryKey: false,
            isForeignKey: true,
            references: "agents.id",
          },
          {
            name: "piece_nom",
            type: "String (255)",
            nullable: false,
            description: "Nom de la pièce fiabilisée",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "statut",
            type: "String (255)",
            nullable: false,
            description: "Statut de la fiabilisation",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "date_update",
            type: "DateTime",
            nullable: true,
            defaultValue: "now()",
            description: "Date de la fiabilisation",
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        relationships: [
          {
            type: "many-to-one",
            table: "agents",
            field: "agent_id",
            description: "Une fiabilisation est effectuée par un agent",
          },
        ],
        indexes: ["agent_id", "date_update"],
      },
      {
        name: "notifications",
        description:
          "Table des notifications. Stocke les notifications envoyées aux agents.",
        columns: [
          {
            name: "id",
            type: "Int",
            nullable: false,
            description: "Identifiant unique de la notification",
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "agent_id",
            type: "Int",
            nullable: false,
            description: "Référence vers l'agent destinataire",
            isPrimaryKey: false,
            isForeignKey: true,
            references: "agents.id",
          },
          {
            name: "message",
            type: "String",
            nullable: false,
            description: "Contenu du message de notification",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "type_notif",
            type: "String (255)",
            nullable: false,
            description: "Type de notification (info, warning, error, etc.)",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "lu",
            type: "Boolean",
            nullable: true,
            defaultValue: "false",
            description: "Indique si la notification a été lue",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "date_envoi",
            type: "DateTime",
            nullable: true,
            defaultValue: "now()",
            description: "Date d'envoi de la notification",
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        relationships: [
          {
            type: "many-to-one",
            table: "agents",
            field: "agent_id",
            description: "Une notification est destinée à un agent",
          },
        ],
        indexes: ["agent_id", "lu", "date_envoi"],
      },
      {
        name: "metadata_credit",
        description:
          "Table des métadonnées de crédit. Stocke les informations de métadonnées de crédit associées aux sous-dossiers.",
        columns: [
          {
            name: "id",
            type: "Int",
            nullable: false,
            description: "Identifiant unique de la métadonnée de crédit",
            isPrimaryKey: true,
            isForeignKey: false,
          },
          {
            name: "sous_dossier_id",
            type: "Int",
            nullable: false,
            description: "Référence vers le sous-dossier",
            isPrimaryKey: false,
            isForeignKey: true,
            references: "sous_dossiers.id",
          },
          {
            name: "nom_meta",
            type: "String (255)",
            nullable: false,
            description: "Nom de la métadonnée de crédit",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "type_meta",
            type: "String (50)",
            nullable: false,
            description:
              "Type de la métadonnée de crédit (text, number, date, etc.)",
            isPrimaryKey: false,
            isForeignKey: false,
          },
          {
            name: "created_at",
            type: "DateTime",
            nullable: false,
            defaultValue: "now()",
            description: "Date de création de la métadonnée de crédit",
            isPrimaryKey: false,
            isForeignKey: false,
          },
        ],
        relationships: [
          {
            type: "many-to-one",
            table: "sous_dossiers",
            field: "sous_dossier_id",
            description:
              "Une métadonnée de crédit appartient à un sous-dossier",
          },
        ],
        indexes: ["sous_dossier_id"],
      },
    ];
  }

  /**
   * Obtient les statistiques de la base de données
   */
  static async getDatabaseStats() {
    try {
      const stats = {
        agents: await prisma.agents.count(),
        rubriques: await prisma.rubriques.count(),
        agentRubriques: await prisma.agent_rubriques.count(),
        sousDossiers: await prisma.sous_dossiers.count(),
        pieces: await prisma.pieces.count(),
        metadataModels: await prisma.metadata_model.count(),
        metaValues: await prisma.meta_values.count(),
        pieceFiles: await prisma.piece_file.count(),
        piecesCheck: await prisma.pieces_check.count(),
        fiabilisations: await prisma.fiabilisations.count(),
        notifications: await prisma.notifications.count(),
        // metadataCredit: await prisma.metadata_credit.count(), // Commenté temporairement jusqu'à la migration
      };

      return {
        success: true,
        data: stats,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      return {
        success: false,
        message: `Erreur lors de la récupération des statistiques: ${errorMessage}`,
      };
    }
  }

  /**
   * Obtient un échantillon de données pour une table donnée
   */
  static async getTableSample(tableName: string, limit: number = 5) {
    try {
      let sample: Record<string, unknown>[] = [];

      switch (tableName) {
        case "agents":
          sample = await prisma.agents.findMany({ take: limit });
          break;
        case "rubriques":
          sample = await prisma.rubriques.findMany({ take: limit });
          break;
        case "sous_dossiers":
          sample = await prisma.sous_dossiers.findMany({ take: limit });
          break;
        case "pieces":
          sample = await prisma.pieces.findMany({ take: limit });
          break;
        case "notifications":
          sample = await prisma.notifications.findMany({ take: limit });
          break;
        case "metadata_credit":
          // sample = await prisma.metadata_credit.findMany({ take: limit }); // Commenté temporairement jusqu'à la migration
          sample = [] as Record<string, unknown>[];
          break;
        default:
          return {
            success: false,
            message: `Table ${tableName} non reconnue`,
          };
      }

      return {
        success: true,
        data: sample,
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Une erreur inconnue est survenue";
      return {
        success: false,
        message: `Erreur lors de la récupération des données: ${errorMessage}`,
      };
    }
  }
}
