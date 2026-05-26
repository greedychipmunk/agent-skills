# Docker Compose Reference

Docker Compose v2 (the `docker compose` plugin, no hyphen) manages multi-container
applications defined in YAML. The compose file describes services, networks, and
volumes. Everything in the project is coordinated with single commands.

## Service Definition — Full Options

```yaml
services:
  api:
    # Image source
    image: nginx:alpine                     # Use pre-built image
    build:                                  # OR build from source
      context: ./api
      dockerfile: Dockerfile.prod
      args:
        NODE_ENV: production
      target: runtime                       # Multi-stage target
      cache_from:
        - myregistry/api:cache

    # Container config
    container_name: myapp-api
    hostname: api
    command: ["node", "server.js"]
    entrypoint: ["/entrypoint.sh"]
    working_dir: /app
    user: "1000:1000"
    read_only: true

    # Ports
    ports:
      - "3000:3000"
      - "127.0.0.1:3000:3000"             # Bind to localhost only
    expose:
      - "3000"                             # Expose to services, no host binding

    # Environment
    environment:
      NODE_ENV: production
      DB_URL: postgresql://user:pass@db:5432/mydb
    env_file:
      - .env
      - .env.production

    # Volumes
    volumes:
      - ./src:/app/src                     # Bind mount (dev hot-reload)
      - uploads:/app/uploads               # Named volume
      - /tmp/secrets:/run/secrets:ro       # Read-only bind mount

    # Dependencies
    depends_on:
      db:
        condition: service_healthy         # Wait for health check
      cache:
        condition: service_started         # Just wait for start (default)
      migrations:
        condition: service_completed_successfully  # Wait for exit 0

    # Health check
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

    # Restart policy
    restart: unless-stopped               # no | always | on-failure | unless-stopped

    # Resource limits
    deploy:
      resources:
        limits:
          cpus: "1.0"
          memory: 512M

    # Networking
    networks:
      - frontend
      - backend

    # Logging
    logging:
      driver: "json-file"
      options:
        max-size: "10m"
        max-file: "3"

    # Profiles
    profiles:
      - production
```

---

## Common Service Patterns

### Database with health check

```yaml
db:
  image: postgres:16-alpine
  restart: unless-stopped
  environment:
    POSTGRES_USER: ${DB_USER:-myuser}
    POSTGRES_PASSWORD: ${DB_PASSWORD:?DB_PASSWORD is required}
    POSTGRES_DB: ${DB_NAME:-mydb}
  volumes:
    - pgdata:/var/lib/postgresql/data
    - ./init.sql:/docker-entrypoint-initdb.d/init.sql:ro
  healthcheck:
    test: ["CMD-SHELL", "pg_isready -U ${DB_USER:-myuser}"]
    interval: 10s
    timeout: 5s
    retries: 5
    start_period: 30s
  networks:
    - backend
```

### Run-once migration container

```yaml
migrations:
  image: myapp/api:latest
  command: ["npm", "run", "migrate"]
  environment:
    DATABASE_URL: postgresql://user:pass@db:5432/mydb
  depends_on:
    db:
      condition: service_healthy
  networks:
    - backend
  restart: "no"                           # Don't restart after it completes
```

---

## Environment Variables in Compose Files

```yaml
environment:
  KEY: value                              # Direct value
  KEY: ${KEY}                             # From shell/env-file (required)
  KEY: ${KEY:-default_value}              # With default
  DB_PASSWORD: ${DB_PASSWORD:?required}   # Error if not set
```

`.env` file in the project directory is auto-loaded. For others:

```bash
docker compose --env-file .env.staging up
```

---

## Profiles

```yaml
services:
  api:
    image: myapp/api          # No profile — always starts

  mailhog:
    image: mailhog/mailhog
    profiles:
      - dev                   # Only starts with --profile dev
```

```bash
docker compose up -d                      # Starts api only
docker compose --profile dev up -d        # Starts api + mailhog
```

---

## Key Compose Commands

```bash
# Start / stop
docker compose up -d                      # Start all services (detached)
docker compose up -d --build              # Force rebuild before starting
docker compose up -d api worker           # Start specific services only
docker compose down                       # Stop & remove containers + networks
docker compose down -v                    # Also remove volumes (data loss!)

# Status & logs
docker compose ps                         # Service status
docker compose logs -f                    # Follow all service logs
docker compose logs -f api                # Follow one service
docker compose logs --tail=50 api

# Interact
docker compose exec api bash              # Shell into running service
docker compose run --rm api npm test      # One-off command (new container)

# Build
docker compose build                      # Build all images
docker compose build --no-cache           # No layer cache
docker compose pull                       # Pull latest images

# Config validation
docker compose config                     # Show resolved config
docker compose config --quiet             # Validate only (exit code)

# Scale
docker compose up -d --scale worker=3

# List projects
docker compose ls
```

---

## Override Files

```bash
# Default: docker-compose.yml (always loaded)
# Override: docker-compose.override.yml (auto-loaded if exists)
docker compose up -d

# Explicit merge
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

`docker-compose.yml` — base config
`docker-compose.override.yml` — dev overrides (bind mounts, debug ports)
`docker-compose.prod.yml` — production overrides (resource limits, no bind mounts)

---

## Dependency Ordering

```yaml
depends_on:
  db:
    condition: service_healthy            # Needs healthcheck defined on db
  cache:
    condition: service_started            # Just waits for container to start
  setup:
    condition: service_completed_successfully  # Waits for exit code 0
```

`service_started` is often insufficient — prefer `service_healthy` for databases and
other services that need initialization time after the container starts.
