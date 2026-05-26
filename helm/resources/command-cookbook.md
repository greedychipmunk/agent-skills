# helm — Command Cookbook

## Install and Upgrade

```bash
# Install a new release
helm install my-release bitnami/nginx -n my-namespace

# Upgrade existing release
helm upgrade my-release bitnami/nginx -n my-namespace

# Install or upgrade (idempotent)
helm upgrade --install my-release bitnami/nginx -n my-namespace --create-namespace

# Install specific chart version
helm upgrade --install my-release bitnami/nginx --version 15.3.0 -n my-namespace
```

## Dry Run and Debug

```bash
# Dry run (server-side validation)
helm upgrade --install my-release bitnami/nginx --dry-run

# Dry run with rendered manifest output and debug info
helm upgrade --install my-release bitnami/nginx --dry-run --debug

# Render manifests locally (no cluster connection required)
helm template my-release bitnami/nginx -f values.yaml
helm template my-release bitnami/nginx -f values.yaml > rendered.yaml
```

## Values Management

```bash
# Pass single value
helm upgrade --install my-release bitnami/nginx --set replicaCount=3

# Pass multiple values
helm upgrade --install my-release bitnami/nginx \
  --set replicaCount=3 \
  --set service.type=LoadBalancer

# Use values file
helm upgrade --install my-release bitnami/nginx -f values.yaml

# Use multiple values files (later files override earlier)
helm upgrade --install my-release bitnami/nginx -f values.yaml -f values-prod.yaml

# Mix -f and --set (--set takes highest precedence)
helm upgrade --install my-release bitnami/nginx -f values.yaml --set image.tag=v2.0
```

## List and Status

```bash
# List releases in current namespace
helm list

# List releases in specific namespace
helm list -n my-namespace

# List all releases across all namespaces
helm list -A

# List failed releases
helm list -A --failed

# Show release status and notes
helm status my-release -n my-namespace

# Show status with all resources
helm status my-release -n my-namespace --show-resources
```

## Uninstall

```bash
# Uninstall a release (removes all managed resources)
helm uninstall my-release -n my-namespace

# Keep history after uninstall
helm uninstall my-release -n my-namespace --keep-history
```

## Rollback and History

```bash
# View release history
helm history my-release -n my-namespace

# Rollback to previous revision
helm rollback my-release -n my-namespace

# Rollback to specific revision
helm rollback my-release 2 -n my-namespace
```

## Inspect Release Details

```bash
# Get values used by deployed release
helm get values my-release -n my-namespace

# Get all values (including defaults)
helm get values my-release -n my-namespace --all

# Get rendered manifest of deployed release
helm get manifest my-release -n my-namespace

# Get release notes
helm get notes my-release -n my-namespace

# Get all release info
helm get all my-release -n my-namespace
```

## Show Chart Info

```bash
# Show chart values (defaults)
helm show values bitnami/nginx

# Show chart README
helm show readme bitnami/nginx

# Show chart metadata
helm show chart bitnami/nginx

# Show all chart info
helm show all bitnami/nginx
```

## Search

```bash
# Search configured repos
helm search repo nginx
helm search repo bitnami/nginx
helm search repo bitnami/nginx --versions   # all versions

# Search Artifact Hub
helm search hub nginx
```

## Pull Charts Locally

```bash
# Download chart archive
helm pull bitnami/nginx

# Download and extract
helm pull bitnami/nginx --untar

# Download specific version
helm pull bitnami/nginx --version 15.3.0 --untar --untardir ./charts

# Pull from OCI registry
helm pull oci://registry.example.com/charts/myapp --version 1.2.3
```

## OCI Chart Operations

```bash
# Pull from OCI registry
helm pull oci://ghcr.io/org/charts/myapp --version 1.0.0

# Install directly from OCI
helm install my-release oci://ghcr.io/org/charts/myapp --version 1.0.0

# Upgrade from OCI
helm upgrade my-release oci://ghcr.io/org/charts/myapp --version 1.1.0
```
