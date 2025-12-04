#!/bin/bash

# Script de génération de certificat SSL auto-signé pour Digi-Doc
# Pour Red Hat / CentOS / Rocky Linux

echo "🔐 Génération du certificat SSL auto-signé..."

# Créer le répertoire pour les certificats
SSL_DIR="/etc/nginx/ssl"
sudo mkdir -p $SSL_DIR

# Informations du certificat
CERT_COUNTRY="MA"
CERT_STATE="Casablanca"
CERT_CITY="Casablanca"
CERT_ORG="Banque"
CERT_OU="IT Department"
CERT_CN="Digi-Doc Application"

# Générer la clé privée et le certificat (valide 365 jours)
sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
  -keyout $SSL_DIR/digidoc.key \
  -out $SSL_DIR/digidoc.crt \
  -subj "/C=$CERT_COUNTRY/ST=$CERT_STATE/L=$CERT_CITY/O=$CERT_ORG/OU=$CERT_OU/CN=$CERT_CN"

# Définir les permissions appropriées
sudo chmod 600 $SSL_DIR/digidoc.key
sudo chmod 644 $SSL_DIR/digidoc.crt

echo "✅ Certificat SSL généré avec succès !"
echo "📁 Certificat: $SSL_DIR/digidoc.crt"
echo "🔑 Clé privée: $SSL_DIR/digidoc.key"
echo "⏰ Validité: 365 jours"
echo ""
echo "⚠️  IMPORTANT: Ce certificat est auto-signé."
echo "   Les navigateurs afficheront un avertissement de sécurité."
echo "   Les utilisateurs devront accepter manuellement le certificat."

