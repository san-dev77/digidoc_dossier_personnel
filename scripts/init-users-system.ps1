# ============================================
# Script d'Initialisation du Système Utilisateurs
# ============================================

Write-Host "====================================" -ForegroundColor Cyan
Write-Host "  Initialisation Système Utilisateurs" -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""

# 1. Générer le client Prisma
Write-Host "1️⃣  Génération du client Prisma..." -ForegroundColor Yellow
npm run db:generate
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Client Prisma généré" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur génération Prisma" -ForegroundColor Red
    exit 1
}

# 2. Créer les tables
Write-Host "`n2️⃣  Création des tables..." -ForegroundColor Yellow
npm run db:push
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Tables créées" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur création tables" -ForegroundColor Red
    exit 1
}

# 3. Seed (rôles, permissions, utilisateur)
Write-Host "`n3️⃣  Peuplement de la base de données..." -ForegroundColor Yellow
npm run db:seed
if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Base de données peuplée" -ForegroundColor Green
} else {
    Write-Host "   ❌ Erreur lors du seed" -ForegroundColor Red
    exit 1
}

# Résumé
Write-Host ""
Write-Host "====================================" -ForegroundColor Cyan
Write-Host "     ✅ Initialisation Terminée !   " -ForegroundColor Cyan
Write-Host "====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎉 Le système utilisateurs est prêt !" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Informations de connexion :" -ForegroundColor Yellow
Write-Host "   Username : digidoc" -ForegroundColor White
Write-Host "   Password : Digidoc2025!" -ForegroundColor White
Write-Host "   Rôle     : Super Administrateur" -ForegroundColor White
Write-Host ""
Write-Host "🚀 Prochaines étapes :" -ForegroundColor Yellow
Write-Host "   1. npm run dev" -ForegroundColor White
Write-Host "   2. Allez sur http://localhost:3000/login" -ForegroundColor White
Write-Host "   3. Connectez-vous avec les identifiants ci-dessus" -ForegroundColor White
Write-Host "   4. Accédez à la page Utilisateurs" -ForegroundColor White
Write-Host ""
Write-Host "⚠️  N'oubliez pas de changer le mot de passe après la première connexion !" -ForegroundColor Yellow
Write-Host ""

