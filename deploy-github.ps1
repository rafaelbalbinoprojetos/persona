param(
  [string]$Message = "Update project",
  [switch]$SkipBuild
)

$ErrorActionPreference = "Stop"

function Write-Step {
  param([string]$Text)
  Write-Host ""
  Write-Host "==> $Text" -ForegroundColor Cyan
}

function Ensure-Command {
  param([string]$Name)
  if (-not (Get-Command $Name -ErrorAction SilentlyContinue)) {
    throw "Comando '$Name' nao encontrado no PATH."
  }
}

Ensure-Command git
Ensure-Command npm

$repoRoot = git rev-parse --show-toplevel 2>$null
if (-not $repoRoot) {
  throw "Esta pasta nao e um repositorio Git. Rode git init antes."
}

Set-Location $repoRoot

$branch = git branch --show-current
if (-not $branch) {
  throw "Nao foi possivel identificar a branch atual."
}

$remote = git remote get-url origin 2>$null
if (-not $remote) {
  throw "Remote 'origin' nao configurado."
}

Write-Step "Repositorio"
Write-Host "Pasta:  $repoRoot"
Write-Host "Branch: $branch"
Write-Host "Origin: $remote"

if (-not $SkipBuild) {
  Write-Step "Build de producao"
  npm run build
}

Write-Step "Verificando alteracoes"
$status = git status --porcelain
if (-not $status) {
  Write-Host "Nenhuma alteracao para enviar." -ForegroundColor Yellow
  Write-Step "Push"
  git push origin $branch
  Write-Host "Push concluido." -ForegroundColor Green
  exit 0
}

git status --short

Write-Step "Commit"
git add .

$staged = git diff --cached --name-only
if (-not $staged) {
  Write-Host "Nenhuma alteracao staged para commitar." -ForegroundColor Yellow
} else {
  git commit -m $Message
}

Write-Step "Push"
git push origin $branch

Write-Host ""
Write-Host "Deploy/upload para GitHub concluido com sucesso." -ForegroundColor Green
