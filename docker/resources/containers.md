# Container Lifecycle & Debugging Reference

## Running Containers

### `docker run` — key flags

```bash
docker run [OPTIONS] IMAGE [COMMAND]

# Detach & naming
-d                          # Run in background (detached)
--name myapp                # Assign a name

# Port mapping
-p 8080:80                  # host:container — expose port
-p 127.0.0.1:8080:80        # Bind to localhost only (safer for dev)
-P                          # Publish all EXPOSE'd ports to random host ports

# Environment
-e KEY=value                # Set environment variable
--env-file .env             # Load from file

# Volumes
-v ./data:/app/data         # Bind mount (host:container)
-v myvolume:/app/data       # Named volume
--tmpfs /tmp                # In-memory tmpfs mount

# Resource limits
--memory 512m               # Max RAM
--cpus 1.5                  # Max CPU cores
--restart unless-stopped    # Restart policy

# Networking
--network mynet             # Attach to a named network
--network host              # Use host network (Linux only)
--dns 1.1.1.1               # Custom DNS

# Interactive
-it                         # Interactive + TTY (for shells)
--rm                        # Auto-remove when container exits

# User
--user 1000:1000            # Run as specific UID:GID
--read-only                 # Read-only root filesystem

# Security
--cap-drop ALL              # Drop all Linux capabilities
--cap-add NET_BIND_SERVICE  # Re-add only what's needed
--security-opt no-new-privileges
```

### Common patterns

```bash
# One-off command in a clean container
docker run --rm alpine sh -c "apk add curl && curl https://example.com"

# Database with persistent data
docker run -d --name postgres \
  -e POSTGRES_PASSWORD=secret \
  -v pgdata:/var/lib/postgresql/data \
  -p 5432:5432 \
  postgres:16-alpine

# App with live code reload (development)
docker run -d --name dev-api \
  -v $(pwd):/app \
  -w /app \
  -p 3000:3000 \
  node:22-alpine \
  sh -c "npm install && npm run dev"
```

---

## Container States & Lifecycle

```text
Created → Running → Paused
                 ↓
              Stopped → Removed
```

```bash
docker create IMAGE        # Create without starting
docker start <name>        # Start a stopped container
docker stop <name>         # Send SIGTERM, wait, then SIGKILL (graceful)
docker kill <name>         # Send SIGKILL immediately
docker pause <name>        # Freeze all processes (SIGSTOP)
docker unpause <name>      # Resume
docker restart <name>      # Stop + start
docker rm <name>           # Remove stopped container
docker rm -f <name>        # Force-remove even if running (confirm first!)
docker wait <name>         # Block until container stops, print exit code
```

---

## Inspecting Running Containers

### Logs

```bash
docker logs <name>                  # All logs
docker logs <name> -f               # Follow (tail -f style)
docker logs <name> --tail 50        # Last 50 lines
docker logs <name> --since 5m       # Last 5 minutes
docker logs <name> --since 2024-01-15T10:00:00
docker logs <name> -t               # Add timestamps
```

### Processes & resources

```bash
docker top <name>                   # Running processes (like ps aux)
docker stats                        # Live CPU/memory/network for all containers
docker stats --no-stream            # Single snapshot
docker stats <name1> <name2>        # Specific containers only
```

### Inspect (low-level metadata)

```bash
docker inspect <name>               # Full JSON metadata
docker inspect <name> | jq '.[0].State'          # Exit code, status
docker inspect <name> | jq '.[0].NetworkSettings' # IP, ports
docker inspect <name> | jq '.[0].Mounts'          # Volume/bind mounts
docker inspect <name> --format '{{.State.ExitCode}}'  # Go template
docker inspect <name> --format '{{.Config.Env}}'      # Environment vars
```

### Filesystem changes

```bash
docker diff <name>          # Show files changed since container started
                            # A=added, C=changed, D=deleted
```

---

## Executing Commands in Containers

```bash
docker exec -it <name> bash         # Interactive bash shell
docker exec -it <name> sh           # Use sh when bash isn't available (Alpine)
docker exec <name> ls /app          # Non-interactive one-off command
docker exec -it -e DEBUG=1 <name> bash  # With extra env var
docker exec -w /app/src <name> ls   # With working directory override
docker exec -u root <name> whoami   # Run as different user
```

---

## `docker debug` Plugin

`docker debug` attaches a debug sidecar to any container (even stopped ones) without
modifying the original image. It mounts a busybox/alpine toolkit into the container's
namespace.

```bash
docker debug <name>                 # Attach debug shell to running container
docker debug --image busybox <name> # Use busybox tools
docker debug alpine                 # Debug an image directly (not running container)
```

Inside the debug shell you get: curl, jq, strace, vim, netstat, ss, dig, and more —
even if the original image has none of these.

Useful when:

- The container is running but has no shell (distroless, scratch images)
- The container crashed and you need to inspect the stopped filesystem
- You need network debugging tools the app image doesn't have

---

## Copying Files

```bash
docker cp <name>:/app/config.json ./config.json    # Container → host
docker cp ./config.json <name>:/app/config.json    # Host → container
docker cp <name>:/var/log/. ./logs/                # Copy a directory
```

---

## Container Cleanup

```bash
docker rm $(docker ps -aq -f status=exited)   # Remove all stopped containers
docker container prune                         # Same thing, with confirmation
docker container prune -f                      # Skip confirmation
```

---

## Exit Code Reference

| Code | Meaning | Common cause |
| --- | --- | --- |
| 0 | Clean exit | App finished normally |
| 1 | General error | App threw an uncaught exception |
| 137 | SIGKILL (128+9) | OOM killed or `docker kill` |
| 139 | Segfault (128+11) | Memory corruption, invalid pointer |
| 143 | SIGTERM (128+15) | `docker stop`, graceful shutdown |
| 125 | Docker daemon error | Bad `docker run` option |
| 126 | Command not executable | Permission issue in container |
| 127 | Command not found | Missing binary in image |

If a container shows exit code **137** and your app didn't explicitly exit, it was
OOM killed. Confirm with: `docker inspect <name> | jq '.[0].State.OOMKilled'`
