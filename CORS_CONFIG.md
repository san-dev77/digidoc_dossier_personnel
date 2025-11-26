# Configuration CORS

## 📋 Vue d'ensemble

CORS (Cross-Origin Resource Sharing) est maintenant configuré pour votre application Next.js. Cette configuration permet de contrôler quels domaines peuvent accéder à vos APIs.

## 🔧 Configuration actuelle

### Middleware CORS (`middleware.ts`)

Le middleware gère automatiquement :
- ✅ Les requêtes OPTIONS (preflight)
- ✅ Les headers CORS pour toutes les routes API
- ✅ La validation des origines autorisées

### Origines autorisées

Par défaut, les origines suivantes sont autorisées :
- `http://localhost:3000`
- `http://localhost:3001`
- `http://127.0.0.1:3000`
- `http://127.0.0.1:3001`

### Méthodes HTTP autorisées

- GET
- POST
- PUT
- DELETE
- PATCH
- OPTIONS

### Headers autorisés

- `Content-Type`
- `Authorization`
- `X-Requested-With`
- `Accept`
- `Origin`

## 🚀 Comment ajouter de nouveaux domaines

Pour autoriser de nouveaux domaines en production, modifiez le tableau `allowedOrigins` dans deux fichiers :

### 1. `middleware.ts` (ligne 6-12)

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  // Ajoutez vos domaines de production ici
  'https://votre-domaine.com',
  'https://www.votre-domaine.com',
];
```

### 2. `src/lib/cors.ts` (ligne 6-12)

```typescript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  // Ajoutez vos domaines de production ici
  'https://votre-domaine.com',
  'https://www.votre-domaine.com',
];
```

## 🔒 Sécurité

### Pour la production

⚠️ **IMPORTANT** : Avant de déployer en production :

1. **Retirez les origines de développement** ou utilisez des variables d'environnement
2. **Ajoutez uniquement vos domaines de production**
3. **Ne mettez jamais `*` (toutes origines)** en production

### Exemple avec variables d'environnement

```typescript
// middleware.ts
const allowedOrigins = [
  ...(process.env.NODE_ENV === 'development' 
    ? ['http://localhost:3000', 'http://localhost:3001']
    : []
  ),
  ...(process.env.ALLOWED_ORIGINS?.split(',') || []),
];
```

Puis dans votre `.env` :
```
ALLOWED_ORIGINS=https://votre-domaine.com,https://www.votre-domaine.com
```

## 📝 Utilisation dans les routes API

Le middleware gère automatiquement CORS pour toutes les routes API. Cependant, si vous avez besoin d'une gestion manuelle, vous pouvez utiliser les fonctions utilitaires :

```typescript
import { addCorsHeaders, handleCorsPreflight } from '@/lib/cors';
import { NextRequest, NextResponse } from 'next/server';

export async function OPTIONS(request: NextRequest) {
  return handleCorsPreflight(request);
}

export async function GET(request: NextRequest) {
  const response = NextResponse.json({ data: 'example' });
  return addCorsHeaders(response, request);
}
```

## 🧪 Tester CORS

### Depuis le navigateur

```javascript
// Dans la console du navigateur
fetch('http://localhost:3000/api/agents', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
})
  .then(res => res.json())
  .then(data => console.log(data))
  .catch(err => console.error('Erreur CORS:', err));
```

### Depuis un autre domaine

Si vous testez depuis un autre domaine, vous devriez voir les headers CORS dans la réponse :

```
Access-Control-Allow-Origin: http://localhost:3000
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With, Accept, Origin
```

## ❓ Dépannage

### Erreur "CORS policy: No 'Access-Control-Allow-Origin' header"

1. Vérifiez que votre domaine est dans `allowedOrigins`
2. Vérifiez que le middleware est bien exécuté (redémarrez le serveur)
3. Vérifiez les logs du serveur pour voir les erreurs

### Les requêtes OPTIONS échouent

Le middleware gère automatiquement les requêtes OPTIONS. Si elles échouent :
1. Vérifiez que `middleware.ts` est à la racine du projet
2. Vérifiez que le matcher est correct : `matcher: '/api/:path*'`

### CORS fonctionne en développement mais pas en production

1. Vérifiez que vos domaines de production sont dans `allowedOrigins`
2. Vérifiez que les variables d'environnement sont correctement configurées
3. Vérifiez les logs du serveur de production

## 📚 Ressources

- [Documentation Next.js - Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [MDN - CORS](https://developer.mozilla.org/fr/docs/Web/HTTP/CORS)
- [OWASP - CORS Security](https://cheatsheetseries.owasp.org/cheatsheets/HTML5_Security_Cheat_Sheet.html#cross-origin-resource-sharing)

