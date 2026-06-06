param(
  [Parameter(Position = 0)]
  [string]$Domain,
  [Parameter(Position = 1)]
  [string]$Action
)

$ErrorActionPreference = "Stop"
$AppDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$ComposeFile = if ($env:GCPDS_AGENT_COMPOSE) { $env:GCPDS_AGENT_COMPOSE } else { "docker-compose.yml" }
$Port = if ($env:GCPDS_AGENT_PORT) { $env:GCPDS_AGENT_PORT } else { "3000" }

function Show-Usage {
  Write-Host "Usage:"
  Write-Host "  gcpds.ps1 agent start"
  Write-Host "  gcpds.ps1 agent stop"
  Write-Host "  gcpds.ps1 agent status"
  Write-Host "  gcpds.ps1 agent logs"
}

if ($Domain -ne "agent") {
  Show-Usage
  exit 1
}

Set-Location $AppDir

switch ($Action) {
  "start" {
    docker compose -f $ComposeFile up -d --build
    Write-Host ""
    Write-Host "GCPDS research agent is starting."
    Write-Host "GUI: http://localhost:$Port/docs"
    Write-Host "API: http://localhost:$Port/api/trpc"
  }
  "stop" {
    docker compose -f $ComposeFile down
  }
  "status" {
    docker compose -f $ComposeFile ps
  }
  "logs" {
    docker compose -f $ComposeFile logs -f app
  }
  default {
    Show-Usage
    exit 1
  }
}
