# 📊 Guide de Migration et Administration de Base de Données

Ce guide explique comment utiliser le système de migration et d'administration de base de données intégré à votre application Digi-Doc.

## 🚀 Fonctionnalités Disponibles

### 1. **Système de Migration Automatisé**

- Initialisation complète de la base de données
- Génération automatique du client Prisma
- Migration des schémas
- Reset de la base de données
- Sauvegarde automatique

### 2. **Documentation Interactive du Schéma**

- Visualisation complète de toutes les tables
- Description détaillée des colonnes
- Relations entre tables
- Index et contraintes
- Statistiques en temps réel

## 📋 Tables de la Base de Données

### **Tables Principales**

#### 🧑‍💼 **agents**

Table centrale contenant toutes les informations des employés/agents.

- **Colonnes clés** : `matricule`, `nom_complet`, `fonction`, `email`, `password`
- **Relations** : Liée aux rubriques, notifications, vérifications de pièces
- **Index** : `matricule`, `email`

#### 📁 **rubriques**

Catégories de documents organisant le système.

- **Colonnes** : `nom`, `description`
- **Relations** : Contient des sous-dossiers, assignée à des agents

#### 📂 **sous_dossiers**

Sous-catégories au sein des rubriques.

- **Colonnes** : `titre`, `description`, `statut`
- **Relations** : Appartient à une rubrique, contient des pièces

#### 📄 **pieces**

Documents uploadés dans le système.

- **Colonnes** : `nom`, `description`, `has_meta`
- **Relations** : Appartient à un sous-dossier, peut avoir des métadonnées

### **Tables de Métadonnées**

#### 🏷️ **metadata_model**

Définit les champs de métadonnées pour chaque type de pièce.

- **Colonnes** : `libelle`, `type`, `obligatoire`
- **Relations** : Appartient à une pièce, a des valeurs

#### 💾 **meta_values**

Stocke les valeurs réelles des métadonnées.

- **Colonnes** : `valeur`
- **Relations** : Appartient à un modèle de métadonnée

### **Tables de Fichiers**

#### 📎 **piece_file**

Informations sur les fichiers physiques uploadés.

- **Colonnes** : `file_path`, `created_at`
- **Relations** : Appartient à une pièce

### **Tables de Suivi**

#### ✅ **pieces_check**

Vérifications effectuées par les agents.

- **Colonnes** : `disponible`, `date_check`
- **Relations** : Liée à une pièce et un agent

#### 🔒 **fiabilisations**

Actions de fiabilisation des pièces.

- **Colonnes** : `piece_nom`, `statut`, `date_update`
- **Relations** : Effectuée par un agent

#### 🔔 **notifications**

Messages envoyés aux agents.

- **Colonnes** : `message`, `type_notif`, `lu`
- **Relations** : Destinée à un agent

### **Tables de Liaison**

#### 🔗 **agent_rubriques**

Liaison entre agents et rubriques assignées.

- **Colonnes** : `agent_id`, `rubrique_id`
- **Relations** : Table de liaison many-to-many

#### 🏷️ **metadata_credit**

Métadonnées de crédit associées aux sous-dossiers.

- **Colonnes** : `nom_meta`, `type_meta`, `created_at`
- **Relations** : Appartient à un sous-dossier

## 🛠️ Utilisation du Système

### **Via l'Interface Web**

1. **Accédez à l'administration** : `/admin/migration`
2. **Initialisez la base** : Cliquez sur "Initialiser la DB"
3. **Vérifiez le statut** : Utilisez "Vérifier le Statut"
4. **Consultez le schéma** : Cliquez sur "Voir le Schéma"

### **Via les Scripts NPM**

```bash
# Initialisation complète (recommandé)
npm run db:setup

# Génération du client Prisma uniquement
npm run db:generate

# Migration des schémas
npm run db:push

# Reset complet (ATTENTION : supprime toutes les données)
npm run db:reset
```

### **Via l'API REST**

```bash
# Vérifier le statut
GET /api/migration

# Initialiser la base de données
POST /api/migration
Content-Type: application/json
{"action": "initialize"}

# Voir le schéma
GET /api/database-schema?action=tables

# Statistiques
GET /api/database-schema?action=stats
```

## 📊 Actions Disponibles

| Action       | Description             | Utilisation                    |
| ------------ | ----------------------- | ------------------------------ |
| `initialize` | Initialisation complète | Première installation          |
| `generate`   | Génère le client Prisma | Après modification du schéma   |
| `migrate`    | Applique les migrations | Changements de structure       |
| `reset`      | Reset complet           | ⚠️ Supprime toutes les données |
| `backup`     | Sauvegarde SQL          | Avant opérations critiques     |
| `status`     | Vérifie l'état          | Diagnostic                     |

## 🔍 Consultation du Schéma

### **Page de Documentation** : `/admin/database-schema`

- **Vue d'ensemble** : Statistiques de toutes les tables
- **Détails des tables** : Colonnes, types, contraintes
- **Relations** : Liens entre tables avec descriptions
- **Index** : Optimisations de performance

### **Fonctionnalités de Visualisation**

- ✅ **Expansion/Collapse** des tables
- 🎨 **Code couleur** pour les types de données
- 🔑 **Icônes** pour les clés primaires/étrangères
- 📊 **Badges** pour les contraintes et index
- 📈 **Statistiques** en temps réel

## ⚠️ Bonnes Pratiques

### **Avant les Migrations**

1. **Sauvegardez** toujours votre base de données
2. **Testez** sur un environnement de développement
3. **Vérifiez** le schéma avant et après

### **Gestion des Erreurs**

- Les erreurs sont affichées en temps réel
- Les logs détaillés sont disponibles
- Possibilité de rollback via reset

### **Performance**

- Les index sont optimisés pour les requêtes fréquentes
- Les relations sont configurées avec les bonnes contraintes
- Les suppressions en cascade évitent les orphelins

## 🚨 Points d'Attention

- **Reset DB** : Supprime **TOUTES** les données définitivement
- **Migrations** : Peuvent prendre du temps sur de gros volumes
- **Sauvegarde** : Nécessite `pg_dump` installé pour PostgreSQL
- **Permissions** : L'utilisateur DB doit avoir les droits de création/modification

## 📞 Support

En cas de problème :

1. Vérifiez les logs dans l'interface d'administration
2. Consultez les détails techniques expandables
3. Utilisez la fonction "Vérifier le Statut" pour diagnostiquer
4. Sauvegardez avant toute opération critique

---

_Ce système est conçu pour simplifier la gestion de votre base de données tout en offrant une visibilité complète sur la structure de vos données._
