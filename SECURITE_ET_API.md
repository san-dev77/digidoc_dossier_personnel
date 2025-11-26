# Analyse de Sécurité et Guide d'Appel des APIs

## 📡 Comment appeler les APIs du backend depuis le navigateur

### Méthode 1 : Appel direct via fetch() dans la console du navigateur

Toutes les routes API sont accessibles directement depuis le navigateur sans authentification. Voici des exemples :

#### Exemple 1 : Récupérer tous les agents
```javascript
fetch('http://localhost:3000/api/agents')
  .then(res => res.json())
  .then(data => console.log(data));
```

#### Exemple 2 : Créer un nouvel agent
```javascript
fetch('http://localhost:3000/api/agents', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    matricule: 'TEST001',
    password: 'password123',
    nom_complet: 'Test User',
    email: 'test@example.com'
  })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

#### Exemple 3 : Supprimer un agent
```javascript
fetch('http://localhost:3000/api/agents/1', {
  method: 'DELETE'
})
  .then(res => res.json())
  .then(data => console.log(data));
```

#### Exemple 4 : Uploader un fichier
```javascript
const formData = new FormData();
formData.append('file', fileInput.files[0]);
formData.append('rubriqueId', '1');
formData.append('sousDossierId', '1');
formData.append('nom', 'Document Test');

fetch('http://localhost:3000/api/upload', {
  method: 'POST',
  body: formData
})
  .then(res => res.json())
  .then(data => console.log(data));
```

#### Exemple 5 : Accéder à un fichier stocké
```javascript
fetch('http://localhost:3000/api/files/Documents_du_pe/Documents_relat/Plan_d_ameliora/Amadou_Diallo/fichier.pdf')
  .then(res => res.blob())
  .then(blob => {
    const url = URL.createObjectURL(blob);
    window.open(url);
  });
```

#### Exemple 6 : Réinitialiser la base de données (⚠️ DANGEREUX)
```javascript
fetch('http://localhost:3000/api/migration', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ action: 'reset' })
})
  .then(res => res.json())
  .then(data => console.log(data));
```

### Méthode 2 : Utilisation de curl depuis le terminal

```bash
# GET tous les agents
curl http://localhost:3000/api/agents

# POST créer un agent
curl -X POST http://localhost:3000/api/agents \
  -H "Content-Type: application/json" \
  -d '{"matricule":"TEST001","password":"pass123","nom_complet":"Test"}'

# DELETE un agent
curl -X DELETE http://localhost:3000/api/agents/1
```

### Méthode 3 : Utilisation d'outils comme Postman ou Insomnia

1. Créer une nouvelle requête
2. Définir la méthode HTTP (GET, POST, PUT, DELETE)
3. Entrer l'URL : `http://localhost:3000/api/[route]`
4. Ajouter les headers si nécessaire : `Content-Type: application/json`
5. Ajouter le body si nécessaire (format JSON)
6. Envoyer la requête

---

## 🔒 Résumé des Mesures de Sécurité NON Prises en Compte

### 🚨 CRITIQUE - Problèmes de Sécurité Majeurs

#### 1. **Absence Totale d'Authentification sur les Routes API**
- **Problème** : Aucune route API ne vérifie si l'utilisateur est authentifié
- **Impact** : N'importe qui peut accéder, modifier, supprimer toutes les données
- **Exemples de routes vulnérables** :
  - `/api/agents` - Liste, création, modification, suppression d'agents
  - `/api/upload` - Upload de fichiers sans vérification
  - `/api/files/[...path]` - Accès à tous les fichiers stockés
  - `/api/pieces` - Gestion des pièces de dossiers
  - `/api/rubriques` - Gestion des rubriques
  - `/api/migration` - **Réinitialisation complète de la base de données**
  - `/api/database-schema` - Accès au schéma de la base de données

