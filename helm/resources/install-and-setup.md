# helm — Install and Setup

## Install by Platform

### Linux (binary)

```bash
curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
helm version
```

### macOS (Homebrew)

```bash
brew install helm
helm version
```

### Debian/Ubuntu (apt)

```bash
curl https://baltocdn.com/helm/signing.asc | gpg --dearmor | sudo tee /usr/share/keyrings/helm.gpg > /dev/null
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/helm.gpg] https://baltocdn.com/helm/stable/debian/ all main" | sudo tee /etc/apt/sources.list.d/helm-stable-debian.list
sudo apt-get update && sudo apt-get install helm
```

### asdf plugin

```bash
asdf plugin add helm https://github.com/Antiarchitect/asdf-helm.git
asdf install helm latest
asdf global helm latest
```

## Verify Installation

```bash
helm version
helm env
```

## KUBECONFIG Dependency

Helm uses the same kubeconfig as kubectl. Ensure your context is correct before running Helm commands:

```bash
kubectl config current-context
kubectl config get-contexts
```

## Helm Environment Variables

| Variable | Purpose |
| --- | --- |
| `HELM_DATA_HOME` | Override data directory (default: `~/.local/share/helm`) |
| `HELM_CACHE_HOME` | Override cache directory (default: `~/.cache/helm`) |
| `HELM_CONFIG_HOME` | Override config directory (default: `~/.config/helm`) |
| `HELM_NAMESPACE` | Default namespace for Helm operations |
| `HELM_DEBUG` | Enable verbose debug output |

```bash
helm env                    # show all Helm env vars
export HELM_DEBUG=true      # enable debug globally
```

## Repository Management

```bash
# Add a repository
helm repo add bitnami https://charts.bitnami.com/bitnami
helm repo add stable https://charts.helm.sh/stable
helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx

# Update all repositories
helm repo update

# List configured repositories
helm repo list

# Remove a repository
helm repo remove bitnami

# Search for charts
helm search repo nginx
helm search repo bitnami/nginx --versions
```

## OCI Registry Authentication

Helm 3.8+ supports OCI registries natively:

```bash
# Login to OCI registry
helm registry login registry.example.com --username myuser --password mypassword

# Login to AWS ECR
aws ecr get-login-password --region us-east-1 | helm registry login \
  --username AWS \
  --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

# Pull chart from OCI registry
helm pull oci://registry.example.com/charts/myapp --version 1.2.3

# Push chart to OCI registry
helm push myapp-1.2.3.tgz oci://registry.example.com/charts

# Logout
helm registry logout registry.example.com
```

## Shell Completion

```bash
# bash
helm completion bash | sudo tee /etc/bash_completion.d/helm

# zsh
helm completion zsh > "${fpath[1]}/_helm"

# fish
helm completion fish | source
```
