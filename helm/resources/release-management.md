# helm — Release Management

## Release Lifecycle

A Helm release transitions through the following states:

| State | Description |
| --- | --- |
| `pending-install` | Release is being installed for the first time |
| `deployed` | Release is successfully installed and running |
| `pending-upgrade` | An upgrade operation is in progress |
| `pending-rollback` | A rollback is in progress |
| `failed` | Last operation failed |
| `superseded` | Previous revision of a release (replaced by newer) |
| `uninstalling` | Uninstall in progress |

```bash
# View current state
helm list -A
helm status my-release -n my-namespace

# View full history of revisions
helm history my-release -n my-namespace
```

## --atomic Flag (Auto-Rollback)

`--atomic` waits for deployment to complete and automatically rolls back on failure:

```bash
helm upgrade --install my-release bitnami/nginx \
  -f values.yaml \
  --atomic \
  --timeout 5m \
  -n my-namespace
```

Best practice: always use `--atomic` in CI/CD pipelines to prevent partial deployments.

## --wait Flag and Readiness Gates

`--wait` waits until all pods, services, and deployments are ready before marking the release as successful:

```bash
helm upgrade --install my-release bitnami/nginx \
  -f values.yaml \
  --wait \
  --timeout 10m \
  -n my-namespace
```

`--wait-for-jobs` additionally waits for any Jobs to complete:

```bash
helm upgrade --install my-release bitnami/nginx \
  --wait --wait-for-jobs --timeout 10m \
  -n my-namespace
```

## Upgrade Strategies

```bash
# Standard upgrade
helm upgrade my-release bitnami/nginx -f values.yaml -n my-namespace

# Force upgrade (deletes and recreates resources that cannot be updated in place)
helm upgrade my-release bitnami/nginx -f values.yaml --force -n my-namespace

# Reset values to chart defaults, then apply overrides
helm upgrade my-release bitnami/nginx -f values.yaml --reset-values -n my-namespace

# Reuse previously deployed values, then apply overrides
helm upgrade my-release bitnami/nginx -f values.yaml --reuse-values -n my-namespace
```

## helm diff Plugin

The helm diff plugin previews what will change before an upgrade:

```bash
# Install plugin
helm plugin install https://github.com/databus23/helm-diff

# Preview upgrade diff
helm diff upgrade my-release bitnami/nginx -f values.yaml -n my-namespace

# Compare against a specific revision
helm diff revision my-release 1 2 -n my-namespace
```

## Rollback

```bash
# View revision history
helm history my-release -n my-namespace

# Rollback to previous revision
helm rollback my-release -n my-namespace

# Rollback to specific revision number
helm rollback my-release 3 -n my-namespace

# Rollback with wait
helm rollback my-release --wait --timeout 5m -n my-namespace
```

## Namespace and --create-namespace

```bash
# Install into existing namespace
helm upgrade --install my-release bitnami/nginx -n my-namespace

# Create namespace if it does not exist
helm upgrade --install my-release bitnami/nginx \
  -n my-namespace \
  --create-namespace
```

## Helm Secrets Plugin Overview

The helm-secrets plugin integrates with SOPS or Vault for encrypted values:

```bash
# Install plugin
helm plugin install https://github.com/jkroepke/helm-secrets

# Encrypt values file with SOPS
helm secrets encrypt secrets.yaml > secrets.enc.yaml

# Install using encrypted values
helm secrets upgrade --install my-release bitnami/nginx \
  -f values.yaml \
  -f secrets.enc.yaml \
  -n my-namespace
```

## Multi-Environment Values Pattern

```text
charts/myapp/
  values.yaml           — base defaults
  values-dev.yaml       — development overrides
  values-staging.yaml   — staging overrides
  values-prod.yaml      — production overrides
```

Apply per environment:

```bash
# Development
helm upgrade --install myapp ./charts/myapp -f values.yaml -f values-dev.yaml -n dev

# Production
helm upgrade --install myapp ./charts/myapp -f values.yaml -f values-prod.yaml -n production --atomic
```

## Release Naming Conventions

- Use consistent, descriptive release names: `<app>-<env>` e.g. `nginx-prod`
- Keep release names unique within a namespace
- Avoid generic names like `test` or `myapp` in shared namespaces
- Use `--generate-name` for ephemeral test installs:

```bash
helm install --generate-name bitnami/nginx
```

## Uninstall and Cleanup

```bash
# Uninstall release (removes all managed Kubernetes resources)
helm uninstall my-release -n my-namespace

# Retain release history after uninstall (allows rollback)
helm uninstall my-release -n my-namespace --keep-history

# Confirm removal
helm list -A | grep my-release
kubectl get all -n my-namespace
```
