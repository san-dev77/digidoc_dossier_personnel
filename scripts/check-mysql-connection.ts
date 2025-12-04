/**
 * Script de vérification de connexion MySQL
 * Utilisez ce script pour vérifier que votre connexion MySQL fonctionne
 * 
 * Usage: npx tsx scripts/check-mysql-connection.ts
 */

import mysql from 'mysql2/promise';

async function checkMySQLConnection() {
  console.log('🔍 Vérification de la connexion MySQL...\n');

  const databaseUrl = process.env.DATABASE_URL;
  
  if (!databaseUrl) {
    console.error('❌ Erreur : DATABASE_URL n\'est pas définie dans le fichier .env');
    console.log('\n💡 Créez un fichier .env avec :');
    console.log('DATABASE_URL="mysql://user:password@localhost:3306/digidoc_personnel"\n');
    process.exit(1);
  }

  console.log('📝 DATABASE_URL trouvée :', databaseUrl.replace(/:[^:@]+@/, ':****@'));

  try {
    console.log('\n⏳ Tentative de connexion...');
    const connection = await mysql.createConnection(databaseUrl);
    
    console.log('✅ Connexion réussie !\n');

    // Test de version MySQL
    const [rows] = await connection.query('SELECT VERSION() as version');
    console.log('🗄️  Version MySQL :', (rows as any)[0].version);

    // Test de la base de données
    const [dbRows] = await connection.query('SELECT DATABASE() as db');
    console.log('📊 Base de données :', (rows as any)[0].db);

    // Liste des tables
    const [tables] = await connection.query('SHOW TABLES');
    console.log('\n📋 Nombre de tables :', (tables as any[]).length);
    
    if ((tables as any[]).length > 0) {
      console.log('   Tables existantes :');
      (tables as any[]).forEach((table: any) => {
        console.log('   - ', Object.values(table)[0]);
      });
    } else {
      console.log('⚠️  Aucune table trouvée. Exécutez : npm run db:push');
    }

    await connection.end();
    
    console.log('\n✅ Tous les tests sont passés avec succès !');
    console.log('\n🚀 Vous pouvez maintenant lancer :');
    console.log('   1. npm run db:generate  (générer le client Prisma)');
    console.log('   2. npm run db:push      (créer les tables)');
    console.log('   3. npm run db:seed      (peupler les données)');
    console.log('   4. npm run dev          (lancer l\'application)\n');

  } catch (error: any) {
    console.error('\n❌ Erreur de connexion :', error.message);
    
    if (error.code === 'ENOTFOUND') {
      console.log('\n💡 L\'hôte MySQL n\'est pas accessible.');
      console.log('   Vérifiez que MySQL est démarré :');
      console.log('   - Windows : net start MySQL');
      console.log('   - Linux/Mac : sudo systemctl start mysql\n');
    } else if (error.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Accès refusé.');
      console.log('   Vérifiez vos identifiants dans DATABASE_URL\n');
    } else if (error.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 La base de données n\'existe pas.');
      console.log('   Créez-la avec :');
      console.log('   mysql -u root -p');
      console.log('   CREATE DATABASE digidoc_personnel;\n');
    }
    
    process.exit(1);
  }
}

checkMySQLConnection();

