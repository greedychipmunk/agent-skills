# Docker Troubleshooting Reference

## Systematic Debugging

1. `docker ps -a` — find the container, note status and exit code
2. `docker logs <name> --tail=100` — read the actual error
3. `docker inspect <name>` — check config, mounts, network, exit code
4. `docker stats --no-stream` — check resource usage (OOM?)
5. `docker events --since 5m` — what happened to the daemon recently
6. `docker system df` — are you out of disk space?

---

## Container Won't Start / Keeps Restarting

### Immediately exits (exit 0)

The process ran and finished normally. Check if CMD/ENTRYPOINT is correct.

```bash
docker run --rm -it --entrypoint sh myimage    # Override entrypoint to explore
```

### Exits with code 1 (application error)

```bash
docker logs myapp          # Read the app's error output
# Look for: missing env vars, config file not found, port in use, dependency unreachable
```

### Exits with code 137 (OOM killed)

```bash
docker inspect myapp | jq '.[0].State.OOMKilled'  # Returns true
# Fix: increase --memory limit, fix memory leak, or reduce workload
```

### "bad interpreter" / scripts fail

CRLF line endings on scripts mounted from Windows:

```bash
docker run --rm -v .:/w alpine sed -i 's/\r$//' /w/entrypoint.sh
# Or use .gitattributes: *.sh text eol=lf
```

---

## Build Failures

### "COPY failed: file not found"

```bash
ls -la                     # Is the file here?
cat .dockerignore          # Is it excluded?
docker build --progress=plain .  # See full context transfer
```

### "exec /entrypoint.sh: no such file or directory"

Usually CRLF endings (see above) or the file isn't executable:

```dockerfile
RUN chmod +x /entrypoint.sh
```

### Multi-stage COPY --from not found

Stage name typo — must match exactly:

```dockerfile
FROM node:22 AS builder     # Name here
COPY --from=builder /app .  # Must match exactly
```

---

## Networking Issues

### Containers can't reach each other

- Must be on same **user-defined** network (not default bridge)
- Default bridge doesn't have DNS; create a custom network

### "Connection refused" from container to host service

```bash
# Docker Desktop — special hostname
curl http://host.docker.internal:8080

# Linux — use host-gateway
docker run --add-host host.docker.internal:host-gateway myimage
```

### Port already in use

```bash
netstat -an | grep 8080    # What's using the host port?
docker run -p 8081:80 myimage  # Use different host port
```

---

## Volume & Permission Issues

### "Permission denied" writing to mounted volume

```bash
docker exec myapp id        # Container process UID
ls -la ./data              # Host directory owner
# Fix: match UIDs or chown in Dockerfile
docker run --user $(id -u):$(id -g) -v $(pwd)/data:/app/data myimage
```

---

## Docker Desktop / Windows

### Docker Desktop not starting

```bash
wsl --status               # Check WSL2 status
wsl --shutdown             # Restart WSL2, then reopen Docker Desktop
```

### "The system cannot find the path" on volume mount

Use forward slashes or relative paths:

```bash
docker run -v //c/Users/me/myapp:/app myimage   # Or use ./myapp
```

### Hot-reload not working

File change notifications may not propagate through WSL2:

```bash
# Use polling mode in dev server:
# webpack: --watch-poll
# nodemon: --legacy-watch
# vite: CHOKIDAR_USEPOLLING=true
```

### Slow I/O

Files mounted from Windows filesystem (`/mnt/c/...`) are slow via 9P.
Move project into WSL2 (`~/projects/...`) for best performance.

---

## System Events & Health

```bash
docker events --since 10m                # Real-time Docker events
docker events --filter type=container
docker events --filter event=die        # Container crashes only

docker info                             # Docker version and system info
docker system df -v                     # Detailed disk usage
```

---

## Useful One-Liners

```bash
# All env vars in a container
docker exec myapp env

# Is a port open inside a container?
docker exec myapp nc -zv localhost 3000

# DNS resolution from inside
docker exec myapp nslookup db.example.com

# Get IPs of all running containers
docker ps -q | xargs docker inspect --format '{{.Name}} {{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'

# Find which container is using a volume
docker ps -a --filter volume=myvolume
```
