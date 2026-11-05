# Deploy local do Persona
# ----------------------------------------------------------------------------
# Uso:
#   .\deploy-github.ps1 -Message "Minha alteracao"            # branch atual
#   .\deploy-github.ps1 -Message "..." -Migrate               # + aplica migrations no Supabase
#
# Fluxo: build -> (migrations) -> commit dos arquivos rastreados/novos -> push.
# O push na main dispara o deploy de producao na Vercel e o workflow
# .github/workflows/ci-deploy.yml (que tambem aplica migrations pendentes).

param(
  [string]$Message = "Update project",
  [switch]$SkipBuild,
  [switch]$Migrate
)

$ErrorActionPreference = "Stop"
$env:Path = "C:\Program Files\nodejs;$env:Path"

function Write-Step([string]$Text) {
  Write-Host ""
  Write-Host "==> $Text" -ForegroundColor Cyan
}

$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) { throw "Esta pasta nao e um repositorio Git." }
Set-Location $repoRoot
$branch = git branch --show-current

Write-Step "Repositorio: $repoRoot ($branch)"

if (-not $SkipBuild) {
  Write-Step "Build de producao"
  npm run build
  if ($LASTEXITCODE -ne 0) { throw "Build falhou. Nada foi enviado." }
}

if ($Migrate) {
  Write-Step "Migrations pendentes no Supabase"
  npx supabase migration list --linked
  npx supabase db push --linked
  if ($LASTEXITCODE -ne 0) { throw "Falha ao aplicar migrations." }
}

Write-Step "Commit"
git add -A
git reset -q -- .env .env.local .vercel 2>$null
$staged = git diff --cached --name-only
if ($staged) {
  $staged
  git commit -m $Message
} else {
  Write-Host "Nenhuma alteracao para commitar." -ForegroundColor Yellow
}

Write-Step "Push"
git push -u origin $branch
if ($LASTEXITCODE -ne 0) { throw "Push falhou." }

Write-Host ""
if ($branch -eq "main") {
  Write-Host "Enviado. Vercel publica em producao em ~30s." -ForegroundColor Green
} else {
  Write-Host "Enviado. Vercel gera um Preview desta branch; abra um PR para a main." -ForegroundColor Green
}
