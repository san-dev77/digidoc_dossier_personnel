# 🔄 Guide de Migration PostgreSQL vers MySQL

## 📋 Résumé des Modifications

J'ai automatiquement apporté les modifications suivantes à votre projet :

### ✅ Fichiers Modifiés

1. **`prisma/schema.prisma`**

   - Changement du provider : `postgresql` → `mysql`
   - Ajout de `relationMode = "prisma"` pour une meilleure compatibilité
   - Conversion des types : `@db.Timestamp(6)` → `@db.DateTime(6)`

2. **`src/lib/db.ts`**

   - Remplacement du driver `pg` par `mysql2/promise`
   - Adaptation de la logique de connexion et de requêtes

3. **`package.json`**
   - Remplacement de `pg` et `@types/pg` par `mysql2` et `@types/mysql`

---

## 🚀 Étapes de Migration

### **Étape 1 : Installation de MySQL**

#### Sur Windows :

1. Téléchargez MySQL depuis : https://dev.mysql.com/downloads/installer/
2. Installez MySQL Server et MySQL Workbench
3. Notez le mot de passe root lors de l'installation

#### Sur Linux :

```bash
sudo apt update
sudo apt install mysql-server
sudo mysql_secure_installation
```

#### Sur macOS :

```bash
brew install mysql
brew services start mysql
```

### **Étape 2 : Créer la Base de Données**

Connectez-vous à MySQL :

```bash
mysql -u root -p
```

Créez la base de données :

```sql
CREATE DATABASE digidoc_personnel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'digidoc_user'@'localhost' IDENTIFIED BY 'votre_mot_de_passe';
GRANT ALL PRIVILEGES ON digidoc_personnel.* TO 'digidoc_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### **Étape 3 : Configurer la Variable d'Environnement**

Créez ou modifiez le fichier `.env` à la racine du projet :

```env
# Format MySQL pour Prisma
DATABASE_URL="mysql://digidoc_user:votre_mot_de_passe@localhost:3306/digidoc_personnel"

# Ou avec root (non recommandé en production)
DATABASE_URL="mysql://root:root@localhost:3306/digidoc_personnel"
```

⚠️ **Important** : Remplacez `votre_mot_de_passe` par votre vrai mot de passe MySQL.

### **Étape 4 : Installer les Nouvelles Dépendances**

```bash
# Supprimer les anciennes dépendances PostgreSQL
npm uninstall pg @types/pg

# Installer les nouvelles dépendances MySQL
npm install mysql2 @types/mysql

# Ou simplement
npm install
```

### **Étape 5 : Générer le Client Prisma**

```bash
npm run db:generate
```

### **Étape 6 : Créer les Tables**

```bash
npm run db:push
```

Cette commande va :

- Analyser votre `schema.prisma`
- Créer toutes les tables dans MySQL
- Créer les index et relations

### **Étape 7 : Peupler la Base (Optionnel)**

Si vous avez un fichier seed :

```bash
npm run db:seed
```

### **Étape 8 : Migration des Données (si nécessaire)**

Si vous avez des données existantes dans PostgreSQL à migrer :

#### Option A : Export/Import Manuel

**Export depuis PostgreSQL :**

```bash
pg_dump -U postgres -d digidoc_personnel -F p -f backup.sql
```

**Conversion et Import :**

1. Ouvrez `backup.sql` et adaptez la syntaxe PostgreSQL → MySQL :

   - `SERIAL` → `AUTO_INCREMENT`
   - `TIMESTAMP` → `DATETIME`
   - `BOOLEAN` → `TINYINT(1)`
   - Retirez les syntaxes spécifiques à PostgreSQL

2. Importez dans MySQL :

```bash
mysql -u digidoc_user -p digidoc_personnel < backup_converted.sql
```

#### Option B : Utiliser un Outil de Migration

**Prisma Migrate (Recommandé) :**

```bash
# Dans PostgreSQL, générez un snapshot
npx prisma migrate dev --name snapshot

# Changez la DATABASE_URL vers MySQL
# Puis poussez le schéma
npm run db:push
```

**Outil tiers - pgloader :**

```bash
# Installation
sudo apt install pgloader  # Linux
brew install pgloader       # macOS

# Créer un fichier de configuration pgloader.conf
pgloader postgresql://user:pass@localhost/digidoc_personnel \
         mysql://user:pass@localhost/digidoc_personnel
