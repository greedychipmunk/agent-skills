#!/usr/bin/env bash
set -euo pipefail

# Docker Engine installer for Linux (Docker Desktop requires manual installation on macOS/Windows)

detect_platform() {
  local system=$(uname -s)
  if [[ "$system" == "Darwin" ]]; then
    echo "macos"
  elif [[ "$system" == "Linux" ]]; then
    if [[ -f /etc/os-release ]]; then
      source /etc/os-release
      echo "${ID:-linux}"
    else
      echo "linux"
    fi
  else
    echo "unknown"
  fi
}

main() {
  local platform=$(detect_platform)

  # Check if docker is already installed
  if command -v docker &>/dev/null; then
    local version=$(docker --version)
    echo "[OK] $version already installed"
    echo "[HINT] Run 'references/install-and-setup.md' for post-install configuration"
    return 0
  fi

  case "$platform" in
    macos)
      echo "[INFO] Docker on macOS requires Docker Desktop"
      echo "[HINT] Install manually:"
      echo "[HINT]   1. Download from https://www.docker.com/products/docker-desktop"
      echo "[HINT]   2. Or: brew install --cask docker"
      echo "[HINT]   3. Start Docker.app"
      exit 0
      ;;

    linux)
      echo "[INFO] Installing Docker Engine on Linux..."
      echo "[INFO] Using official Docker convenience script..."

      curl -fsSL https://get.docker.com -o get-docker.sh
      sudo sh get-docker.sh
      rm -f get-docker.sh

      echo "[OK] Docker installed successfully"
      echo "[INFO] Adding user to docker group..."
      sudo usermod -aG docker "$USER"
      echo "[WARN] You must log out and log back in for group membership to take effect"
      echo "[HINT] Or use: newgrp docker"
      ;;

    *)
      echo "[ERROR] Unsupported platform: $platform"
      exit 1
      ;;
  esac

  # Verify installation
  if command -v docker &>/dev/null; then
    docker --version
    echo "[OK] Installation verified"
    echo ""
    echo "[HINT] Test with: docker run --rm hello-world"
    echo "[HINT] See references/install-and-setup.md for complete setup steps"
  else
    echo "[ERROR] Installation verification failed"
    exit 1
  fi
}

main "$@"
