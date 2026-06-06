param(
  [Parameter(Position = 0)]
  [string]$Domain,
  [Parameter(Position = 1)]
  [string]$Action
)

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$App = Join-Path $Root "app"
$Node = Join-Path $Root ".tools\node\node.exe"
$PidFile = Join-Path $Root ".agent.pid"
$LogFile = Join-Path $App "server.log"

function Show-Usage {
  Write-Host "Usage:"
  Write-Host "  .\gcpds.cmd agent start"
  Write-Host "  .\gcpds.cmd agent stop"
  Write-Host "  .\gcpds.cmd agent status"
  Write-Host "  .\gcpds.cmd agent logs"
}

function Get-AgentProcess {
  if (!(Test-Path $PidFile)) { return $null }
  $pidValue = Get-Content $PidFile -ErrorAction SilentlyContinue
  if (!$pidValue) { return $null }
  return Get-Process -Id ([int]$pidValue) -ErrorAction SilentlyContinue
}

if ($Domain -ne "agent") {
  Show-Usage
  exit 1
}

switch ($Action) {
  "start" {
    if (!(Test-Path $Node)) {
      Write-Host "Portable Node was not found at $Node"
      Write-Host "Install it first, then rerun this command."
      exit 1
    }

    $existing = Get-AgentProcess
    if ($existing) {
      Write-Host "GCPDS agent is already running at http://localhost:3000/docs"
      exit 0
    }

    $cmd = @"
`$env:NODE_ENV='production'
`$env:PORT='3000'
`$env:APP_ID='research-agent'
`$env:APP_SECRET='local-dev-secret'
`$env:DATABASE_URL='postgres://research:research@localhost:5432/research_agent'
`$env:DOCS_DIR='../db'
`$env:OUTPUT_DIR='../output'
`$env:OLLAMA_URL='http://localhost:11434'
& '$Node' 'dist\boot.js' *> 'server.log'
"@

    $process = Start-Process -FilePath "powershell.exe" `
      -ArgumentList @("-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", $cmd) `
      -WorkingDirectory $App `
      -WindowStyle Hidden `
      -PassThru

    Set-Content -Path $PidFile -Value $process.Id
    Start-Sleep -Seconds 2
    Write-Host "GCPDS agent started."
    Write-Host "GUI: http://localhost:3000/docs"
    Write-Host "API: http://localhost:3000/api/trpc"
    Write-Host "Log: $LogFile"
  }
  "stop" {
    $existing = Get-AgentProcess
    if ($existing) {
      Stop-Process -Id $existing.Id -Force
      Remove-Item $PidFile -Force -ErrorAction SilentlyContinue
      Write-Host "GCPDS agent stopped."
    } else {
      Write-Host "GCPDS agent is not running."
    }
  }
  "status" {
    $existing = Get-AgentProcess
    if ($existing) {
      Write-Host "Running: PID $($existing.Id)"
      Write-Host "GUI: http://localhost:3000/docs"
    } else {
      Write-Host "Stopped."
    }
  }
  "logs" {
    if (Test-Path $LogFile) {
      Get-Content $LogFile -Tail 80
    } else {
      Write-Host "No log file yet."
    }
  }
  default {
    Show-Usage
    exit 1
  }
}
