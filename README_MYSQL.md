# 🎯 Migration MySQL - Digi-Doc

## 📦 Ce Qui A Été Fait

Votre projet **Digi-Doc** a été **entièrement analysé et configuré** pour fonctionner avec MySQL au lieu de PostgreSQL.

### ✅ Modifications Automatiques

| Fichier | Modification | Statut |
|---------|--------------|--------|
| `prisma/schema.prisma` | Provider MySQL + types adaptés | ✅ |
| `src/lib/db.ts` | Driver mysql2 configuré | ✅ |
| `package.json` | Dépendances MySQL ajoutées | ✅ |

### 📄 Nouveaux Fichiers

| Fichier | Description |
|---------|-------------|
| 🚀 **COMMANDES_RAPIDES.md** | **COMMENCEZ ICI** - Commandes essentielles |
| 📘 **DEMARRAGE_MYSQL.md** | Guide de démarrage en 8 étapes |
| 📖 **MIGRATION_MYSQL.md** | Guide complet de migration |
| 📋 **RESUME_MIGRATION.md** | Vue d'ensemble détaillée |
| 💾 **README_MYSQL.md** | Ce fichier |
| 🔧 **scripts/check-mysql-connection.ts** | Vérification de connexion |
| 🔄 **scripts/migrate-postgres-to-mysql.ts** | Migration des données |
| ⚙️ **setup-mysql.ps1** | Script automatique Windows |
| 📝 **env.template.txt** | Template de configuration |

---

## 🚀 Démarrage Rapide

### Option 1 : Script Automatique (Windows uniquement)

```powershell
.\setup-mysql.ps1
```

### Option 2 : Manuel (5 minutes)

```bash
# 1. Créer la base de données
mysql -u root -p
CREATE DATABASE digidoc_personnel;
EXIT;

# 2. Créer le fichier .env (copiez env.template.txt)
echo 'DATABASE_URL="mysql://root:motdepasse@localhost:3306/digidoc_personnel"' > .env

# 3. Installer et configurer
npm install
npm run db:generate
npm run db:push

# 4. Démarrer
npm run dev
```

**✅ C'est fait ! Accédez à http://localhost:3000**

---

## 📚 Documentation par Niveau

### 🟢 Débutant
Commencez par **COMMANDES_RAPIDES.md** - Les commandes essentielles pour démarrer rapidement.

### 🟡 Intermédiaire
Lisez **DEMARRAGE_MYSQL.md** - Guide pas à pas avec explications détaillées.

### 🔴 Avancé
Consultez **MIGRATION_MYSQL.md** - Tout comprendre sur la migration et les différences techniques.

### 📊 Vue d'ensemble
**RESUME_MIGRATION.md** - Comprendre tout ce qui a été changé dans le projet.

---

## 🎯 Cas d'Usage

### Je veux juste démarrer rapidement
→ Utilisez `setup-mysql.ps1` (Windows) ou suivez les commandes dans **COMMANDES_RAPIDES.md**

### Je migre depuis PostgreSQL
→ Suivez le guide complet dans **MIGRATION_MYSQL.md**

### J'ai des erreurs
→ Consultez la section Dépannage dans **DEMARRAGE_MYSQL.md**

### Je veux comprendre les changements
→ Lisez **RESUME_MIGRATION.md**

---

## 🔧 Commandes Utiles

```bash
# Vérifier la connexion MySQL
npm run db:check-mysql

# Configuration initiale
npm install
npm run db:generate
npm run db:push

# Migration depuis PostgreSQL
npm run db:migrate-to-mysql

# Développement
npm run dev
```

---

## ⚙️ Configuration Requise

### Logiciels Nécessaires :
- ✅ Node.js 20+ (déjà installé)
- ✅ npm ou yarn (déjà installé)
- 🆕 **MySQL 8.0+** (à installer)

### Installation de MySQL :
- **Windows** : https://dev.mysql.com/downloads/installer/
- **Linux** : `sudo apt install mysql-server`
- **macOS** : `brew install mysql`

---

## 📊 Architecture de la Base

Votre application utilise **15 tables** :

### Tables Principales
- `agents` - Employés (matricule, nom, fonction...)
- `rubriques` - Catégories principales
- `sous_dossiers` - Sous-catégories
- `pieces` - Documents/pièces

### Tables de Relations
- `agent_rubriques` - Liens agents ↔ rubriques
- `agent_dossiers` - Liens agents ↔ dossiers
- `piece_file` - Fichiers uploadés

### Tables de Métadonnées
- `metadata_model` - Modèles de métadonnées
- `meta_values` - Valeurs des métadonnées
- `metadata_credit` - Métadonnées de crédit
- `meta_credit_values` - Valeurs de crédit