#### 2. **Mots de Passe Stockés en Clair**
- **Fichier** : `src/app/api/auth/login/route.ts` (ligne 15)
- **Problème** : Les mots de passe sont comparés directement en clair
  ```typescript
  SELECT * FROM agents WHERE matricule = $1 AND password = $2
  ```
- **Impact** : Si la base de données est compromise, tous les mots de passe sont exposés
- **Solution requise** : Utiliser bcrypt ou argon2 pour le hachage

#### 3. **Absence d'Autorisation (RBAC)**
- **Problème** : Même si l'authentification était présente, il n'y a pas de système de rôles
- **Impact** : Un utilisateur connecté peut faire n'importe quelle action (admin ou non)
- **Exemples** :
  - N'importe quel agent peut supprimer d'autres agents
  - N'importe quel agent peut réinitialiser la base de données
  - N'importe quel agent peut accéder à tous les fichiers

#### 4. **Routes Administratives Accessibles Publiquement**
- **Routes critiques non protégées** :
  - `/api/migration` - Permet de réinitialiser, sauvegarder, migrer la base
  - `/api/database-schema` - Expose la structure complète de la base
  - `/api/import` - Permet d'importer des données massives
- **Impact** : Un attaquant peut détruire ou compromettre toute l'application

#### 5. **Vulnérabilité Path Traversal**
- **Fichier** : `src/app/api/files/[...path]/route.ts` (ligne 15)
- **Problème** : Pas de validation stricte du chemin
  ```typescript
  const fullPath = path.join(process.cwd(), "uploads", filePath);
  ```
- **Impact** : Un attaquant peut accéder à n'importe quel fichier sur le serveur avec `../../../etc/passwd`
- **Exemple d'attaque** :
  ```javascript
  fetch('/api/files/../../../etc/passwd')
  ```

#### 6. **Absence de Validation d'Input Robuste**
- **Problème** : Validation minimale des données entrantes
- **Exemples** :
  - Pas de validation de format d'email
  - Pas de validation de taille de fichier maximale
  - Pas de validation de type MIME strict
  - Pas de sanitization des chaînes de caractères
- **Impact** : Risque d'injection de données malveillantes

#### 7. **Absence de Rate Limiting**
- **Problème** : Pas de limitation du nombre de requêtes par IP/utilisateur
- **Impact** : Vulnérable aux attaques par déni de service (DoS) et brute force
- **Exemple** : Un attaquant peut tenter des milliers de connexions par seconde

#### 8. **Absence de Protection CSRF**
- **Problème** : Pas de tokens CSRF pour les requêtes POST/PUT/DELETE
- **Impact** : Un site malveillant peut effectuer des actions au nom de l'utilisateur

#### 9. **CORS Non Configuré**
- **Problème** : Pas de configuration CORS explicite dans `next.config.ts`
- **Impact** : Soit toutes les origines sont autorisées (par défaut Next.js), soit aucune (selon la configuration)
- **Risque** : Accès non contrôlé depuis d'autres domaines

#### 10. **Absence de Middleware de Sécurité**
- **Problème** : Pas de fichier `middleware.ts` pour centraliser la sécurité
- **Impact** : Chaque route doit gérer sa propre sécurité (actuellement aucune ne le fait)

#### 11. **Logs Contenant des Informations Sensibles**
- **Fichiers** : Plusieurs routes API
- **Problème** : Les mots de passe et données sensibles sont loggés
  ```typescript
  console.log("[REGISTER] payload:", body); // Contient le mot de passe
  ```
- **Impact** : Les logs peuvent exposer des informations sensibles

#### 12. **Absence de Gestion de Session Sécurisée**
- **Problème** : Pas de système de session ou de tokens JWT
- **Impact** : Pas de moyen de maintenir l'état d'authentification de manière sécurisée

#### 13. **Headers de Sécurité Incomplets**
- **Fichier** : `next.config.ts`
- **Problème** : Manque de headers critiques :
  - Pas de `Content-Security-Policy`
  - Pas de `Strict-Transport-Security` (HSTS)
  - Pas de `X-XSS-Protection`
