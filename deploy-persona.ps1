# deploy-persona.ps1 — publica o Persona em producao
# ----------------------------------------------------------------------------
# Uso:  .\deploy-persona.ps1 -Message "Descricao da mudanca"
#
# Etapas (para no primeiro erro):
#   1. Build de producao (npm run build)
#   2. Migrations pendentes no Supabase (supabase/migrations -> projeto PERSONA)
#   3. Commit de tudo que mudou (nunca .env/.vercel)
#   4. Push da branch atual; se nao for a main, faz merge na main e push
#   5. A Vercel publica a main automaticamente (integracao GitHub)
#
# Flags:  -SkipBuild  -SkipMigrations

param(
  [string]$Message = "",
  [switch]$SkipBuild,
  [switch]$SkipMigrations
)

$ErrorActionPreference = "Stop"
$env:Path = "C:\Program Files\nodejs;C:\Program Files\Git\cmd;$env:Path"
$ProjectRef = "wvgchojyezmsiuimiqau"

function Step([string]$Text) { Write-Host ""; Write-Host "==> $Text" -ForegroundColor Cyan }
function Check([string]$What) { if ($LASTEXITCODE -ne 0) { throw "$What falhou (codigo $LASTEXITCODE). Deploy interrompido." } }

$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) { throw "Pasta nao e um repositorio Git." }
Set-Location $repoRoot
$branch = git branch --show-current
if (-not $Message) { $Message = "Deploy $(Get-Date -Format 'yyyy-MM-dd HH:mm')" }

Step "Persona | branch: $branch"

if (-not $SkipBuild) {
  Step "1/4 Build de producao"
  npm run build
  Check "Build"
}

if (-not $SkipMigrations) {
  Step "2/4 Migrations do Supabase"
  if (-not (Test-Path "supabase/.temp/project-ref")) {
    npx supabase link --project-ref $ProjectRef
    Check "supabase link"
  }
  npx supabase migration list --linked
  Check "supabase migration list"
  npx supabase db push --linked --yes
  Check "supabase db push"
}

Step "3/4 Commit"
git add -A
git reset -q -- .env .env.local .vercel 2>$null
$staged = git diff --cached --name-only
if ($staged) {
  $staged | ForEach-Object { Write-Host "  $_" }
  git commit -m $Message
  Check "git commit"
} else {
  Write-Host "Nada novo para commitar." -ForegroundColor Yellow
}

Step "4/4 Push"
git push -u origin $branch
Check "git push ($branch)"

if ($branch -ne "main") {
  git checkout main
  Check "checkout main"
  git pull --ff-only origin main
  Check "pull main"
  git merge --no-ff $branch -m "Merge ${branch}: $Message"
  Check "merge $branch -> main"
  git push origin main
  Check "git push main"
  git checkout $branch
}

Write-Host ""
Write-Host "Deploy enviado. A Vercel publica a main em ~30s." -ForegroundColor Green
Write-Host "Acompanhe: npx vercel ls persona" -ForegroundColor Green
