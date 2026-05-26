---
name: argocd
description: Deploy Kubernetes apps declaratively with Argo CD applications and projects. Use when tasks mention argocd, Argo CD, argocd app sync, Application CRD, AppProject, or GitOps with Argo CD.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# Argo CD

Use this skill to manage GitOps deployments with Argo CD declaratively and safely.

## Quick Start

1. Run `argocd app list` to see all applications and their sync status.
2. Run `argocd app diff <name>` before any sync to preview what will change.
3. Use `argocd app sync <name>` to trigger a deployment.
4. Check `argocd app get <name>` for health and sync state after deploying.

## Intent Router

- `resources/install-and-setup.md` — install argocd CLI, login, env vars, initial setup
- `resources/command-cookbook.md` — argocd app list/get/create/sync/diff/history/rollback commands
- `resources/application-management.md` — Application CRD, sync policies, waves, hooks, health status
- `resources/rbac-and-projects.md` — AppProject CRD, RBAC policies, SSO, multi-tenancy

## Workflow

### Deploy an Application

```bash
# Preview changes before syncing
argocd app diff my-app

# Sync a specific application
argocd app sync my-app

# Sync only specific resources
argocd app sync my-app --resource apps:Deployment:my-deployment
```

### Create an Application

```bash
argocd app create my-app \
  --repo https://github.com/org/repo \
  --path k8s/overlays/production \
  --dest-server https://kubernetes.default.svc \
  --dest-namespace production \
  --sync-policy automated
```

### Monitor Health

```bash
argocd app get my-app
argocd app history my-app
argocd app rollback my-app 3
```

## Safety Guardrails

- Always run `argocd app diff <name>` before `argocd app sync` to preview what will change in production.
- Use `--dry-run` when creating or modifying Applications to validate configuration before committing.
- Set `syncPolicy.automated.prune: false` initially; enable pruning only after verifying the resource list is correct.
- Never share the `argocd-initial-admin-secret` — rotate the admin password immediately after first login.
- Use AppProject `sourceRepos` and `destinations` to restrict what repositories and clusters each team can deploy to.
- Use `argocd app sync --resource <group:kind:name>` to sync specific resources rather than triggering a full sync unnecessarily.
- Store repository credentials as Kubernetes secrets, not as plain-text in Application manifests.

## Related Skills

kubectl, helm
