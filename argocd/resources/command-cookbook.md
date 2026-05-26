# Command Cookbook — Argo CD

## Application Listing and Inspection

```bash
# List all applications with sync/health status
argocd app list

# Get detailed info for a specific application
argocd app get my-app

# Get app in YAML format
argocd app get my-app -o yaml
```

## Create Applications

```bash
# Git directory source
argocd app create my-app \
  --repo https://github.com/org/repo \
  --path k8s/overlays/production \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace production

# Helm chart source
argocd app create my-helm-app \
  --repo https://charts.example.com \
  --helm-chart my-chart \
  --revision 1.2.3 \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace staging

# Kustomize source
argocd app create my-kustomize-app \
  --repo https://github.com/org/repo \
  --path kustomize/overlays/prod \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace production

# Dry-run to validate before creating
argocd app create my-app --dry-run ...
```

## Sync and Diff

```bash
# Preview changes before syncing
argocd app diff my-app

# Sync application
argocd app sync my-app

# Sync with pruning enabled (removes resources no longer in Git)
argocd app sync my-app --prune

# Sync specific resource only
argocd app sync my-app --resource apps:Deployment:my-deploy

# Force sync (ignore resource health)
argocd app sync my-app --force
```

## History and Rollback

```bash
# View deployment history
argocd app history my-app

# Rollback to a specific revision ID
argocd app rollback my-app 5
```

## Update and Delete

```bash
# Update application source or destination
argocd app set my-app --revision v2.0.0

# Delete application (keeps resources in cluster)
argocd app delete my-app

# Delete application and prune all resources
argocd app delete my-app --cascade
```

## Cluster and Repository Management

```bash
# Add a cluster
argocd cluster add my-context-name

# List registered clusters
argocd cluster list

# Remove a cluster
argocd cluster rm https://cluster-api-server

# Add a repository
argocd repo add https://github.com/org/repo \
  --username git --password <token>

# List repositories
argocd repo list

# Remove a repository
argocd repo rm https://github.com/org/repo
```

## Project and Account Management

```bash
argocd proj list
argocd proj get my-project
argocd account list
argocd account generate-token --account ci-bot
```
