$ErrorActionPreference = "Stop"

$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$repoRoot = Split-Path -Parent $repoRoot

$backendDir = Join-Path $repoRoot "backend"
$frontendDir = Join-Path $repoRoot "frontend"

Write-Host "Repo:      $repoRoot"
Write-Host "Backend:   $backendDir"
Write-Host "Frontend:  $frontendDir"
Write-Host ""

if (!(Test-Path $backendDir)) { throw "Missing backend dir: $backendDir" }
if (!(Test-Path $frontendDir)) { throw "Missing frontend dir: $frontendDir" }

# Start backend + frontend in separate PowerShell windows so logs stay visible.
Write-Host "Starting backend (FastAPI) on http://localhost:8000 ..."
Start-Process powershell -WorkingDirectory $backendDir -ArgumentList @(
  "-NoExit",
  "-Command",
  "`$env:PYTHONPATH='$backendDir'; python start_server.py --reload"
)

Write-Host "Starting frontend (Next.js) on http://localhost:3000 ..."
Start-Process powershell -WorkingDirectory $frontendDir -ArgumentList @(
  "-NoExit",
  "-Command",
  "npm run dev"
)

Write-Host ""
Write-Host "Done. If a window fails, run manually:"
Write-Host "  Backend:  cd `"$backendDir`"; `$env:PYTHONPATH=`"$backendDir`"; python start_server.py --reload"
Write-Host "  Frontend: cd `"$frontendDir`"; npm run dev"

