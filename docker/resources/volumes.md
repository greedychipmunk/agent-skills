# Docker Volumes & Storage Reference

## Volume Types

| Type | Syntax | Use case |
| --- | --- | --- |
| Named volume | `myvolume:/path` | Persistent data (databases, uploads) — managed by Docker |
| Bind mount | `./local:/path` | Development (hot reload, config files) |
| tmpfs | `--tmpfs /path` | Sensitive temp data (in memory, doesn't persist) |

Use named volumes for data you care about, bind mounts for dev code sharing,
tmpfs for secrets or build caches that shouldn't hit disk.

---

## Named Volumes

```bash
docker volume create mydata
docker volume ls
docker volume inspect mydata           # Shows mountpoint on host
docker volume rm mydata
docker volume prune                    # Remove all unused volumes (confirm!)

# Use in run
docker run -v mydata:/app/data myimage
```

Named volumes on Docker Desktop live inside the VM, not on the Windows filesystem.
Use `docker volume inspect` to find the actual location.

---

## Bind Mounts

```bash
docker run -v $(pwd)/app:/app myimage
docker run -v ./app:/app myimage             # Works in compose; CLI needs full path
docker run -v ./config:/etc/myapp:ro myimage # Read-only bind mount
```

In Compose, relative paths are relative to the compose file location:

```yaml
volumes:
  - ./src:/app/src                    # Bind mount (hot reload)
  - ./config/nginx.conf:/etc/nginx/nginx.conf:ro
  - /var/run/docker.sock:/var/run/docker.sock:ro  # Docker socket
```

---

## tmpfs Mounts

```bash
docker run --tmpfs /tmp myimage
docker run --tmpfs /tmp:size=100m,noexec myimage
```

In Compose:

```yaml
services:
  api:
    tmpfs:
      - /tmp
      - /run/secrets:size=10m
```

---

## Volume Management in Compose

```yaml
services:
  db:
    volumes:
      - pgdata:/var/lib/postgresql/data       # Named volume
      - ./init:/docker-entrypoint-initdb.d:ro # Bind mount (read-only)

volumes:
  pgdata:                                      # Managed by Docker
  uploads:
    driver: local
    driver_opts:
      type: none
      device: /mnt/nfs/uploads                 # External NFS mount
      o: bind

  # Reference an existing external volume
  external-data:
    external: true
    name: my-existing-volume
```

---

## Backup & Restore

### Backup a named volume

```bash
docker run --rm \
  -v myvolume:/data:ro \
  -v $(pwd):/backup \
  alpine \
  tar czf /backup/myvolume-backup.tar.gz -C /data .
```

### Restore a named volume

```bash
docker volume create myvolume-restored
docker run --rm \
  -v myvolume-restored:/data \
  -v $(pwd):/backup:ro \
  alpine \
  sh -c "cd /data && tar xzf /backup/myvolume-backup.tar.gz"
```

---

## Volume Permissions

A common issue: the app runs as a non-root user, but the volume is owned by root.

Fix 1 — Set ownership in Dockerfile:

```dockerfile
RUN mkdir -p /app/data && chown -R appuser:appuser /app/data
VOLUME /app/data
```

Fix 2 — Match UIDs:

```bash
docker run --user $(id -u):$(id -g) -v $(pwd)/data:/app/data myimage
```

---

## Disk Usage

```bash
docker system df                          # Disk usage by images, containers, volumes
docker system df -v                       # Verbose (shows individual items)
```

**Warning**: `docker volume prune` and `docker system prune -v` delete all data in
unattached volumes. Always confirm you don't need the data first.
