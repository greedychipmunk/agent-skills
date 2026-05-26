#!/usr/bin/env pwsh
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

function Get-Platform {
  if ($IsWindows) { return 'windows' }
  if ($IsMacOS) { return 'macos' }
  if ($IsLinux) { return 'linux' }
  return 'unknown'
}

function Main {
  $platform = Get-Platform

  # Check if docker is already installed
  if (Get-Command docker -ErrorAction SilentlyContinue) {
    $version = & docker --version
    Write-Host "[OK] $version already installed"
    Write-Host "[HINT] See 'references/install-and-setup.md' for post-install configuration"
    return
  }

  switch ($platform) {
    'windows' {
      Write-Host "[INFO] Installing Docker on Windows via winget..."
      if (Get-Command winget -ErrorAction SilentlyContinue) {
        & winget install Docker.DockerDesktop
        Write-Host "[OK] Docker Desktop installed"
        Write-Host "[WARN] Please restart your computer and launch Docker Desktop"
      } else {
        Write-Host "[ERROR] winget not found"
        Write-Host "[HINT] Download Docker Desktop from https://www.docker.com/products/docker-desktop"
        exit 1
      }
    }

    'macos' {
      Write-Host "[INFO] Installing Docker on macOS via Homebrew..."
      if (Get-Command brew -ErrorAction SilentlyContinue) {
        & brew install --cask docker
        Write-Host "[OK] Docker Desktop installed"
        Write-Host "[HINT] Launch Docker.app to start the daemon"
      } else {
        Write-Host "[ERROR] Homebrew not found. Install from https://brew.sh"
        exit 1
      }
    }

    'linux' {
      Write-Host "[INFO] Installing Docker Engine on Linux..."
      Write-Host "[INFO] Using official Docker convenience script..."

      $tmpfile = New-TemporaryFile
      Invoke-WebRequest -Uri "https://get.docker.com" -OutFile $tmpfile
      & sudo bash $tmpfile
      Remove-Item $tmpfile -Force

      Write-Host "[OK] Docker installed successfully"
      Write-Host "[INFO] Adding user to docker group..."
      & sudo usermod -aG docker $env:USERNAME
      Write-Host "[WARN] You must log out and log back in for group membership to take effect"
    }

    default {
      Write-Host "[ERROR] Unsupported platform: $platform"
      exit 1
    }
  }

  # Verify installation (may not work immediately after install on some platforms)
  if (Get-Command docker -ErrorAction SilentlyContinue) {
    & docker --version
    Write-Host "[OK] Installation verified"
    Write-Host ""
    Write-Host "[HINT] Test with: docker run --rm hello-world"
    Write-Host "[HINT] See 'references/install-and-setup.md' for complete setup steps"
  } else {
    Write-Host "[INFO] Docker installed but may require restart to be available"
    Write-Host "[HINT] See 'references/install-and-setup.md' for complete setup steps"
  }
}

Main
