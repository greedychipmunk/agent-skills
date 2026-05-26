# Docker Swarm Orchestration Reference

## Concepts

- **Manager node**: Orchestrates services, maintains cluster state (Raft consensus)
- **Worker node**: Executes tasks assigned by managers
- **Service**: Desired state declaration (image + replicas + constraints)
- **Task**: A running container instance of a service
- **Stack**: A group of related services defined in a Compose file

---

## Init & Join

```bash
docker swarm init
docker swarm init --advertise-addr 192.168.1.10    # Specify IP if multiple interfaces

docker swarm join-token worker                     # Print worker join command
docker swarm join-token manager                    # Print manager join command

docker swarm join --token SWMTKN-... 192.168.1.10:2377

docker swarm leave                                 # Worker leaving
docker swarm leave --force                         # DESTRUCTIVE: forces manager to leave
                                                   # Destroys swarm if last manager!
```

---

## Node Management

```bash
docker node ls
docker node inspect <node-id> --pretty

docker node promote <node-id>                      # Worker → Manager
docker node demote <node-id>                       # Manager → Worker

docker node update --availability active <node>    # Accept tasks
docker node update --availability pause <node>     # Stop accepting new tasks
docker node update --availability drain <node>     # Drain existing tasks

docker node update --label-add type=db node-1     # For placement constraints
```

---

## Services

```bash
# Create
docker service create \
  --name myapp \
  --replicas 3 \
  --publish published=80,target=80 \
  --network myoverlay \
  --env NODE_ENV=production \
  --constraint "node.role==worker" \
  --update-parallelism 2 \
  --update-delay 10s \
  --update-failure-action rollback \
  --limit-memory 512M \
  myimage:latest

docker service ls
docker service ps myapp                            # Tasks (instances)
docker service logs myapp -f
docker service scale myapp=5
docker service update myapp --image myimage:v2
docker service rollback myapp
docker service rm myapp
```

---

## Stacks

Stacks deploy a multi-service app using a Compose file. Note: `build:` is ignored
in Swarm — images must be pre-built and pushed to a registry.

```bash
docker stack deploy -c docker-compose.yml mystack
docker stack ls
docker stack ps mystack
docker stack services mystack
docker stack rm mystack                            # Removes all services in stack
```

### Compose file for Swarm

```yaml
version: "3.9"
services:
  api:
    image: myregistry/api:latest                   # Must be a pulled image
    deploy:
      replicas: 3
      update_config:
        parallelism: 1
        delay: 10s
        failure_action: rollback
      restart_policy:
        condition: on-failure
        max_attempts: 3
      placement:
        constraints:
          - node.role == worker
          - node.labels.type == api
      resources:
        limits:
          cpus: "1.0"
          memory: 512M
    networks:
      - backend
    secrets:
      - db_password

secrets:
  db_password:
    external: true                                 # Created with `docker secret create`

networks:
  backend:
    driver: overlay
```

---

## Secrets and Configs

```bash
# Secrets (encrypted, /run/secrets/<name>)
echo "mysecret" | docker secret create db_password -
docker secret ls
docker secret rm db_password                       # Can't rm if used by a service

# Configs (unencrypted, for config files)
docker config create nginx_conf ./nginx.conf
docker service create \
  --name nginx \
  --config source=nginx_conf,target=/etc/nginx/nginx.conf \
  nginx:alpine
```

---

## Overlay Networks

```bash
docker network create --driver overlay myoverlay
docker network create --driver overlay --attachable myoverlay  # Allow standalone containers

# Services on same overlay communicate by service name
docker service create --name api --network myoverlay myapi
docker service create --name db --network myoverlay postgres:16
```
