# 🔐 Système d'Authentification JWT

## ✅ Ce qui a été implémenté

### 1. **Authentification JWT**

- ✅ Génération de tokens JWT lors du login/register
- ✅ Vérification automatique des tokens dans le middleware
- ✅ Protection de toutes les routes API (sauf `/api/auth/login` et `/api/auth/register`)

### 2. **Hachage des mots de passe**

- ✅ Mots de passe hashés avec bcrypt (10 rounds)
- ✅ Support de l'ancien format (en clair) pour migration progressive
- ✅ Comparaison sécurisée des mots de passe

### 3. **Middleware de sécurité**

- ✅ Vérification automatique du token sur toutes les routes API
- ✅ Protection des routes administratives (nécessitent le rôle "admin")
- ✅ Headers CORS maintenus

## 🚀 Comment utiliser

### Depuis le navigateur (avec authentification)

**1. Se connecter d'abord :**

```javascript
// Dans la console du navigateur
const response = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    matricule: "VOTRE_MATRICULE",
    password: "VOTRE_MOT_DE_PASSE",
  }),
});

const data = await response.json();
const token = data.token; // Sauvegarder ce token
```

**2. Utiliser le token pour accéder aux routes :**

```javascript
// Stocker le token (expire à la fermeture de l'onglet)
sessionStorage.setItem("auth-token", token);

// Utiliser le token dans les requêtes
const agentsResponse = await fetch("http://localhost:3000/api/agents", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const agents = await agentsResponse.json();
```

### Depuis le frontend de l'application

Le token est automatiquement géré :

- Stocké dans `sessionStorage` après login/register (expire à la fermeture de l'onglet)
- Envoyé automatiquement dans les headers `Authorization`
- Utilisé par le middleware pour vérifier l'authentification

## 🔒 Routes protégées

### Routes publiques (pas d'authentification requise)

- `/api/auth/login`
- `/api/auth/register`

### Routes protégées (authentification requise)

- Toutes les autres routes `/api/*`
- Exemples : `/api/agents`, `/api/upload`, `/api/pieces`, etc.

### Routes administratives (rôle admin requis)

- `/api/migration`
- `/api/database-schema`

## ⚠️ Configuration requise

### Variable d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
JWT_SECRET=votre-secret-super-securise-changez-moi-en-production
JWT_EXPIRES_IN=7d
```

**⚠️ IMPORTANT** : Changez `JWT_SECRET` en production avec une valeur aléatoire forte !

## 📝 Exemple complet

```javascript
// 1. Login
const loginRes = await fetch("http://localhost:3000/api/auth/login", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    matricule: "AG001",
    password: "password123",
  }),
});

const { token, ...user } = await loginRes.json();
console.log("Token:", token);
console.log("User:", user);

// 2. Accéder à une route protégée
const agentsRes = await fetch("http://localhost:3000/api/agents", {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

if (agentsRes.ok) {
  const agents = await agentsRes.json();
  console.log("Agents:", agents);
} else {
  console.error("Erreur:", await agentsRes.json());
}
```

## 🛡️ Sécurité

### Ce qui est maintenant sécurisé :

- ✅ Toutes les routes API nécessitent un token valide
- ✅ Les mots de passe sont hashés (bcrypt)
- ✅ Les tokens expirent après 7 jours (configurable)
- ✅ Les routes admin nécessitent le rôle "admin"

### Ce qui reste à faire :

- ⚠️ Ajouter un système de rôles dans la base de données
- ⚠️ Implémenter le refresh token pour renouveler les tokens
- ⚠️ Migrer les mots de passe existants vers le format hashé

### Ce qui a été ajouté :

- ✅ Rate limiting pour protéger contre les attaques brute force
  - Login : 5 tentatives / 15 minutes par IP
  - Register : 3 tentatives / heure par IP
  - API générales : 100 requêtes / minute par IP

## 🔄 Migration des mots de passe existants

Les mots de passe existants en clair continueront de fonctionner (pour migration progressive).
Pour migrer tous les mots de passe vers le format hashé, créez un script de migration.
