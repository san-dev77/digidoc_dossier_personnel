# 🐧 Guide de Déploiement Linux - Configuration MySQL

## 📋 Vue d'ensemble

Ce guide explique comment configurer votre application Next.js pour se connecter à une base de données MySQL sur un serveur Linux.

---

## 🔧 Configuration de la Base de Données

### 1️⃣ Format de la Variable `DATABASE_URL`

Le format standard pour MySQL est :

```
mysql://USERNAME:PASSWORD@HOST:PORT/DATABASE_NAME
```

### 2️⃣ Exemples de Configuration

#### ✅ **MySQL Local (sur le même serveur)**

```env
DATABASE_URL="mysql://digidoc_user:mon_mot_de_passe@localhost:3306/digidoc_personnel"
```

#### ✅ **MySQL Distant (serveur séparé)**

```env
DATABASE_URL="mysql://digidoc_user:mon_mot_de_passe@192.168.1.100:3306/digidoc_personnel"
```

#### ✅ **MySQL avec Nom de Domaine**

```env
DATABASE_URL="mysql://digidoc_user:mon_mot_de_passe@db.example.com:3306/digidoc_personnel"
```

#### ✅ **MySQL avec SSL (Production)**

```env
DATABASE_URL="mysql://digidoc_user:mon_mot_de_passe@db.example.com:3306/digidoc_personnel?sslaccept=strict"
```

---

## 🚀 Étapes de Configuration sur Linux

### **Étape 1 : Installer MySQL sur Linux**

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install mysql-server

# CentOS/RHEL
sudo yum install mysql-server

# Démarrer MySQL
sudo systemctl start mysql
sudo systemctl enable mysql
```

### **Étape 2 : Sécuriser MySQL**

```bash
sudo mysql_secure_installation
```

### **Étape 3 : Créer la Base de Données et l'Utilisateur**

Connectez-vous à MySQL :

```bash
sudo mysql -u root -p
```

Exécutez ces commandes SQL :

```sql
-- Créer la base de données
CREATE DATABASE digidoc_personnel
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Créer un utilisateur dédié (RECOMMANDÉ)
CREATE USER 'digidoc_user'@'localhost' IDENTIFIED BY 'VOTRE_MOT_DE_PASSE_FORT';

-- Donner tous les privilèges
GRANT ALL PRIVILEGES ON digidoc_personnel.* TO 'digidoc_user'@'localhost';

-- Si l'app est sur un autre serveur, autoriser l'accès distant
CREATE USER 'digidoc_user'@'%' IDENTIFIED BY 'VOTRE_MOT_DE_PASSE_FORT';
GRANT ALL PRIVILEGES ON digidoc_personnel.* TO 'digidoc_user'@'%';

-- Appliquer les changements
FLUSH PRIVILEGES;

-- Vérifier
SHOW DATABASES;
EXIT;
```

### **Étape 4 : Configurer le Fichier `.env`**

Créez ou modifiez le fichier `.env` à la racine du projet :

```env
# ============================================
# CONFIGURATION MYSQL POUR LINUX
# ============================================

# MySQL Local
DATABASE_URL="mysql://digidoc_user:VOTRE_MOT_DE_PASSE@localhost:3306/digidoc_personnel"

# OU MySQL Distant
# DATABASE_URL="mysql://digidoc_user:VOTRE_MOT_DE_PASSE@192.168.1.100:3306/digidoc_personnel"

# ============================================
# AUTRES VARIABLES
# ============================================

# JWT Secret (générez-en un nouveau pour la production)
JWT_SECRET="votre_secret_jwt_tres_securise_minimum_32_caracteres"

# Environnement
NODE_ENV="production"

# URL de l'application
NEXT_PUBLIC_API_URL="https://votre-domaine.com"
```

### **Étape 5 : Tester la Connexion**

```bash
# Vérifier que MySQL est accessible
mysql -u digidoc_user -p digidoc_personnel

# Depuis votre projet
npm run db:check-mysql
```

---

## 🔒 Sécurité pour la Production

### ✅ **Bonnes Pratiques**

1. **Ne JAMAIS utiliser `root` en production**

   ```sql
   -- ❌ MAUVAIS
   DATABASE_URL="mysql://root:password@localhost:3306/digidoc_personnel"

   -- ✅ BON
   DATABASE_URL="mysql://digidoc_user:password@localhost:3306/digidoc_personnel"
   ```

2. **Utiliser des mots de passe forts**

   ```bash
   # Générez un mot de passe aléatoire
   openssl rand -base64 32
   ```

3. **Restreindre l'accès réseau**

   ```sql
   -- Autoriser uniquement localhost
   CREATE USER 'digidoc_user'@'localhost' IDENTIFIED BY 'password';

   -- OU autoriser un IP spécifique
   CREATE USER 'digidoc_user'@'192.168.1.50' IDENTIFIED BY 'password';
   ```

4. **Activer SSL pour les connexions distantes**

   ```env
   DATABASE_URL="mysql://user:pass@host:3306/db?sslaccept=strict"
   ```

5. **Protéger le fichier `.env`**
   ```bash
   # Permissions restrictives
   chmod 600 .env
   ```

---

## 🌐 Configuration pour Accès Distant

Si votre application Next.js est sur un serveur différent de MySQL :

### **1. Autoriser les Connexions Distantes dans MySQL**

Éditez `/etc/mysql/mysql.conf.d/mysqld.cnf` :

```ini
# Commenter ou modifier cette ligne
# bind-address = 127.0.0.1

# Pour autoriser toutes les IP (moins sécurisé)
bind-address = 0.0.0.0

