---
name: kubectl
description: Manage Kubernetes resources, contexts, and workloads with kubectl. Use when tasks mention kubectl, Kubernetes resources, kubeconfig, kubectl apply, kubectl get pods, Kubernetes contexts, or KUBECONFIG.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# kubectl

Use this skill to keep Kubernetes resource management deterministic and safe across clusters and namespaces.

## Intent Router

| Request | Reference | Load When |
| --- | --- | --- |
| Install, kubeconfig setup, contexts, env vars | `resources/install-and-setup.md` | User needs to install kubectl or configure KUBECONFIG/contexts |
| Core commands: get/describe/apply/delete/logs/exec | `resources/command-cookbook.md` | User needs daily kubectl operations |
| Resources, labels, namespaces, explain | `resources/resource-management.md` | User asks about resource types, labels, selectors, or declarative workflows |
| Pod crashes, ImagePull errors, events, debug | `resources/troubleshooting.md` | User encounters CrashLoopBackOff, OOMKilled, or needs cluster diagnostics |

## Quick Start

```bash
# Verify connectivity
kubectl cluster-info
kubectl get nodes

# Confirm active context and namespace
kubectl config current-context
kubectl config view --minify

# List pods in all namespaces
kubectl get pods -A

# Apply a manifest
kubectl apply -f deployment.yaml --dry-run=client
kubectl apply -f deployment.yaml
```

## Core Command Tracks

- **Read state:** `kubectl get/describe <resource>` — inspect current cluster state
- **Apply changes:** `kubectl apply -f` — declarative reconciliation
- **Logs:** `kubectl logs <pod> [-c <container>] [-f] [--previous]`
- **Shell:** `kubectl exec -it <pod> -- bash`
- **Port forward:** `kubectl port-forward <pod> 8080:80`
- **Rollout:** `kubectl rollout status/history/undo deployment/<name>`
- **Scale:** `kubectl scale deployment/<name> --replicas=3`
- **Output formats:** `-o wide`, `-o json`, `-o yaml`, `-o jsonpath`

## Safety Guardrails

- Always confirm active context (`kubectl config current-context`) before applying changes to prevent applying to the wrong cluster.
- Always specify namespace explicitly with `-n <namespace>` for production operations; never rely on default namespace alone.
- Use `--dry-run=client -o yaml` to preview resources before applying.
- Use `kubectl diff -f <file>` to see what will change before applying.
- Confirm before running `kubectl delete` — especially with label selectors (`-l`) which can match many resources.
- Never run `kubectl delete namespace <name>` without explicit user confirmation; it deletes all resources in the namespace.
- Prefer `kubectl rollout undo` over direct manifest rewrites for reverting deployments.

```bash
# Troubleshoot a crashing pod: check recent events then inspect previous container logs
kubectl get events --sort-by=.lastTimestamp -n my-namespace
kubectl logs my-pod --previous -n my-namespace
```

## Workflow

1. Confirm context: `kubectl config current-context` and `kubectl config get-contexts`.
2. Inspect current state with `kubectl get` and `kubectl describe` before making changes.
3. Preview changes with `kubectl diff -f <file>` or `--dry-run=client`.
4. Apply changes with `kubectl apply -f <file>`.
5. Monitor rollout with `kubectl rollout status deployment/<name>`.
6. On failure, check events with `kubectl get events --sort-by=.lastTimestamp`.

## Related Skills

- **helm** — package manager for Kubernetes applications
- **docker** — container image building for Kubernetes workloads

## References

- `resources/install-and-setup.md`
- `resources/command-cookbook.md`
- `resources/resource-management.md`
- `resources/troubleshooting.md`
- Official docs: <https://kubernetes.io/docs/reference/kubectl/>
- Command reference: <https://kubernetes.io/docs/reference/generated/kubectl/kubectl-commands>
