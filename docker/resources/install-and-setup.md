# Docker Install & Setup

## Prerequisites

- macOS 11+ (Intel or Apple Silicon), Linux with kernel 4.4+, or Windows 10/11
- Admin/sudo access
- Virtualization enabled (macOS: native, Linux: KVM, Windows: Hyper-V or WSL2)

## Install by Platform

### macOS

```bash
# Via Homebrew (simplest)
brew install --cask docker

# Or download Docker Desktop DMG directly from docker.com
# Then open the DMG and drag Docker.app to Applications
```

### Linux (Docker Engine)

```bash
# Official convenience script (recommended for quick setup)
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Add your user to docker group (avoids sudo)
sudo usermod -aG docker $USER

# Apply group membership (logout/login, or use newgrp)
newgrp docker

# Verify
docker run hello-world
```

### Windows

```powershell
# Via winget
winget install Docker.DockerDesktop

# Or download Docker Desktop installer from docker.com
# Install and restart computer (Hyper-V required)
```

## Post-Install Configuration

### Start Docker Daemon

```bash
# macOS/Linux: Docker usually starts automatically; if not:
sudo systemctl start docker
sudo systemctl enable docker  # start on boot

# Verify
docker --version
docker ps
```

### Configure daemon.json (Linux only)

Edit `/etc/docker/daemon.json`:

```bash
sudo bash -c 'cat > /etc/docker/daemon.json << EOF
{
  "storage-driver": "overlay2",
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  },
  "insecure-registries": []
}
EOF'

sudo systemctl restart docker
```

### Login to Registry

```bash
# Docker Hub
docker login

# Private registry
docker login registry.example.com
```

### Enable Buildx (multi-architecture builds)

```bash
docker buildx create --use
docker buildx ls
```

## Verification

```bash
# Check version
docker --version

# Verify daemon and settings
docker info

# Test with hello-world
docker run --rm hello-world
```

## Troubleshooting

### "docker: permission denied"

- Add your user to docker group: `sudo usermod -aG docker $USER`
- Then logout/login or use `newgrp docker`.

### "Cannot connect to Docker daemon"

- Daemon not running. Start it: `sudo systemctl start docker` (Linux) or launch Docker Desktop (macOS/Windows).

### "no space left on device"

- Docker images/containers filled disk. Run: `docker system prune -a` to clean up.

### Image pull slow or fails

- Network issue or registry down. Try: `docker pull --all-platforms ubuntu` with timeout.
