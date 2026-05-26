# kubectl — Resource Management

## Declarative vs Imperative

| Style | Command | When to Use |
| --- | --- | --- |
| Declarative | `kubectl apply -f` | Production, GitOps, reproducible state |
| Imperative | `kubectl create/run/expose` | Quick experiments, one-time operations |

Prefer declarative: store manifests in version control and apply with `kubectl apply -f`.

## kubectl apply vs kubectl create

```bash
# apply — idempotent; creates or updates
kubectl apply -f deployment.yaml

# create — fails if resource already exists
kubectl create -f deployment.yaml

# replace — replaces entire object (destructive for some fields)
kubectl replace -f deployment.yaml

# force replace (deletes and recreates)
kubectl replace --force -f deployment.yaml
```

## Labels and Selectors

```bash
# Add label to resource
kubectl label pod my-pod env=production

# Remove label
kubectl label pod my-pod env-

# List pods with label selector
kubectl get pods -l env=production
kubectl get pods -l 'env in (production, staging)'
kubectl get pods -l env!=dev

# Annotate resource
kubectl annotate pod my-pod description="primary web pod"
```

## Namespaces

```bash
# List namespaces
kubectl get namespaces

# Create namespace
kubectl create namespace my-namespace

# Set default namespace for current context
kubectl config set-context --current --namespace=my-namespace

# Run operation in specific namespace
kubectl get pods -n my-namespace
kubectl apply -f manifest.yaml -n my-namespace

# Delete namespace (CAUTION: deletes all resources within)
kubectl delete namespace my-namespace
```

## kubectl explain

```bash
# Explain resource fields
kubectl explain pod
kubectl explain pod.spec
kubectl explain pod.spec.containers
kubectl explain deployment.spec.strategy

# List all API resources
kubectl api-resources
kubectl api-resources --namespaced=true
kubectl api-resources --namespaced=false
```

## Resource Types Cheat Sheet

| Resource | Short | Namespaced | Description |
| --- | --- | --- | --- |
| Pod | po | Yes | Smallest deployable unit |
| Deployment | deploy | Yes | Manages ReplicaSets for rolling updates |
| Service | svc | Yes | Stable network endpoint for pods |
| ConfigMap | cm | Yes | Key-value configuration data |
| Secret | - | Yes | Sensitive data (base64 encoded) |
| Ingress | ing | Yes | HTTP/S routing rules |
| PersistentVolumeClaim | pvc | Yes | Storage request |
| PersistentVolume | pv | No | Cluster-wide storage resource |
| ServiceAccount | sa | Yes | Pod identity for RBAC |
| Role / ClusterRole | - | Yes/No | RBAC permission sets |
| RoleBinding | - | Yes | Bind role to subject in namespace |
| ClusterRoleBinding | - | No | Bind role to subject cluster-wide |
| DaemonSet | ds | Yes | Run pod on every node |
| StatefulSet | sts | Yes | Ordered, stable pod identity |
| CronJob | cj | Yes | Scheduled Jobs |
| HorizontalPodAutoscaler | hpa | Yes | Auto-scale based on metrics |

```bash
# Get resources using short names
kubectl get po
kubectl get svc
kubectl get cm
kubectl get deploy
kubectl get pvc
```

## ConfigMap and Secret Management

```bash
# Create ConfigMap from literal values
kubectl create configmap app-config --from-literal=ENV=production --from-literal=LOG_LEVEL=info

# Create ConfigMap from file
kubectl create configmap app-config --from-file=config.properties

# Create Secret (values are base64 encoded automatically)
kubectl create secret generic db-secret --from-literal=password=mypassword

# Inspect Secret (decoded)
kubectl get secret db-secret -o jsonpath='{.data.password}' | base64 --decode
```

## Kustomize Integration

```bash
# Apply kustomization directory
kubectl apply -k ./overlays/production

# Preview rendered output
kubectl kustomize ./overlays/production

# Diff kustomization
kubectl diff -k ./overlays/production
```

## Resource Quotas and Limits

```bash
# View resource quotas in namespace
kubectl describe resourcequota -n my-namespace

# View limit ranges
kubectl describe limitrange -n my-namespace

# Check resource requests/limits on pods
kubectl get pods -o jsonpath='{range .items[*]}{.metadata.name}{"\t"}{.spec.containers[*].resources}{"\n"}{end}'
```
