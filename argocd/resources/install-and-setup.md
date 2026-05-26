# Install and Setup — Argo CD

## Install argocd CLI

### Linux (binary)

```bash
curl -sSL -o argocd https://github.com/argoproj/argo-cd/releases/latest/download/argocd-linux-amd64
chmod +x argocd
sudo mv argocd /usr/local/bin/argocd
argocd version --client
```

### macOS (Homebrew)

```bash
brew install argocd
argocd version --client
```

### Windows (Chocolatey)

```powershell
choco install argocd-cli
argocd version --client
```

## Retrieve Initial Admin Password

```bash
# Argo CD stores initial admin password as a Kubernetes secret
kubectl get secret argocd-initial-admin-secret \
  -n argocd \
  -o jsonpath="{.data.password}" | base64 -d && echo
```

## Login to Argo CD Server

```bash
# Port-forward to access Argo CD API server locally
kubectl port-forward svc/argocd-server -n argocd 8080:443 &

# Login with admin credentials
argocd login localhost:8080 \
  --username admin \
  --password <retrieved-password> \
  --insecure

# Login via SSO (browser-based)
argocd login <argocd-server-hostname> --sso
```

## Environment Variables

```bash
export ARGOCD_SERVER=argocd.example.com
export ARGOCD_AUTH_TOKEN=<token-from-argocd-account-generate-token>
export ARGOCD_OPTS="--insecure"   # for self-signed TLS environments
```

## Manage Multiple Server Contexts

```bash
# List configured contexts
argocd context

# Switch context
argocd context argocd.staging.example.com

# Set current context
argocd login argocd.prod.example.com --username admin --password <pass>
```

## Verify Installation

```bash
argocd version
argocd app list
argocd cluster list
```
