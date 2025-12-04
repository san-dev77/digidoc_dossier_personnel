-- ============================================
-- Créer le premier Super Administrateur
-- ============================================
-- Ce script crée un compte super admin pour démarrer

-- Insérer le premier utilisateur super admin
-- Username: admin
-- Password: Admin123! (à changer après première connexion)
-- Hash bcrypt de "Admin123!" : $2b$10$5Ll8uY6HhHcVxJKG3jXqMeqVq4lYj0Q.XZGJX9vQXZGIqH8F7VHOy

INSERT INTO utilisateurs (
  username,
  email,
  password,
  nom_complet,
  role_id,
  statut,
  created_at,
  updated_at
) VALUES (
  'admin',
  'admin@digidoc.local',
  '$2b$10$5Ll8uY6HhHcVxJKG3jXqMeqVq4lYj0Q.XZGJX9vQXZGIqH8F7VHOy',
  'Super Administrateur',
  1, -- ID du rôle "Super Administrateur"
  'actif',
  NOW(),
  NOW()
);

-- Vérification
SELECT 
  u.id,
  u.username,
  u.email,
  u.nom_complet,
  r.nom as role,
  u.statut
FROM utilisateurs u
JOIN roles r ON u.role_id = r.id
WHERE u.username = 'admin';