```

---

## 🔍 Différences PostgreSQL vs MySQL à Noter

| Aspect                     | PostgreSQL          | MySQL                              |
| -------------------------- | ------------------- | ---------------------------------- |
| **Type TIMESTAMP**         | `@db.Timestamp(6)`  | `@db.DateTime(6)`                  |
| **Type TEXT**              | Illimité            | Max 65,535 caractères              |
| **Sensibilité à la casse** | Sensible par défaut | Insensible (dépend du collation)   |
| **SERIAL**                 | Natif               | `AUTO_INCREMENT`                   |
| **BOOLEAN**                | Type natif          | `TINYINT(1)`                       |
| **Relations circulaires**  | Support natif       | Utiliser `relationMode = "prisma"` |

---

## ⚠️ Points d'Attention

### 1. **Types TEXT**

Le model `meta_credit_values` utilise `@db.Text` :

```prisma
valeur String @db.Text
```

En MySQL, TEXT est limité à 65,535 caractères. Si vous avez besoin de plus, utilisez :

- `@db.MediumText` (16 MB)
- `@db.LongText` (4 GB)

### 2. **Indexes**

MySQL a des limitations sur la taille des index. Si vous avez des erreurs, vous devrez peut-être :

```prisma
nom String @db.VarChar(255) // Limiter la taille
```

### 3. **Performance**

- MySQL InnoDB est optimisé pour les lectures
- Pensez à configurer `innodb_buffer_pool_size` dans MySQL

### 4. **Charset et Collation**

Assurez-vous d'utiliser UTF-8 :

```sql
ALTER DATABASE digidoc_personnel
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;
```

---

## 🧪 Vérification

Testez votre migration :

```bash
# Vérifier la connexion
npm run db:status

# Tester l'application
npm run dev
```

Vérifiez que :

- ✅ Les tables sont créées
- ✅ Les relations fonctionnent
- ✅ L'authentification marche
- ✅ Les uploads de fichiers fonctionnent
- ✅ Les requêtes retournent les bonnes données

---

## 🔄 Retour en Arrière (Rollback)

Si vous devez revenir à PostgreSQL :

1. **Restaurez les fichiers originaux :**

   ```bash
   git checkout prisma/schema.prisma src/lib/db.ts package.json
   ```

2. **Réinstallez les dépendances :**

   ```bash
   npm install
   ```

3. **Régénérez Prisma :**
   ```bash
   npm run db:generate
   ```

---

## 📊 Configuration MySQL Optimale

Ajoutez ces paramètres dans `my.cnf` ou `my.ini` :

```ini
[mysqld]
# Encodage
character-set-server=utf8mb4
collation-server=utf8mb4_unicode_ci

# Performance
innodb_buffer_pool_size=1G
innodb_log_file_size=256M
max_connections=200

# Logs
general_log=0
slow_query_log=1
slow_query_log_file=/var/log/mysql/slow-query.log
long_query_time=2
```

---

## 🆘 Dépannage

### Erreur : "Client does not support authentication protocol"

```sql
ALTER USER 'digidoc_user'@'localhost'
IDENTIFIED WITH mysql_native_password BY 'votre_mot_de_passe';
FLUSH PRIVILEGES;
```

### Erreur : "ER_NOT_SUPPORTED_AUTH_MODE"

Installez une version plus récente de mysql2 :

```bash
npm install mysql2@latest
```

### Erreur : "Connection timeout"

Vérifiez que MySQL écoute sur le bon port :

```bash
netstat -an | grep 3306
```

---

## 📞 Support

Si vous rencontrez des problèmes :

1. Vérifiez les logs MySQL : `/var/log/mysql/error.log`
2. Vérifiez les logs de l'application
3. Testez la connexion avec MySQL Workbench

---

## ✅ Checklist de Migration

- [ ] MySQL installé et démarré
- [ ] Base de données créée
- [ ] Utilisateur MySQL créé avec les privilèges
- [ ] `.env` configuré avec la bonne DATABASE_URL
- [ ] `npm install` exécuté
- [ ] `npm run db:generate` exécuté
- [ ] `npm run db:push` exécuté sans erreur
- [ ] `npm run db:seed` exécuté (si applicable)
- [ ] Données migrées (si applicable)
- [ ] Tests de l'application réussis
- [ ] Sauvegarde de l'ancienne base PostgreSQL effectuée

---

**🎉 Félicitations ! Votre application utilise maintenant MySQL !**
