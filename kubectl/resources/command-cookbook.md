# kubectl — Command Cookbook

## Get and Describe

```bash
# List resources
kubectl get pods
kubectl get pods -n my-namespace
kubectl get pods -A                        # all namespaces
kubectl get pods -o wide                   # with node/IP info
kubectl get pods -l app=myapp              # label selector
kubectl get all                            # pods, services, deployments, etc.

# Describe resource (events, conditions, spec)
kubectl describe pod my-pod
kubectl describe node my-node
kubectl describe deployment my-deployment
```

## Apply and Create

```bash
# Declarative apply (preferred)
kubectl apply -f manifest.yaml
kubectl apply -f ./manifests/             # directory
kubectl apply -f https://example.com/manifest.yaml

# Preview before applying
kubectl apply -f manifest.yaml --dry-run=client
kubectl apply -f manifest.yaml --dry-run=client -o yaml

# Diff what will change
kubectl diff -f manifest.yaml

# Imperative create (for quick one-offs)
kubectl create deployment nginx --image=nginx
kubectl create service clusterip nginx --tcp=80:80
```

## Delete

```bash
kubectl delete pod my-pod
kubectl delete -f manifest.yaml
kubectl delete deployment my-deployment
kubectl delete pod -l app=myapp            # by label selector — use carefully
kubectl delete all -l app=myapp            # deletes many resource types
```

## Logs

```bash
# Basic logs
kubectl logs my-pod
kubectl logs my-pod -c my-container        # specific container in pod

# Stream logs
kubectl logs -f my-pod

# Previous container (after crash)
kubectl logs my-pod --previous

# Time-limited logs
kubectl logs my-pod --since=1h
kubectl logs my-pod --since-time="2024-01-01T00:00:00Z"

# Multi-pod logs (with label selector)
kubectl logs -l app=myapp --all-containers=true
```

## Exec and Shell

```bash
# Interactive shell
kubectl exec -it my-pod -- bash
kubectl exec -it my-pod -- sh             # if bash not available
kubectl exec -it my-pod -c my-container -- bash

# Run a single command
kubectl exec my-pod -- ls /app
kubectl exec my-pod -- env
```

## Port Forward

```bash
kubectl port-forward pod/my-pod 8080:80
kubectl port-forward svc/my-service 8080:80
kubectl port-forward deployment/my-deployment 8080:80
```

## Rollout Management

```bash
# Check rollout progress
kubectl rollout status deployment/my-deployment

# View rollout history
kubectl rollout history deployment/my-deployment
kubectl rollout history deployment/my-deployment --revision=2

# Undo last rollout
kubectl rollout undo deployment/my-deployment

# Rollback to specific revision
kubectl rollout undo deployment/my-deployment --to-revision=2

# Pause/resume rolling update
kubectl rollout pause deployment/my-deployment
kubectl rollout resume deployment/my-deployment
```

## Scale

```bash
kubectl scale deployment/my-deployment --replicas=3
kubectl scale --replicas=0 deployment/my-deployment  # scale to zero
```

## Edit and Patch

```bash
# Open resource in editor
kubectl edit deployment my-deployment

# Patch (merge patch)
kubectl patch deployment my-deployment -p '{"spec":{"replicas":3}}'

# Patch (strategic merge)
kubectl patch deployment my-deployment --type=strategic -p '{"spec":{"template":{"spec":{"containers":[{"name":"app","image":"myapp:v2"}]}}}}'

# Patch (json patch)
kubectl patch deployment my-deployment --type=json -p='[{"op":"replace","path":"/spec/replicas","value":3}]'
```

## Copy Files

```bash
kubectl cp my-pod:/app/log.txt ./log.txt
kubectl cp ./config.yaml my-pod:/app/config.yaml
kubectl cp my-pod:/app/logs/ ./local-logs/ -c my-container
```

## Resource Usage (Top)

```bash
kubectl top nodes
kubectl top pods
kubectl top pods -n my-namespace
kubectl top pods --sort-by=memory
```

## Output Formats

```bash
# Wide output (extra columns)
kubectl get pods -o wide

# JSON output
kubectl get pod my-pod -o json

# YAML output
kubectl get pod my-pod -o yaml

# JSONPath
kubectl get pods -o jsonpath='{.items[*].metadata.name}'
kubectl get pod my-pod -o jsonpath='{.status.podIP}'

# Custom columns
kubectl get pods -o custom-columns=NAME:.metadata.name,STATUS:.status.phase,NODE:.spec.nodeName

# Sort by field
kubectl get pods --sort-by=.metadata.creationTimestamp
```

## Dry-Run Pattern

```bash
# Generate YAML from imperative command
kubectl create deployment nginx --image=nginx --dry-run=client -o yaml > deployment.yaml

# Preview apply without writing
kubectl apply -f deployment.yaml --dry-run=client -o yaml
```
