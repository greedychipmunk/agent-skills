# Application Management — Argo CD

## Application CRD Anatomy

```yaml
apiVersion: argoproj.io/v1alpha1
kind: Application
metadata:
  name: my-app
  namespace: argocd
spec:
  project: default
  source:
    repoURL: https://github.com/org/repo
    targetRevision: HEAD        # branch, tag, or commit SHA
    path: k8s/overlays/production
  destination:
    server: https://kubernetes.default.svc
    namespace: production
  syncPolicy:
    automated:
      prune: false              # set true carefully after validating resources
      selfHeal: true            # revert manual changes in cluster
    syncOptions:
      - CreateNamespace=true
```

## Source Types

### Git Directory

```yaml
source:
  repoURL: https://github.com/org/repo
  path: k8s/base
  targetRevision: main
```

### Helm Chart

```yaml
source:
  repoURL: https://charts.example.com
  chart: my-chart
  targetRevision: 1.2.3
  helm:
    valueFiles:
      - values-production.yaml
    parameters:
      - name: image.tag
        value: "v2.0.0"
```

### Kustomize

```yaml
source:
  repoURL: https://github.com/org/repo
  path: kustomize/overlays/prod
  targetRevision: HEAD
  kustomize:
    images:
      - myapp=docker.io/org/myapp:v2.0.0
```

## Sync Policy

```yaml
syncPolicy:
  automated:
    prune: true       # delete resources removed from Git
    selfHeal: true    # revert out-of-band cluster changes
  retry:
    limit: 5
    backoff:
      duration: 5s
      maxDuration: 3m
      factor: 2
```

## Sync Waves

Control resource apply order using annotations:

```yaml
metadata:
  annotations:
    argocd.argoproj.io/sync-wave: "1"   # lower numbers apply first
```

Common pattern: `-1` for CRDs, `0` for Namespaces, `1` for Deployments, `2` for Services.

## Sync Hooks

```yaml
metadata:
  annotations:
    argocd.argoproj.io/hook: PreSync      # PreSync | Sync | PostSync | SyncFail
    argocd.argoproj.io/hook-delete-policy: HookSucceeded
```

Hook types:

- `PreSync` — runs before sync (e.g., database migrations)
- `Sync` — runs alongside normal resources
- `PostSync` — runs after all resources are healthy
- `SyncFail` — runs only if the sync fails (e.g., notifications)

## Health Status States

| Status | Meaning |
| -------- | --------- |
| Healthy | All resources are healthy |
| Progressing | Resources are transitioning |
| Degraded | One or more resources failed |
| Missing | Resources not found in cluster |
| Suspended | Intentionally paused |
| Unknown | Health cannot be determined |

## Resource Tracking Methods

Argo CD tracks resources using one of:

- **Label** (`app.kubernetes.io/instance`) — default
- **Annotation** (`argocd.argoproj.io/tracking-id`) — recommended for multi-app clusters
- **Annotation+Label** — combined approach

Configure in `argocd-cm` ConfigMap:

```yaml
data:
  application.resourceTrackingMethod: annotation
```
