import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Configuration CORS
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:3001',
  // Ajoutez ici vos domaines de production
  // 'https://votre-domaine.com',
];

/**
 * Fonction utilitaire pour ajouter les headers CORS à une réponse
 * @param response - La réponse NextResponse
 * @param request - La requête NextRequest (optionnelle)
 * @returns La réponse avec les headers CORS ajoutés
 */
export function addCorsHeaders(
  response: NextResponse,
  request?: NextRequest
): NextResponse {
  const origin = request?.headers.get('origin');
  const isAllowedOrigin = !origin || allowedOrigins.includes(origin);

  if (isAllowedOrigin && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  );
  response.headers.set(
    'Access-Control-Expose-Headers',
    'Content-Length, Content-Type'
  );

  return response;
}

/**
 * Gère les requêtes OPTIONS (preflight) pour CORS
 * @param request - La requête NextRequest
 * @returns Une réponse 204 avec les headers CORS appropriés
 */
export function handleCorsPreflight(request: NextRequest): NextResponse {
  const origin = request.headers.get('origin');
  const isAllowedOrigin = !origin || allowedOrigins.includes(origin);

  const response = new NextResponse(null, { status: 204 });

  if (isAllowedOrigin && origin) {
    response.headers.set('Access-Control-Allow-Origin', origin);
    response.headers.set('Access-Control-Allow-Credentials', 'true');
  }

  response.headers.set(
    'Access-Control-Allow-Methods',
    'GET, POST, PUT, DELETE, PATCH, OPTIONS'
  );
  response.headers.set(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Requested-With, Accept, Origin'
  );
  response.headers.set('Access-Control-Max-Age', '86400'); // 24 heures

  return response;
}

/**
 * Vérifie si l'origine de la requête est autorisée
 * @param request - La requête NextRequest
 * @returns true si l'origine est autorisée, false sinon
 */
export function isOriginAllowed(request: NextRequest): boolean {
  const origin = request.headers.get('origin');
  return !origin || allowedOrigins.includes(origin);
}

