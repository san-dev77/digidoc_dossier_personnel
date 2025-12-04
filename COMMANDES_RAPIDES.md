# ⚡ Commandes Rapides - Migration MySQL

## 🚀 Installation Complète en 5 Minutes

### Méthode 1 : Script Automatique (Windows)

```powershell
# Exécutez simplement ce script
.\setup-mysql.ps1
```

**Le script va automatiquement :**
- ✅ Vérifier MySQL
- ✅ Créer la base de données
- ✅ Générer le fichier .env
- ✅ Installer les dépendances
- ✅ Créer les tables
- ✅ Configurer tout le projet

---

### Méthode 2 : Manuel (Toutes plateformes)

#### Étape 1 : Créer la Base de Données
```bash
mysql -u root -p
```
```sql
CREATE DATABASE digidoc_personnel CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
EXIT;
```

#### Étape 2 : Créer le fichier .env
```bash
# Copiez env.template.txt vers .env et modifiez-le
DATABASE_URL="mysql://root:votre_mot_de_passe@localhost:3306/digidoc_personnel"
JWT_SECRET="votre_secret_securise"
```

#### Étape 3 : Installer et Configurer
```bash
npm install
npm run db:check-mysql
npm run db:generate
npm run db:push
npm run dev
```

**C'est tout ! 🎉**

---

## 📋 Commandes Essentielles

### Vérification
```bash
npm run db:check-mysql        # Vérifier la connexion MySQL
```

### Configuration Initiale
```bash
npm install                   # Installer les dépendances
npm run db:generate           # Générer le client Prisma
npm run db:push               # Créer les tables
npm run db:seed               # Peupler (optionnel)
```

### Migration depuis PostgreSQL
```bash
# 1. Configurez MYSQL_URL dans .env
# 2. Créez les tables MySQL
npm run db:push

# 3. Migrez les données
npm run db:migrate-to-mysql

# 4. Changez DATABASE_URL vers MySQL
```

### Développement
```bash
npm run dev                   # Démarrer en mode dev
npm run build                 # Build de production
npm run start                 # Démarrer en production
```

### Maintenance
```bash
npm run db:reset              # Réinitialiser la base
npm run db:status             # Voir le statut
```

---

## 🔧 Services MySQL

### Windows
```powershell
# Démarrer MySQL
net start MySQL80

# Arrêter MySQL
net stop MySQL80

# Statut
Get-Service MySQL*
```

### Linux
```bash
# Démarrer MySQL
sudo systemctl start mysql

# Arrêter MySQL
sudo systemctl stop mysql

# Statut
sudo systemctl status mysql
```

### macOS
```bash
# Démarrer MySQL
brew services start mysql

# Arrêter MySQL
brew services stop mysql

# Statut
brew services list | grep mysql
```

---

## 🆘 Dépannage Rapide

### Problème : MySQL ne démarre pas
```bash
# Windows
net start MySQL80

# Linux
sudo systemctl start mysql

# macOS
brew services start mysql
```

### Problème : Accès refusé
```sql
-- Vérifiez/réinitialisez le mot de passe
ALTER USER 'root'@'localhost' IDENTIFIED BY 'nouveau_mot_de_passe';
FLUSH PRIVILEGES;
```

### Problème : Base de données inconnue
```sql
CREATE DATABASE digidoc_personnel;
```

### Problème : Erreur de connexion dans l'app
```bash
# 1. Vérifiez le fichier .env
cat .env

# 2. Testez la connexion
npm run db:check-mysql

# 3. Régénérez le client
npm run db:generate
```

---

## 📁 Fichiers Importants

| Fichier | Description |
|---------|-------------|
| `.env` | **Configuration de la base de données** |
| `prisma/schema.prisma` | Schéma de la base |
| `package.json` | Dépendances et scripts |

---

## 🎯 Workflow Quotidien

```bash
# Chaque matin
npm run dev

# Si vous modifiez le schéma
npm run db:push

# Si vous ajoutez des données de test
npm run db:seed

# Avant de commit
npm run build
```

---

## 📚 Documentation Complète

- **DEMARRAGE_MYSQL.md** - Guide de démarrage détaillé
- **MIGRATION_MYSQL.md** - Guide de migration complet
- **RESUME_MIGRATION.md** - Vue d'ensemble du projet

---

## ✅ Checklist de Démarrage

- [ ] MySQL installé
- [ ] Service MySQL démarré
- [ ] Base `digidoc_personnel` créée
- [ ] Fichier `.env` configuré
- [ ] `npm install` exécuté
- [ ] `npm run db:generate` exécuté
- [ ] `npm run db:push` réussi
- [ ] `npm run dev` fonctionne
- [ ] http://localhost:3000 accessible

---

## 🚀 Démarrage Ultra-Rapide

```bash
# Tout en une seule commande (après avoir créé .env)
npm install && npm run db:generate && npm run db:push && npm run dev
```

---

## 🎉 C'est Tout !

Votre projet Digi-Doc est maintenant compatible MySQL.

**Pour plus de détails, consultez :**
- `DEMARRAGE_MYSQL.md` (Guide de démarrage)
- `MIGRATION_MYSQL.md` (Guide complet)

**Bon développement ! 🚀**

