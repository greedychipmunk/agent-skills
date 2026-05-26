# kubectl — Troubleshooting

## Pod Crash Loop Diagnosis

### Step 1: Check Pod Status

```bash
kubectl get pods -n my-namespace
kubectl get pods -A | grep -v Running | grep -v Completed
```

Common problem states:

| Status | Meaning |
| --- | --- |
| CrashLoopBackOff | Container keeps exiting; Kubernetes retries with backoff |
| OOMKilled | Container exceeded memory limit |
| ImagePullBackOff | Cannot pull container image |
| ErrImagePull | Image pull error (auth, network, tag not found) |
| Pending | Not scheduled; check node resources or taints |
| Terminating | Stuck during deletion; may need force delete |

### Step 2: Describe Pod

```bash
kubectl describe pod my-pod -n my-namespace
```

Look for:

- **Events** section at the bottom — most diagnostic information is here
- **Last State** — exit code and reason of previous container
- **Conditions** — Ready, ContainersReady, Initialized, PodScheduled

### Step 3: View Logs

```bash
# Current logs
kubectl logs my-pod -n my-namespace

# Previous container instance (after crash)
kubectl logs my-pod --previous -n my-namespace

# Multi-container pod
kubectl logs my-pod -c my-container --previous
```

## CrashLoopBackOff

```bash
# View exit code
kubectl describe pod my-pod | grep "Exit Code"

# Common exit codes:
# 1   — application error
# 137 — OOMKilled (128 + 9 SIGKILL)
# 143 — SIGTERM (graceful shutdown)
# 126 — command not executable
# 127 — command not found

# Check logs from previous crash
kubectl logs my-pod --previous
```

## OOMKilled

```bash
# Confirm OOM
kubectl describe pod my-pod | grep -A2 "Last State"
# Output: Reason: OOMKilled

# Check current memory limits
kubectl get pod my-pod -o jsonpath='{.spec.containers[*].resources.limits.memory}'

# View real-time memory usage
kubectl top pod my-pod
```

Fix: increase `resources.limits.memory` in the pod spec.

## ImagePullBackOff / ErrImagePull

```bash
kubectl describe pod my-pod | grep -A10 Events
```

Common causes:

- Image tag does not exist: verify tag with `docker pull` or registry UI
- Private registry: ensure `imagePullSecrets` is configured
- Registry credentials expired: recreate the image pull secret

```bash
# Create image pull secret
kubectl create secret docker-registry my-registry-secret \
  --docker-server=registry.example.com \
  --docker-username=myuser \
  --docker-password=mypassword \
  --docker-email=me@example.com
```

## Pending Pods

```bash
kubectl describe pod my-pod | grep -A20 Events
```

Common causes:

- **Insufficient resources:** no node has enough CPU/memory
- **Taints:** node has taint that pod does not tolerate
- **NodeSelector/Affinity:** no node matches

```bash
# Check node capacity
kubectl describe nodes | grep -A5 "Allocated resources"

# Check taints on nodes
kubectl get nodes -o json | jq '.items[].spec.taints'
```

## Cluster Events

```bash
# All events sorted by time
kubectl get events --sort-by=.lastTimestamp

# Events in specific namespace
kubectl get events -n my-namespace --sort-by=.lastTimestamp

# Watch events in real time
kubectl get events -n my-namespace -w

# Filter by involved object
kubectl get events --field-selector involvedObject.name=my-pod
```

## kubectl debug (Ephemeral Containers)

```bash
# Attach debug container to running pod (Kubernetes 1.23+)
kubectl debug -it my-pod --image=busybox --target=my-container

# Create copy of pod with debug image
kubectl debug my-pod -it --copy-to=my-pod-debug --image=ubuntu

# Debug node via pod
kubectl debug node/my-node -it --image=ubuntu
```

## Node Pressure

```bash
# Describe node for conditions and resource pressure
kubectl describe node my-node

# Look for conditions:
# MemoryPressure, DiskPressure, PIDPressure, Ready=False

# Check allocatable vs requested
kubectl describe node my-node | grep -A10 "Allocated resources"
```

## Resource Quota and Limit Range Issues

```bash
# Check if namespace quota is exhausted
kubectl describe resourcequota -n my-namespace

# Check limit range (default limits applied to pods)
kubectl describe limitrange -n my-namespace

# Admission errors often appear in events
kubectl get events -n my-namespace --field-selector reason=FailedCreate
```

## Taints and Tolerations

```bash
# View node taints
kubectl describe node my-node | grep Taint

# Add taint to node
kubectl taint node my-node key=value:NoSchedule

# Remove taint
kubectl taint node my-node key=value:NoSchedule-

# Pod toleration example in spec:
# tolerations:
# - key: "key"
#   operator: "Equal"
#   value: "value"
#   effect: "NoSchedule"
```

## Force Delete Stuck Terminating Pod

```bash
# Last resort — only when pod is confirmed stuck
kubectl delete pod my-pod --grace-period=0 --force -n my-namespace
```
