-- ============================================
-- SEED : Permissions et Rôles par défaut
-- ============================================

-- Insertion des permissions de base
INSERT INTO permissions (code, nom_affichage, description, categorie) VALUES
-- Permissions AGENTS
('agents.create', 'Créer des agents', 'Peut créer de nouveaux agents dans le système', 'agents'),
('agents.read', 'Consulter les agents', 'Peut voir les informations des agents', 'agents'),
('agents.update', 'Modifier les agents', 'Peut modifier les informations des agents', 'agents'),
('agents.delete', 'Supprimer les agents', 'Peut supprimer des agents du système', 'agents'),
('agents.export', 'Exporter les agents', 'Peut exporter les données agents', 'agents'),
('agents.import', 'Importer les agents', 'Peut importer des agents en masse', 'agents'),

-- Permissions RUBRIQUES
('rubriques.create', 'Créer des rubriques', 'Peut créer de nouvelles rubriques', 'rubriques'),
('rubriques.read', 'Consulter les rubriques', 'Peut voir les rubriques', 'rubriques'),
('rubriques.update', 'Modifier les rubriques', 'Peut modifier les rubriques', 'rubriques'),
('rubriques.delete', 'Supprimer les rubriques', 'Peut supprimer des rubriques', 'rubriques'),

-- Permissions DOSSIERS
('dossiers.create', 'Créer des dossiers', 'Peut créer de nouveaux sous-dossiers', 'dossiers'),
('dossiers.read', 'Consulter les dossiers', 'Peut voir les dossiers', 'dossiers'),
('dossiers.update', 'Modifier les dossiers', 'Peut modifier les dossiers', 'dossiers'),
('dossiers.delete', 'Supprimer les dossiers', 'Peut supprimer des dossiers', 'dossiers'),

-- Permissions PIÈCES
('pieces.create', 'Créer des pièces', 'Peut ajouter de nouvelles pièces', 'pieces'),
('pieces.read', 'Consulter les pièces', 'Peut voir les pièces', 'pieces'),
('pieces.update', 'Modifier les pièces', 'Peut modifier les pièces', 'pieces'),
('pieces.delete', 'Supprimer les pièces', 'Peut supprimer des pièces', 'pieces'),

-- Permissions FICHIERS
('files.upload', 'Téléverser des fichiers', 'Peut uploader des fichiers', 'files'),
('files.download', 'Télécharger des fichiers', 'Peut télécharger des fichiers', 'files'),
('files.delete', 'Supprimer des fichiers', 'Peut supprimer des fichiers', 'files'),

-- Permissions MÉTADONNÉES
('metadata.create', 'Créer des métadonnées', 'Peut créer des champs de métadonnées', 'metadata'),
('metadata.read', 'Consulter les métadonnées', 'Peut voir les métadonnées', 'metadata'),
('metadata.update', 'Modifier les métadonnées', 'Peut modifier les métadonnées', 'metadata'),
('metadata.delete', 'Supprimer les métadonnées', 'Peut supprimer des métadonnées', 'metadata'),

-- Permissions UTILISATEURS
('utilisateurs.create', 'Créer des utilisateurs', 'Peut créer de nouveaux comptes utilisateurs', 'utilisateurs'),
('utilisateurs.read', 'Consulter les utilisateurs', 'Peut voir les utilisateurs', 'utilisateurs'),
('utilisateurs.update', 'Modifier les utilisateurs', 'Peut modifier les comptes utilisateurs', 'utilisateurs'),
('utilisateurs.delete', 'Supprimer les utilisateurs', 'Peut supprimer des utilisateurs', 'utilisateurs'),

-- Permissions RÔLES
('roles.create', 'Créer des rôles', 'Peut créer de nouveaux rôles', 'roles'),
('roles.read', 'Consulter les rôles', 'Peut voir les rôles', 'roles'),
('roles.update', 'Modifier les rôles', 'Peut modifier les rôles et leurs permissions', 'roles'),
('roles.delete', 'Supprimer les rôles', 'Peut supprimer des rôles', 'roles'),

-- Permissions RAPPORTS
('rapports.create', 'Créer des rapports', 'Peut générer des rapports', 'rapports'),
('rapports.read', 'Consulter les rapports', 'Peut voir les rapports', 'rapports'),
('rapports.export', 'Exporter les rapports', 'Peut exporter des rapports', 'rapports'),

-- Permissions PARAMÈTRES
('settings.read', 'Consulter les paramètres', 'Peut voir les paramètres système', 'settings'),
('settings.update', 'Modifier les paramètres', 'Peut modifier les paramètres système', 'settings'),

-- Permissions AUDIT
('audit.read', 'Consulter l\'audit', 'Peut voir les logs d\'audit', 'audit'),
('audit.export', 'Exporter l\'audit', 'Peut exporter les logs d\'audit', 'audit');

-- Création des rôles par défaut
INSERT INTO roles (nom, description, couleur, is_system) VALUES
('Super Administrateur', 'Accès complet à toutes les fonctionnalités du système', '#EF4444', true),
('Administrateur RH', 'Gestion complète des agents et dossiers', '#F59E0B', false),
('Gestionnaire', 'Création et modification des dossiers, consultation des agents', '#3B82F6', false),
('Consultant', 'Consultation en lecture seule et génération de rapports', '#10B981', false);

-- Attribution des permissions au rôle "Super Administrateur" (toutes les permissions)
INSERT INTO role_permissions (role_id, permission_id)
SELECT 1, id FROM permissions;

-- Attribution des permissions au rôle "Administrateur RH"
INSERT INTO role_permissions (role_id, permission_id)
SELECT 2, id FROM permissions 
WHERE code IN (
    'agents.create', 'agents.read', 'agents.update', 'agents.delete', 'agents.export', 'agents.import',
    'rubriques.create', 'rubriques.read', 'rubriques.update', 'rubriques.delete',
    'dossiers.create', 'dossiers.read', 'dossiers.update', 'dossiers.delete',
    'pieces.create', 'pieces.read', 'pieces.update', 'pieces.delete',
    'files.upload', 'files.download', 'files.delete',
    'metadata.create', 'metadata.read', 'metadata.update', 'metadata.delete',
    'utilisateurs.read',
    'rapports.create', 'rapports.read', 'rapports.export',
    'settings.read',
    'audit.read', 'audit.export'
);

-- Attribution des permissions au rôle "Gestionnaire"
INSERT INTO role_permissions (role_id, permission_id)
SELECT 3, id FROM permissions 
WHERE code IN (
    'agents.create', 'agents.read', 'agents.update', 'agents.export',
    'rubriques.create', 'rubriques.read', 'rubriques.update',
    'dossiers.create', 'dossiers.read', 'dossiers.update',
    'pieces.create', 'pieces.read', 'pieces.update',
    'files.upload', 'files.download',
    'metadata.create', 'metadata.read', 'metadata.update',
    'rapports.create', 'rapports.read', 'rapports.export',
    'settings.read'
);

-- Attribution des permissions au rôle "Consultant"
INSERT INTO role_permissions (role_id, permission_id)
SELECT 4, id FROM permissions 
WHERE code IN (
    'agents.read', 'agents.export',
    'rubriques.read',
    'dossiers.read',
    'pieces.read',
    'files.download',
    'metadata.read',
    'rapports.create', 'rapports.read', 'rapports.export'
);

