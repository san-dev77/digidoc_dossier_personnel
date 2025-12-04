import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  // Optimisations pour la production
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  // Note: swcMinify est activé par défaut dans Next.js 16 et ne peut plus être configuré
  // Optimisation des images
  images: {
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    // Permettre les images depuis l'API locale (chemins relatifs)
    // Les chemins commençant par /api/ sont automatiquement autorisés
  },
  // Headers de sécurité
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          {
            key: "Referrer-Policy",
            value: "origin-when-cross-origin",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          {
            key: "Content-Security-Policy",
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https: blob:; font-src 'self' data:; connect-src 'self' blob:; object-src 'self' blob:; media-src 'self' blob:; frame-src 'self' blob:; child-src 'self' blob:;",
          },
        ],
      },
      {
        // Headers CORS supplémentaires pour les routes API
        source: "/api/:path*",
        headers: [
          {
            key: "Access-Control-Allow-Credentials",
            value: "true",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