- **Impact** : Vulnérable aux attaques XSS et man-in-the-middle

#### 14. **Validation de Fichier Insuffisante**
- **Fichier** : `src/app/api/upload/route.ts`
- **Problème** : Validation basique, pas de scan antivirus, pas de vérification approfondie
- **Impact** : Risque d'upload de fichiers malveillants

#### 15. **Exposition d'Erreurs Détaillées**
- **Problème** : Les erreurs SQL et stack traces sont retournées au client
  ```typescript
  return NextResponse.json(
    { message: "Erreur serveur", detail: errorMessage },
    { status: 500 }
  );
  ```
- **Impact** : Un attaquant peut obtenir des informations sur la structure de la base de données

---

## 📋 Recommandations Prioritaires

### Priorité 1 - CRITIQUE (À implémenter immédiatement)

1. **Implémenter l'authentification JWT ou sessions**
   - Créer un middleware d'authentification
   - Protéger toutes les routes API sauf `/api/auth/login` et `/api/auth/register`

2. **Hacher les mots de passe avec bcrypt**
   - Modifier le système d'inscription pour hasher les mots de passe
   - Modifier le système de login pour comparer les hash

3. **Protéger les routes administratives**
   - Restreindre `/api/migration` et `/api/database-schema` aux administrateurs uniquement
   - Ajouter un système de rôles (admin, user, etc.)

4. **Corriger la vulnérabilité Path Traversal**
   - Valider et normaliser les chemins de fichiers
   - Utiliser `path.resolve()` et vérifier que le chemin reste dans le dossier autorisé

### Priorité 2 - HAUTE (À implémenter rapidement)

5. **Ajouter un middleware de sécurité global**
   - Créer `middleware.ts` à la racine
   - Implémenter rate limiting
   - Ajouter validation CSRF

6. **Améliorer la validation d'input**
   - Utiliser Zod ou une bibliothèque similaire
   - Valider tous les inputs avant traitement

7. **Configurer CORS correctement**
   - Autoriser uniquement les origines nécessaires
   - Configurer les headers CORS appropriés

8. **Améliorer les headers de sécurité**
   - Ajouter CSP, HSTS, etc.

### Priorité 3 - MOYENNE (À planifier)

9. **Implémenter un système de logs sécurisé**
   - Ne pas logger les informations sensibles
   - Utiliser un système de logs structuré

10. **Améliorer la gestion des erreurs**
    - Ne pas exposer les détails techniques aux clients
    - Logger les erreurs côté serveur uniquement

11. **Ajouter des tests de sécurité**
    - Tests d'intrusion
    - Tests de validation
    - Tests de performance sous charge

---

## 🔧 Exemple de Middleware de Sécurité Recommandé

```typescript
// middleware.ts (à créer à la racine)
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Routes publiques
  const publicRoutes = ['/api/auth/login', '/api/auth/register'];
  
  // Routes nécessitant une authentification
  if (request.nextUrl.pathname.startsWith('/api/') && 
      !publicRoutes.includes(request.nextUrl.pathname)) {
    
    // Vérifier le token JWT
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        { message: 'Non autorisé' },
        { status: 401 }
      );
    }
    
    // TODO: Vérifier et valider le token JWT
    // TODO: Vérifier les permissions selon le rôle
  }
  
  return NextResponse.next();
}

export const config = {
  matcher: '/api/:path*',
};
```

---

## ⚠️ Conclusion

**L'application est actuellement VULNÉRABLE à de nombreuses attaques** et ne devrait **PAS être déployée en production** sans correction de ces problèmes de sécurité, notamment :

- L'absence totale d'authentification
- Les mots de passe en clair
- L'accès public aux routes administratives
- La vulnérabilité path traversal

Il est **URGENT** d'implémenter au minimum les mesures de Priorité 1 avant toute mise en production.

