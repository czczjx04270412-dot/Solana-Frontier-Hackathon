# Credit Vault - Devnet Deploy Script
# Usage: .\scripts\deploy.ps1

# --- Setup PATH & Proxy ---
$solBin = "$env:USERPROFILE\.local\share\solana\install\active_release\solana-release\bin"
$env:PATH = "$solBin;$env:USERPROFILE\.cargo\bin;$env:PATH"
# Windows system proxy (Clash/V2Ray) - required for Solana CLI connectivity
$proxy = (Get-ItemProperty 'HKCU:\Software\Microsoft\Windows\CurrentVersion\Internet Settings' -ErrorAction SilentlyContinue).ProxyServer
if ($proxy) {
    $env:HTTPS_PROXY = "http://$proxy"
    $env:HTTP_PROXY  = "http://$proxy"
    Write-Host "Using proxy: $proxy" -ForegroundColor DarkGray
}

Write-Host "=== Credit Vault Deployment ===" -ForegroundColor Cyan
$wallet = solana address
Write-Host "Wallet:  $wallet"
Write-Host "Network: devnet"
Write-Host ""

# Step 1: Check balance
$bal = solana balance --url devnet 2>&1
Write-Host "[1/5] Balance: $bal" -ForegroundColor Yellow

$balNum = [double]($bal -replace '[^0-9.]','')
if ($balNum -lt 3) {
    Write-Host "Need >= 3 SOL to deploy. Attempting airdrop..." -ForegroundColor Yellow
    solana airdrop 2 --url devnet 2>&1 | Out-String
    Start-Sleep 5
    solana airdrop 2 --url devnet 2>&1 | Out-String
    $bal = solana balance --url devnet 2>&1
    Write-Host "Balance after airdrop: $bal"
    $balNum = [double]($bal -replace '[^0-9.]','')
    if ($balNum -lt 2) {
        Write-Host ""
        Write-Host "Airdrop rate-limited. Please fund manually:" -ForegroundColor Red
        Write-Host "  1. Open https://faucet.solana.com in your browser" -ForegroundColor Yellow
        Write-Host "  2. Paste wallet: $wallet" -ForegroundColor Yellow
        Write-Host "  3. Select 'Devnet', request 5 SOL" -ForegroundColor Yellow
        Write-Host "  4. Re-run this script after receiving SOL" -ForegroundColor Yellow
        exit 1
    }
}

# Step 2: Build (skip if .so exists and is recent)
$so = "target\deploy\credit_vault.so"
if (-not (Test-Path $so)) {
    Write-Host "[2/5] Building contract..." -ForegroundColor Yellow
    cmd /c "call ""C:\Program Files (x86)\Microsoft Visual Studio\2022\BuildTools\VC\Auxiliary\Build\vcvars64.bat"" >nul 2>&1 && cargo build-sbf --manifest-path programs\credit_vault\Cargo.toml 2>&1"
} else {
    Write-Host "[2/5] Binary exists: $so ($('{0:N0}' -f (Get-Item $so).Length) bytes)" -ForegroundColor Green
}

# Step 3: Deploy
Write-Host "[3/5] Deploying to devnet..." -ForegroundColor Yellow
$deployOutput = solana program deploy $so --url devnet 2>&1 | Out-String
Write-Host $deployOutput
if ($LASTEXITCODE -ne 0) {
    Write-Host "Deploy failed" -ForegroundColor Red
    exit 1
}

# Step 4: Extract program ID
$programId = ($deployOutput | Select-String 'Program Id:\s*(\S+)').Matches[0].Groups[1].Value
Write-Host "[4/5] Program ID: $programId" -ForegroundColor Green

# Step 5: Show next steps
Write-Host ""
Write-Host "[5/5] Update these files with the new Program ID:" -ForegroundColor Yellow
Write-Host "  programs/credit_vault/src/lib.rs  -> declare_id!(""$programId"");"
Write-Host "  lib/idl/credit_vault.ts           -> PROGRAM_ID = ""$programId"""
Write-Host "  Anchor.toml                       -> credit_vault = ""$programId"""
Write-Host ""
Write-Host "=== Deployment complete! ===" -ForegroundColor Green
