# Docker Networking Reference

## Network Drivers

| Driver | Use case | Notes |
| --- | --- | --- |
| `bridge` | Default for standalone containers | Isolated on host; containers talk via IP or name |
| `host` | Maximum performance on Linux | Shares host network stack; not available on Docker Desktop |
| `overlay` | Multi-host (Swarm) | Connects containers across different hosts |
| `macvlan` | Containers need MAC address on LAN | Container appears as physical device on network |
| `none` | Fully isolated | No network access; useful for batch jobs |

---

## Managing Networks

```bash
docker network ls                              # List networks
docker network inspect bridge                  # Details: connected containers, subnet, etc.
docker network create mynet                    # Create bridge network
docker network create --driver bridge \
  --subnet 172.20.0.0/16 \
  --gateway 172.20.0.1 \
  mynet

docker network connect mynet <container>       # Add running container to network
docker network disconnect mynet <container>    # Remove from network
docker network rm mynet                        # Delete (must disconnect all containers first)
docker network prune                           # Remove unused networks
```

---

## Container Name DNS

Within a user-defined bridge network, containers can reach each other by **container name**
(or service name in compose). This is why you can use `postgresql://db:5432` in a compose
service — `db` resolves to the `db` container's IP automatically.

The default `bridge` network does NOT provide automatic DNS resolution by name. Always
create custom networks for multi-container apps.

```bash
docker network create app-net
docker run -d --name postgres --network app-net postgres:16-alpine
docker run -d --name api --network app-net myapp/api
# api can reach postgres at hostname "postgres"
docker exec api ping postgres
```

---

## Port Mapping

```bash
# Syntax: -p [host_ip:]host_port:container_port[/protocol]
-p 8080:80                    # All interfaces, host 8080 → container 80
-p 127.0.0.1:8080:80          # Localhost only (safer for dev)
-p 8080:80/tcp                # Explicit TCP (default)
-p 5005:5005/udp              # UDP port
-p 80:80 -p 443:443           # Multiple ports
-P                            # Auto-assign host ports for all EXPOSE'd ports
```

**Security note**: Binding to `0.0.0.0` (the default) exposes the port on ALL network
interfaces. In development, prefer `127.0.0.1:port:port` unless you actually need
external access.

```bash
docker port <container>        # List all port mappings
docker port <container> 80     # Mapping for specific container port
```

---

## Compose Networking

By default, Compose creates one network per project and connects all services to it.
Services can reach each other by service name.

```yaml
services:
  frontend:
    networks:
      - public
      - internal

  api:
    networks:
      - internal

  db:
    networks:
      - internal              # db is only reachable from internal network

networks:
  public:
    driver: bridge
  internal:
    driver: bridge
    internal: true            # No external access from this network

  # Use an existing external network
  shared:
    external: true
    name: my-shared-network
```

---

## Network Troubleshooting

```bash
# Ping between containers
docker exec api ping -c 3 db

# DNS lookup
docker exec api nslookup db

# Check open ports inside container
docker exec api netstat -tlnp
docker exec api ss -tlnp

# Test from outside
curl http://localhost:8080/health

# See what IP a container has
docker inspect <container> --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}'

# See all containers on a network
docker network inspect mynet --format '{{range .Containers}}{{.Name}}: {{.IPv4Address}}{{end}}'
```

### Common issues

**"No route to host" / containers can't reach each other:**

- Are they on the same network? Check `docker inspect` for both
- Are you using the default `bridge`? That doesn't have DNS. Create a user-defined network.

**"Connection refused" on a mapped port:**

- Is the service listening on `0.0.0.0` inside the container, not just `127.0.0.1`?
- `docker ps` — check the port column shows `0.0.0.0:8080->80/tcp`

**Service port works in container, not from host (Docker Desktop):**

- On Docker Desktop, ports are forwarded through the VM. `localhost` on Windows
  maps to the container's mapped port automatically.

**Reach host services from inside a container:**

```bash
# Docker Desktop has a special hostname
curl http://host.docker.internal:8080

# Linux: use host-gateway
docker run --add-host host.docker.internal:host-gateway myimage
```