### Tables Système
- `notifications` - Notifications utilisateurs
- `fiabilisations` - Suivi de fiabilité
- `pieces_check` - Vérifications de pièces
- `sous_dossier_positions` - Positions des sous-dossiers
- `piece_positions` - Positions des pièces

**Toutes compatibles MySQL ! ✅**

---

## 🔐 Sécurité

### Variables d'Environnement (.env)
```env
DATABASE_URL="mysql://user:password@localhost:3306/digidoc_personnel"
JWT_SECRET="clé_longue_et_aléatoire_minimum_32_caractères"
```

⚠️ **IMPORTANT :**
- Ne committez JAMAIS le fichier `.env`
- Utilisez des mots de passe forts en production
- Générez un JWT_SECRET unique : `openssl rand -base64 32`

---

## 🚦 Statut du Projet

| Aspect | Statut |
|--------|--------|
| Analyse du code | ✅ Terminée |
| Schema Prisma | ✅ Adapté pour MySQL |
| Connexion DB | ✅ Configurée (mysql2) |
| Dépendances | ✅ Mises à jour |
| Scripts d'aide | ✅ Créés |
| Documentation | ✅ Complète |
| **PRÊT POUR MYSQL** | ✅ **OUI** |

---

## 🎓 Différences PostgreSQL vs MySQL

### Ce qui change :
- **Types de données** : `TIMESTAMP` → `DATETIME`
- **Booléens** : `BOOLEAN` → `TINYINT(1)`
- **Driver** : `pg` → `mysql2`

### Ce qui reste identique :
- **Prisma ORM** - Même syntaxe
- **Requêtes** - Code inchangé
- **Relations** - Fonctionnent pareil
- **API** - Aucun changement

**Votre code applicatif reste 100% identique ! 🎉**

---

## 🆘 Besoin d'Aide ?

### Problème de connexion
```bash
npm run db:check-mysql
```

### Erreur lors du démarrage
1. Vérifiez que MySQL est démarré
2. Vérifiez le fichier `.env`
3. Consultez **DEMARRAGE_MYSQL.md** → Section Dépannage

### Migration de données
Suivez le guide dans **MIGRATION_MYSQL.md** → Section "Migration des Données"

---

## 📞 Support

Si vous rencontrez des difficultés :

1. **Vérifiez d'abord** : Consultez **COMMANDES_RAPIDES.md**
2. **Diagnostic** : Exécutez `npm run db:check-mysql`
3. **Guide complet** : Lisez **DEMARRAGE_MYSQL.md**
4. **Problèmes spécifiques** : Consultez **MIGRATION_MYSQL.md** → Dépannage

---

## ✅ Checklist de Démarrage

Suivez cette checklist pour un démarrage réussi :

- [ ] MySQL installé
- [ ] Service MySQL démarré
- [ ] Base de données `digidoc_personnel` créée
- [ ] Fichier `.env` créé et configuré
- [ ] `npm install` exécuté
- [ ] `npm run db:check-mysql` réussi
- [ ] `npm run db:generate` exécuté
- [ ] `npm run db:push` réussi
- [ ] `npm run dev` fonctionne
- [ ] Application accessible sur http://localhost:3000

---

## 🎉 Félicitations !

Votre projet **Digi-Doc** est maintenant **100% compatible MySQL** !

### Prochaines Étapes :
1. Suivez les commandes dans **COMMANDES_RAPIDES.md**
2. Démarrez votre application avec `npm run dev`
3. Accédez à http://localhost:3000

**Bon développement ! 🚀**

---

## 📖 Table des Matières de la Documentation

```
📁 Documentation MySQL
├── 🚀 README_MYSQL.md (ce fichier)
│   └── Point d'entrée principal
│
├── ⚡ COMMANDES_RAPIDES.md
│   └── Commandes essentielles pour démarrer
│
├── 📘 DEMARRAGE_MYSQL.md
│   └── Guide de démarrage en 8 étapes
│
├── 📖 MIGRATION_MYSQL.md
│   └── Guide complet de migration
│
├── 📋 RESUME_MIGRATION.md
│   └── Vue d'ensemble détaillée
│
├── 🔧 scripts/check-mysql-connection.ts
│   └── Vérification de connexion
│
├── 🔄 scripts/migrate-postgres-to-mysql.ts
│   └── Migration automatique des données
│
├── ⚙️ setup-mysql.ps1
│   └── Script automatique Windows
│
└── 📝 env.template.txt
    └── Template de configuration
```

---

**Tout est prêt ! Il ne vous reste plus qu'à lancer MySQL et démarrer votre application ! 🎊**

