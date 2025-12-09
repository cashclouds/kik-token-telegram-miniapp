#!/usr/bin/env pwsh

# Deploy script for KIK Collectibles on Amoy Testnet
$scriptPath = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $scriptPath

Write-Host "🚀 Starting KIK Collectibles Deployment..." -ForegroundColor Green
Write-Host "Current directory: $(Get-Location)" -ForegroundColor Cyan

# Check if package.json exists
if (!(Test-Path "package.json")) {
    Write-Host "❌ package.json not found in $(Get-Location)" -ForegroundColor Red
    exit 1
}

# Check if node_modules exists
if (!(Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
}

# Check .env file
if (!(Test-Path ".env")) {
    Write-Host "❌ .env file not found. Please create it with PRIVATE_KEY." -ForegroundColor Red
    exit 1
}

# Run deployment
Write-Host "🔄 Running deployment script..." -ForegroundColor Cyan
npm run deploy:amoy

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Deployment completed successfully!" -ForegroundColor Green
} else {
    Write-Host "❌ Deployment failed with exit code $LASTEXITCODE" -ForegroundColor Red
}

Read-Host "Press Enter to exit"
