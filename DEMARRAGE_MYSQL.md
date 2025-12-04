# 🚀 Démarrage Rapide - Migration MySQL

## ✅ Modifications Effectuées

Votre projet a été automatiquement configuré pour MySQL. Voici les changements :

### Fichiers Modifiés :
- ✅ `prisma/schema.prisma` - Provider changé vers MySQL
- ✅ `src/lib/db.ts` - Driver mysql2 configuré
- ✅ `package.json` - Dépendances MySQL ajoutées

### Nouveaux Fichiers :
- 📄 `MIGRATION_MYSQL.md` - Guide complet de migration
- 📄 `DEMARRAGE_MYSQL.md` - Ce fichier
- 📄 `scripts/check-mysql-connection.ts` - Script de vérification
- 📄 `scripts/migrate-postgres-to-mysql.ts` - Script de migration des données

---

## 🎯 Étapes Rapides

### 1️⃣ Installer MySQL (si ce n'est pas déjà fait)

**Windows :**
```powershell
# Téléchargez depuis https://dev.mysql.com/downloads/installer/
# Ou avec Chocolatey :
choco install mysql
```

**Linux :**
```bash
sudo apt update && sudo apt install mysql-server
```

**macOS :**
```bash
brew install mysql
brew services start mysql
```

### 2️⃣ Créer la Base de Données

```bash
# Connectez-vous à MySQL
mysql -u root -p

# Dans MySQL :
CREATE DATABASE digidoc_personnel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

### 3️⃣ Configurer le .env

Créez un fichier `.env` à la racine du projet :

```env
DATABASE_URL="mysql://root:votreMotDePasse@localhost:3306/digidoc_personnel"
JWT_SECRET="votre_secret_jwt_securise"
NODE_ENV="development"
```

⚠️ **Remplacez `votreMotDePasse` par votre vrai mot de passe MySQL !**

### 4️⃣ Installer les Dépendances

```bash
npm install
```

### 5️⃣ Vérifier la Connexion

```bash
npm run db:check-mysql
```

Vous devriez voir :
```
✅ Connexion réussie !
🗄️  Version MySQL : 8.x.x
```

### 6️⃣ Créer les Tables

```bash
# Générer le client Prisma
npm run db:generate

# Créer toutes les tables
npm run db:push
```

### 7️⃣ Peupler les Données (Optionnel)

```bash
npm run db:seed
```

### 8️⃣ Démarrer l'Application

```bash
npm run dev
```

Votre application devrait maintenant tourner sur **http://localhost:3000** ! 🎉

---

## 🔄 Migration depuis PostgreSQL

Si vous avez des données existantes dans PostgreSQL :

### Option 1 : Migration Automatique (Recommandé)

1. **Gardez DATABASE_URL pointant vers PostgreSQL**

2. **Ajoutez MYSQL_URL dans .env :**
```env
DATABASE_URL="postgresql://postgres:root@localhost:5432/digidoc_personnel"
MYSQL_URL="mysql://root:root@localhost:3306/digidoc_personnel"
```

3. **Créez les tables MySQL :**
```bash
# Changez temporairement DATABASE_URL vers MYSQL_URL
# Puis :
npm run db:push
```

4. **Revenez à DATABASE_URL PostgreSQL et exécutez :**
```bash
npm run db:migrate-to-mysql
```

5. **Changez DATABASE_URL définitivement vers MySQL**

6. **Testez l'application**

### Option 2 : Migration Manuelle

Consultez le fichier **MIGRATION_MYSQL.md** pour les détails complets.

---

## 🔍 Vérifications

### Connexion à MySQL :
```bash
npm run db:check-mysql
```

### Lister les Tables :
```bash
mysql -u root -p digidoc_personnel -e "SHOW TABLES;"
```

### Compter les Enregistrements :
```bash
mysql -u root -p digidoc_personnel -e "SELECT COUNT(*) FROM agents;"
```

---

## ⚠️ Problèmes Courants

### ❌ "Access denied for user"
**Solution :** Vérifiez votre mot de passe dans DATABASE_URL

### ❌ "Unknown database"
**Solution :** Créez la base de données :
```sql
CREATE DATABASE digidoc_personnel;
```

### ❌ "Cannot connect to MySQL server"
**Solution :** Vérifiez que MySQL est démarré :
```bash
# Windows
net start MySQL

# Linux
sudo systemctl start mysql

# macOS
brew services start mysql
```

### ❌ "Client does not support authentication protocol"
**Solution :**
```sql
ALTER USER 'root'@'localhost' IDENTIFIED WITH mysql_native_password BY 'votre_mot_de_passe';
FLUSH PRIVILEGES;
```

---

## 📊 Commandes Utiles

```bash
# Vérifier la connexion
npm run db:check-mysql

# Régénérer le client Prisma
npm run db:generate

# Pousser le schéma vers la BD
npm run db:push

# Réinitialiser la base
npm run db:reset

# Peupler avec des données
npm run db:seed

# Migrer depuis PostgreSQL
npm run db:migrate-to-mysql

# Lancer l'app
npm run dev
```

---

## 📚 Documentation

Pour plus de détails, consultez :
- 📄 **MIGRATION_MYSQL.md** - Guide complet de migration
- 📄 **README.md** - Documentation du projet
- 🌐 **[Prisma MySQL Documentation](https://www.prisma.io/docs/concepts/database-connectors/mysql)**

---

## 🎉 Félicitations !

Votre application Digi-Doc utilise maintenant **MySQL** ! 

Si vous avez des questions ou rencontrez des problèmes, n'hésitez pas à consulter le guide complet dans **MIGRATION_MYSQL.md**.

**Bon développement ! 🚀**

