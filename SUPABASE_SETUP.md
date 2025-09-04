# Configuration Supabase pour DigiDoc

## 1. Créer un projet Supabase

1. Allez sur [supabase.com](https://supabase.com)
2. Créez un nouveau compte ou connectez-vous
3. Créez un nouveau projet
4. Notez votre URL de projet et votre clé API anonyme

## 2. Configuration des variables d'environnement

Créez un fichier `.env.local` à la racine de votre projet avec :

```bash
NEXT_PUBLIC_SUPABASE_URL=votre_url_projet_supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre_cle_api_anonyme
```

## 3. Configuration de la base de données

### Table `users`

Exécutez ce SQL dans l'éditeur SQL de Supabase :

```sql
-- Créer la table users
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  matricule TEXT UNIQUE NOT NULL,
  email TEXT UNIQUE NOT NULL,
  nom TEXT NOT NULL,
  prenom TEXT NOT NULL,
  fonction TEXT,
  date_naissance DATE,
  lieu_naissance TEXT,
  sexe TEXT CHECK (sexe IN ('M', 'F')),
  situation_matrimoniale TEXT CHECK (situation_matrimoniale IN ('Célibataire', 'Marié(e)', 'Divorcé(e)', 'Veuf/Veuve')),
  adresse TEXT,
  telephone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Activer RLS (Row Level Security)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Politique pour permettre aux utilisateurs de voir leurs propres données
CREATE POLICY "Users can view own data" ON users
  FOR SELECT USING (auth.uid() = id);

-- Politique pour permettre aux utilisateurs de modifier leurs propres données
CREATE POLICY "Users can update own data" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Politique pour permettre l'insertion de nouveaux utilisateurs
CREATE POLICY "Users can insert own data" ON users
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Créer un index sur matricule pour les recherches rapides
CREATE INDEX idx_users_matricule ON users(matricule);

-- Créer un index sur email pour les recherches rapides
CREATE INDEX idx_users_email ON users(email);
```

### Fonction de mise à jour automatique

```sql
-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Déclencheur pour appeler la fonction automatiquement
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## 4. Configuration de l'authentification

### Paramètres d'authentification

1. Dans votre projet Supabase, allez dans **Authentication** > **Settings**
2. Configurez les paramètres suivants :
   - **Site URL** : `http://localhost:3000` (développement)
   - **Redirect URLs** :
     - `http://localhost:3000/dashboard`
     - `http://localhost:3000/login`
     - `http://localhost:3000/register`

### Email templates (optionnel)

Vous pouvez personnaliser les templates d'email dans **Authentication** > **Email Templates**

## 5. Test de l'application

1. Démarrez votre application : `npm run dev`
2. Testez l'inscription d'un nouvel utilisateur
3. Testez la connexion avec les identifiants créés
4. Vérifiez que l'utilisateur est redirigé vers le tableau de bord

## 6. Déploiement

### Variables d'environnement de production

Pour le déploiement, mettez à jour les variables d'environnement avec vos URLs de production.

### Base de données de production

Assurez-vous que votre base de données de production a les mêmes tables et politiques que votre base de développement.

## 7. Sécurité

### Politiques RLS

Les politiques RLS garantissent que :

- Les utilisateurs ne peuvent voir que leurs propres données
- Les utilisateurs ne peuvent modifier que leurs propres données
- Seuls les utilisateurs authentifiés peuvent créer des comptes

### Validation des données

L'application valide les données côté client et côté serveur pour assurer l'intégrité des données.

## 8. Dépannage

### Erreurs courantes

1. **"Invalid API key"** : Vérifiez vos variables d'environnement
2. **"Table does not exist"** : Vérifiez que vous avez exécuté le SQL de création des tables
3. **"RLS policy violation"** : Vérifiez que les politiques RLS sont correctement configurées

### Logs

Vérifiez les logs dans la console de votre navigateur et dans le dashboard Supabase pour diagnostiquer les problèmes.

## 9. Fonctionnalités implémentées

- ✅ Authentification par email/mot de passe
- ✅ Connexion par matricule
- ✅ Inscription avec validation des données
- ✅ Protection des routes avec AuthGuard
- ✅ Tableau de bord utilisateur
- ✅ Gestion des sessions
- ✅ Déconnexion sécurisée

## 10. Prochaines étapes

- [ ] Ajouter la validation des emails
- [ ] Implémenter la récupération de mot de passe
- [ ] Ajouter la gestion des rôles utilisateur
- [ ] Implémenter la modification du profil
- [ ] Ajouter la gestion des documents
- [ ] Implémenter les notifications
