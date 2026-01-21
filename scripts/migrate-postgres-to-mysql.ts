/**
 * Script de migration PostgreSQL vers MySQL
 * 
 * Ce script copie les données de PostgreSQL vers MySQL
 * 
 * IMPORTANT : Exécutez ce script AVANT de changer votre DATABASE_URL vers MySQL
 * 
 * Usage: 
 * 1. Assurez-vous que DATABASE_URL pointe vers PostgreSQL
 * 2. Créez une variable MYSQL_URL dans .env
 * 3. Exécutez : npx tsx scripts/migrate-postgres-to-mysql.ts
 */

import { PrismaClient as PostgresClient } from '@prisma/client';
import mysql from 'mysql2/promise';

const POSTGRES_URL = process.env.DATABASE_URL;
const MYSQL_URL = process.env.MYSQL_URL;

async function migrate() {
  console.log('🔄 Début de la migration PostgreSQL → MySQL\n');

  if (!POSTGRES_URL) {
    console.error('❌ Erreur : DATABASE_URL (PostgreSQL) n\'est pas définie');
    process.exit(1);
  }

  if (!MYSQL_URL) {
    console.error('❌ Erreur : MYSQL_URL n\'est pas définie');
    console.log('💡 Ajoutez dans votre .env :');
    console.log('MYSQL_URL="mysql://user:password@localhost:3306/digidoc_personnel"\n');
    process.exit(1);
  }

  console.log('📊 Source (PostgreSQL) :', POSTGRES_URL.replace(/:[^:@]+@/, ':****@'));
  console.log('📊 Destination (MySQL) :', MYSQL_URL.replace(/:[^:@]+@/, ':****@'));
  console.log('');

  const postgresClient = new PostgresClient({
    datasources: { db: { url: POSTGRES_URL } }
  });

  let mysqlConnection: any;

  try {
    // Connexion à MySQL
    console.log('⏳ Connexion à MySQL...');
    mysqlConnection = await mysql.createConnection(MYSQL_URL);
    console.log('✅ Connecté à MySQL\n');

    // Connexion à PostgreSQL
    console.log('⏳ Connexion à PostgreSQL...');
    await postgresClient.$connect();
    console.log('✅ Connecté à PostgreSQL\n');

    // Désactiver les contraintes de clés étrangères temporairement
    await mysqlConnection.query('SET FOREIGN_KEY_CHECKS = 0');

    // Migration des tables dans l'ordre (respect des dépendances)
    
    // 1. Rubriques
    console.log('📦 Migration des rubriques...');
    const rubriques = await postgresClient.rubriques.findMany();
    for (const rubrique of rubriques) {
      await mysqlConnection.execute(
        'INSERT INTO rubriques (id, nom, description) VALUES (?, ?, ?)',
        [rubrique.id, rubrique.nom, rubrique.description]
      );
    }
    console.log(`   ✅ ${rubriques.length} rubriques migrées\n`);

    // 2. Agents
    console.log('📦 Migration des agents...');
    const agents = await postgresClient.agents.findMany();
    for (const agent of agents) {
      await mysqlConnection.execute(
        `INSERT INTO agents (id, matricule, nom_complet, fonction, date_naissance, lieu_naissance, 
         sexe, situation_matrimoniale, adresse, telephone, email, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          agent.id, agent.matricule, agent.nom_complet, agent.fonction,
          agent.date_naissance, agent.lieu_naissance, agent.sexe,
          agent.situation_matrimoniale, agent.adresse, agent.telephone,
          agent.email, agent.created_at, agent.updated_at
        ]
      );
    }
    console.log(`   ✅ ${agents.length} agents migrés\n`);

    // 3. Sous-dossiers
    console.log('📦 Migration des sous-dossiers...');
    const sousDossiers = await postgresClient.sous_dossiers.findMany();
    for (const sd of sousDossiers) {
      await mysqlConnection.execute(
        `INSERT INTO sous_dossiers (id, rubrique_id, titre, description, statut, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [sd.id, sd.rubrique_id, sd.titre, sd.description, sd.statut, sd.created_at, sd.updated_at]
      );
    }
    console.log(`   ✅ ${sousDossiers.length} sous-dossiers migrés\n`);

    // 4. Pièces
    console.log('📦 Migration des pièces...');
    const pieces = await postgresClient.pieces.findMany();
    for (const piece of pieces) {
      await mysqlConnection.execute(
        `INSERT INTO pieces (id, sous_dossier_id, nom, description, created_at, has_meta, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          piece.id, piece.sous_dossier_id, piece.nom, piece.description,
          piece.created_at, piece.has_meta ? 1 : 0, piece.updated_at
        ]
      );
    }
    console.log(`   ✅ ${pieces.length} pièces migrées\n`);

    // 5. Agent-Rubriques
    console.log('📦 Migration des agent_rubriques...');
    const agentRubriques = await postgresClient.agent_rubriques.findMany();
    for (const ar of agentRubriques) {
      await mysqlConnection.execute(
        'INSERT INTO agent_rubriques (id, agent_id, rubrique_id) VALUES (?, ?, ?)',
        [ar.id, ar.agent_id, ar.rubrique_id]
      );
    }
    console.log(`   ✅ ${agentRubriques.length} agent_rubriques migrés\n`);

    // 6. Agent-Dossiers
    console.log('📦 Migration des agent_dossiers...');
    const agentDossiers = await postgresClient.agent_dossiers.findMany();
    for (const ad of agentDossiers) {
      await mysqlConnection.execute(
        `INSERT INTO agent_dossiers (id, agent_id, rubrique_id, sous_dossier_id, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [ad.id, ad.agent_id, ad.rubrique_id, ad.sous_dossier_id, ad.created_at]
      );
    }
    console.log(`   ✅ ${agentDossiers.length} agent_dossiers migrés\n`);

    // 7. Metadata Model
    console.log('📦 Migration des metadata_model...');
    const metadataModels = await postgresClient.metadata_model.findMany();
    for (const mm of metadataModels) {
      await mysqlConnection.execute(
        `INSERT INTO metadata_model (id, piece_id, obligatoire, created_at, description, libelle, type, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          mm.id, mm.piece_id, mm.obligatoire ? 1 : 0, mm.created_at,
          mm.description, mm.libelle, mm.type, mm.updated_at
        ]
      );
    }
    console.log(`   ✅ ${metadataModels.length} metadata_model migrés\n`);

    // 8. Meta Values
    console.log('📦 Migration des meta_values...');
    const metaValues = await postgresClient.meta_values.findMany();
    for (const mv of metaValues) {
      await mysqlConnection.execute(
        `INSERT INTO meta_values (id, meta_model_id, agent_dossier_id, valeur, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [mv.id, mv.meta_model_id, mv.agent_dossier_id, mv.valeur, mv.created_at]
      );
    }
    console.log(`   ✅ ${metaValues.length} meta_values migrés\n`);

    // 9. Piece Files
    console.log('📦 Migration des piece_file...');
    const pieceFiles = await postgresClient.piece_file.findMany();
    for (const pf of pieceFiles) {
      await mysqlConnection.execute(
        `INSERT INTO piece_file (id, id_piece, agent_dossier_id, file_path, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [pf.id, pf.id_piece, pf.agent_dossier_id, pf.file_path, pf.created_at]
      );
    }
    console.log(`   ✅ ${pieceFiles.length} piece_file migrés\n`);

    // 10. Notifications
    console.log('📦 Migration des notifications...');
    const notifications = await postgresClient.notifications.findMany();
    for (const notif of notifications) {
      await mysqlConnection.execute(
        `INSERT INTO notifications (id, agent_id, message, type_notif, date_envoi, lu) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [notif.id, notif.agent_id, notif.message, notif.type_notif, notif.date_envoi, notif.lu ? 1 : 0]
      );
    }
    console.log(`   ✅ ${notifications.length} notifications migrées\n`);

    // 11. Fiabilisations
    console.log('📦 Migration des fiabilisations...');
    const fiabilisations = await postgresClient.fiabilisations.findMany();
    for (const fiab of fiabilisations) {
      await mysqlConnection.execute(
        `INSERT INTO fiabilisations (id, agent_id, piece_nom, statut, date_update) 
         VALUES (?, ?, ?, ?, ?)`,
        [fiab.id, fiab.agent_id, fiab.piece_nom, fiab.statut, fiab.date_update]
      );
    }
    console.log(`   ✅ ${fiabilisations.length} fiabilisations migrées\n`);

    // 12. Pieces Check
    console.log('📦 Migration des pieces_check...');
    const piecesCheck = await postgresClient.pieces_check.findMany();
    for (const pc of piecesCheck) {
      await mysqlConnection.execute(
        `INSERT INTO pieces_check (id, piece_id, disponible, date_check, agent_id) 
         VALUES (?, ?, ?, ?, ?)`,
        [pc.id, pc.piece_id, pc.disponible ? 1 : 0, pc.date_check, pc.agent_id]
      );
    }
    console.log(`   ✅ ${piecesCheck.length} pieces_check migrés\n`);

    // 13. Metadata Credit
    console.log('📦 Migration des metadata_credit...');
    const metadataCredit = await postgresClient.metadata_credit.findMany();
    for (const mc of metadataCredit) {
      await mysqlConnection.execute(
        `INSERT INTO metadata_credit (id, sous_dossier_id, nom_meta, type_meta, created_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [mc.id, mc.sous_dossier_id, mc.nom_meta, mc.type_meta, mc.created_at]
      );
    }
    console.log(`   ✅ ${metadataCredit.length} metadata_credit migrés\n`);

    // 14. Meta Credit Values
    console.log('📦 Migration des meta_credit_values...');
    const metaCreditValues = await postgresClient.meta_credit_values.findMany();
    for (const mcv of metaCreditValues) {
      await mysqlConnection.execute(
        `INSERT INTO meta_credit_values (id, metadata_credit_id, valeur, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?)`,
        [mcv.id, mcv.metadata_credit_id, mcv.valeur, mcv.created_at, mcv.updated_at]
      );
    }
    console.log(`   ✅ ${metaCreditValues.length} meta_credit_values migrés\n`);

    // 15. Positions
    console.log('📦 Migration des positions...');
    const sousDossierPositions = await postgresClient.sous_dossier_positions.findMany();
    for (const pos of sousDossierPositions) {
      await mysqlConnection.execute(
        `INSERT INTO sous_dossier_positions (id, rubrique_id, sous_dossier_id, position, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pos.id, pos.rubrique_id, pos.sous_dossier_id, pos.position, pos.created_at, pos.updated_at]
      );
    }
    console.log(`   ✅ ${sousDossierPositions.length} sous_dossier_positions migrées\n`);

    const piecePositions = await postgresClient.piece_positions.findMany();
    for (const pos of piecePositions) {
      await mysqlConnection.execute(
        `INSERT INTO piece_positions (id, sous_dossier_id, piece_id, position, created_at, updated_at) 
         VALUES (?, ?, ?, ?, ?, ?)`,
        [pos.id, pos.sous_dossier_id, pos.piece_id, pos.position, pos.created_at, pos.updated_at]
      );
    }
    console.log(`   ✅ ${piecePositions.length} piece_positions migrées\n`);

    // Réactiver les contraintes de clés étrangères
    await mysqlConnection.query('SET FOREIGN_KEY_CHECKS = 1');

    console.log('✅ Migration terminée avec succès !\n');
    console.log('🎉 Toutes les données ont été transférées vers MySQL.\n');
    console.log('📝 Prochaines étapes :');
    console.log('   1. Vérifiez les données dans MySQL');
    console.log('   2. Faites une sauvegarde de votre base PostgreSQL');
    console.log('   3. Changez DATABASE_URL vers MySQL dans .env');
    console.log('   4. Testez votre application\n');

  } catch (error: any) {
    console.error('\n❌ Erreur durant la migration :', error.message);
    console.error(error);
    process.exit(1);
  } finally {
    await postgresClient.$disconnect();
    if (mysqlConnection) {
      await mysqlConnection.end();
    }
  }
}

migrate();