# OU pour autoriser une IP spécifique
bind-address = 192.168.1.100
```

Redémarrez MySQL :

```bash
sudo systemctl restart mysql
```

### **2. Configurer le Firewall**

```bash
# Autoriser le port MySQL (3306)
sudo ufw allow 3306/tcp

# OU pour une IP spécifique uniquement
sudo ufw allow from 192.168.1.50 to any port 3306
```

### **3. Mettre à jour `.env`**

```env
DATABASE_URL="mysql://digidoc_user:password@192.168.1.100:3306/digidoc_personnel"
```

---

## 📝 Variables d'Environnement Détaillées

### **Format Complet avec Options**

```env
# Format de base
DATABASE_URL="mysql://user:pass@host:port/database"

# Avec options SSL
DATABASE_URL="mysql://user:pass@host:port/database?sslaccept=strict"

# Avec timeout
DATABASE_URL="mysql://user:pass@host:port/database?connect_timeout=10"

# Avec pool de connexions
DATABASE_URL="mysql://user:pass@host:port/database?connection_limit=10"
```

### **Options Disponibles**

| Option             | Description                  | Exemple                      |
| ------------------ | ---------------------------- | ---------------------------- |
| `sslaccept`        | Mode SSL                     | `strict`, `accept`, `reject` |
| `connect_timeout`  | Timeout connexion (secondes) | `10`                         |
| `connection_limit` | Limite de connexions         | `10`                         |
| `charset`          | Encodage                     | `utf8mb4`                    |

---

## 🧪 Tests de Connexion

### **Test 1 : Vérification MySQL**

```bash
# Test de connexion directe
mysql -u digidoc_user -p -h localhost digidoc_personnel

# Test depuis un autre serveur
mysql -u digidoc_user -p -h 192.168.1.100 digidoc_personnel
```

### **Test 2 : Script Node.js**

Créez `test-connection.js` :

```javascript
const mysql = require("mysql2/promise");

async function test() {
  try {
    const connection = await mysql.createConnection(process.env.DATABASE_URL);
    console.log("✅ Connexion réussie !");
    const [rows] = await connection.execute("SELECT VERSION()");
    console.log("📊 Version MySQL:", rows[0]["VERSION()"]);
    await connection.end();
  } catch (error) {
    console.error("❌ Erreur:", error.message);
  }
}

test();
```

Exécutez :

```bash
node test-connection.js
```

### **Test 3 : Avec Prisma**

```bash
# Générer le client Prisma
npm run db:generate

# Tester la connexion
npx prisma db pull

# Créer les tables
npm run db:push
```

---

## 🔍 Dépannage

### **Erreur : "Access denied"**

```bash
# Vérifier les utilisateurs MySQL
sudo mysql -u root -p
SELECT user, host FROM mysql.user;

# Réinitialiser le mot de passe
ALTER USER 'digidoc_user'@'localhost' IDENTIFIED BY 'nouveau_mot_de_passe';
FLUSH PRIVILEGES;
```

### **Erreur : "Can't connect to MySQL server"**

```bash
# Vérifier que MySQL est démarré
sudo systemctl status mysql

# Vérifier le port
sudo netstat -tlnp | grep 3306

# Vérifier les logs
sudo tail -f /var/log/mysql/error.log
```

### **Erreur : "Host is not allowed to connect"**

```sql
-- Autoriser l'IP
CREATE USER 'digidoc_user'@'192.168.1.50' IDENTIFIED BY 'password';
GRANT ALL PRIVILEGES ON digidoc_personnel.* TO 'digidoc_user'@'192.168.1.50';
FLUSH PRIVILEGES;
```

### **Erreur : "Too many connections"**

```sql
-- Vérifier les connexions actives
SHOW PROCESSLIST;

-- Augmenter la limite (dans /etc/mysql/mysql.conf.d/mysqld.cnf)
max_connections = 200
```

---

## 📦 Déploiement avec Docker (Optionnel)

Si vous utilisez Docker :

```yaml
# docker-compose.yml
version: "3.8"

services:
  mysql:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: root_password
      MYSQL_DATABASE: digidoc_personnel
      MYSQL_USER: digidoc_user
      MYSQL_PASSWORD: user_password
    ports:
      - "3306:3306"
    volumes:
      - mysql_data:/var/lib/mysql

volumes:
  mysql_data:
```

```env
# .env
DATABASE_URL="mysql://digidoc_user:user_password@localhost:3306/digidoc_personnel"
```

---

## ✅ Checklist de Déploiement

- [ ] MySQL installé et démarré
- [ ] Base de données `digidoc_personnel` créée
- [ ] Utilisateur MySQL créé (pas `root`)
- [ ] Privilèges accordés à l'utilisateur
- [ ] Fichier `.env` configuré avec `DATABASE_URL`
- [ ] Connexion testée avec `npm run db:check-mysql`
- [ ] Prisma client généré (`npm run db:generate`)
- [ ] Tables créées (`npm run db:push`)
- [ ] Données seedées (`npm run db:seed`)
- [ ] Firewall configuré (si accès distant)
- [ ] SSL activé (si connexion distante)
- [ ] Permissions `.env` sécurisées (`chmod 600`)

---

## 🎯 Résumé Rapide

**Pour un déploiement Linux, modifiez uniquement :**

1. **Le fichier `.env`** :

   ```env
   DATABASE_URL="mysql://user:password@host:port/database"
   ```

2. **Les paramètres à changer** :
   - `user` : Nom d'utilisateur MySQL
   - `password` : Mot de passe MySQL
   - `host` : `localhost` (local) ou IP/domaine (distant)
   - `port` : `3306` (par défaut)
   - `database` : `digidoc_personnel`

**C'est tout ! Le reste du code reste identique.** 🎉
