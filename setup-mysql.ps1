# ============================================
# Script de Configuration MySQL pour Digi-Doc
# ============================================
# 
# Ce script automatise la configuration de MySQL
# pour le projet Digi-Doc
#
# Usage : .\setup-mysql.ps1
# ============================================

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Configuration MySQL - Digi-Doc   " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# Fonction pour afficher les messages colorés
function Write-Success {
    param($Message)
    Write-Host "✓ $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "✗ $Message" -ForegroundColor Red
}

function Write-Info {
    param($Message)
    Write-Host "→ $Message" -ForegroundColor Yellow
}

# Vérifier si MySQL est installé
Write-Info "Vérification de l'installation MySQL..."
$mysqlPath = Get-Command mysql -ErrorAction SilentlyContinue

if (-not $mysqlPath) {
    Write-Error "MySQL n'est pas installé ou n'est pas dans le PATH"
    Write-Info "Téléchargez MySQL depuis : https://dev.mysql.com/downloads/installer/"
    Write-Info "Ou installez avec Chocolatey : choco install mysql"
    exit 1
}
Write-Success "MySQL est installé"

# Vérifier si le service MySQL est démarré
Write-Info "Vérification du service MySQL..."
$mysqlService = Get-Service -Name "MySQL*" -ErrorAction SilentlyContinue | Where-Object { $_.Status -eq "Running" }

if (-not $mysqlService) {
    Write-Info "Tentative de démarrage du service MySQL..."
    try {
        $service = Get-Service -Name "MySQL*" | Select-Object -First 1
        Start-Service $service.Name
        Write-Success "Service MySQL démarré"
    } catch {
        Write-Error "Impossible de démarrer MySQL. Démarrez-le manuellement :"
        Write-Host "  net start MySQL80" -ForegroundColor White
        exit 1
    }
} else {
    Write-Success "Service MySQL est en cours d'exécution"
}

# Demander les informations de connexion
Write-Host ""
Write-Host "Configuration de la Base de Données" -ForegroundColor Cyan
Write-Host "-----------------------------------" -ForegroundColor Cyan

$mysqlUser = Read-Host "Nom d'utilisateur MySQL (défaut: root)"
if ([string]::IsNullOrWhiteSpace($mysqlUser)) {
    $mysqlUser = "root"
}

$mysqlPassword = Read-Host "Mot de passe MySQL" -AsSecureString
$mysqlPasswordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto(
    [Runtime.InteropServices.Marshal]::SecureStringToBSTR($mysqlPassword)
)

$dbName = Read-Host "Nom de la base de données (défaut: digidoc_personnel)"
if ([string]::IsNullOrWhiteSpace($dbName)) {
    $dbName = "digidoc_personnel"
}

# Créer la base de données
Write-Host ""
Write-Info "Création de la base de données $dbName..."

$createDbQuery = @"
CREATE DATABASE IF NOT EXISTS $dbName CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
"@

try {
    $createDbQuery | mysql -u $mysqlUser -p"$mysqlPasswordPlain" 2>$null
    Write-Success "Base de données '$dbName' créée avec succès"
} catch {
    Write-Error "Erreur lors de la création de la base de données"
    Write-Host $_.Exception.Message -ForegroundColor Red
}

# Créer le fichier .env
Write-Host ""
Write-Info "Création du fichier .env..."

$databaseUrl = "mysql://${mysqlUser}:${mysqlPasswordPlain}@localhost:3306/${dbName}"
$jwtSecret = -join ((65..90) + (97..122) + (48..57) | Get-Random -Count 32 | ForEach-Object {[char]$_})

$envContent = @"
# Configuration générée automatiquement
DATABASE_URL="$databaseUrl"
JWT_SECRET="$jwtSecret"
NODE_ENV="development"
NEXT_PUBLIC_API_URL="http://localhost:3000"
"@

$envContent | Out-File -FilePath ".env" -Encoding UTF8 -Force
Write-Success "Fichier .env créé"

# Installer les dépendances
Write-Host ""
Write-Info "Installation des dépendances npm..."
try {
    npm install 2>&1 | Out-Null
    Write-Success "Dépendances installées"
} catch {
    Write-Error "Erreur lors de l'installation des dépendances"
}

# Vérifier la connexion
Write-Host ""
Write-Info "Vérification de la connexion à MySQL..."
try {
    npm run db:check-mysql
} catch {
    Write-Error "Impossible de vérifier la connexion"
}

# Générer le client Prisma
Write-Host ""
Write-Info "Génération du client Prisma..."
try {
    npm run db:generate 2>&1 | Out-Null
    Write-Success "Client Prisma généré"
} catch {
    Write-Error "Erreur lors de la génération du client Prisma"
}

# Créer les tables
Write-Host ""
$createTables = Read-Host "Voulez-vous créer les tables maintenant ? (O/n)"
if ($createTables -ne "n" -and $createTables -ne "N") {
    Write-Info "Création des tables..."
    try {
        npm run db:push
        Write-Success "Tables créées avec succès"
    } catch {
        Write-Error "Erreur lors de la création des tables"
    }
    
    # Peupler la base
    Write-Host ""
    $seedDb = Read-Host "Voulez-vous peupler la base avec des données initiales ? (o/N)"
    if ($seedDb -eq "o" -or $seedDb -eq "O") {
        Write-Info "Peuplement de la base de données..."
        try {
            npm run db:seed
            Write-Success "Base de données peuplée"
        } catch {
            Write-Error "Erreur lors du peuplement"
        }
    }
}

# Résumé final
Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "     Configuration Terminée !      " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Success "MySQL configuré pour Digi-Doc"
Write-Host ""
Write-Host "Informations de connexion :" -ForegroundColor Yellow
Write-Host "  Base de données : $dbName"
Write-Host "  Utilisateur     : $mysqlUser"
Write-Host "  Hôte            : localhost:3306"
Write-Host ""
Write-Host "Prochaines étapes :" -ForegroundColor Yellow
Write-Host "  1. npm run dev          (Démarrer l'application)"
Write-Host "  2. Accédez à http://localhost:3000"
Write-Host ""
Write-Host "Commandes utiles :" -ForegroundColor Yellow
Write-Host "  npm run db:push         (Mettre à jour le schéma)"
Write-Host "  npm run db:seed         (Peupler la base)"
Write-Host "  npm run db:check-mysql  (Vérifier la connexion)"
Write-Host ""
Write-Success "Tout est prêt ! 🚀"
Write-Host ""

