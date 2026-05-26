# Image Builds, Dockerfiles & Buildx Reference

## Dockerfile Instruction Reference

```dockerfile
FROM image:tag [AS stage]   # Base image; AS names a multi-stage stage
ARG KEY=default             # Build-time variable (not available at runtime)
ENV KEY=value               # Runtime environment variable
WORKDIR /path               # Sets CWD for subsequent instructions (creates if missing)
COPY src dest               # Copy files from build context (preferred over ADD)
ADD src dest                # Like COPY but also extracts archives and fetches URLs
RUN command                 # Execute during build (creates a layer)
EXPOSE 3000                 # Documents which port the app listens on (informational)
VOLUME ["/data"]            # Declares a mount point
USER username               # Switch to user for subsequent instructions
CMD ["executable", "arg"]   # Default command (overridable at runtime)
ENTRYPOINT ["exec", "arg"]  # Fixed command; CMD becomes arguments to it
HEALTHCHECK --interval=30s CMD curl -f http://localhost/health || exit 1
LABEL key=value             # Metadata (image author, version, etc.)
STOPSIGNAL SIGTERM          # Signal sent by `docker stop`
```

### ARG vs ENV

`ARG` is only available during the build. `ENV` persists into the running container.
To pass a build argument as a runtime variable: `ARG NODE_ENV` then `ENV NODE_ENV=$NODE_ENV`.

### CMD vs ENTRYPOINT

```dockerfile
# CMD alone — easily overridden by `docker run IMAGE other-command`
CMD ["node", "server.js"]

# Combined — ENTRYPOINT runs, CMD is default args (replaceable)
ENTRYPOINT ["node"]
CMD ["server.js"]
# docker run myapp           → node server.js
# docker run myapp debug.js  → node debug.js
```

Use the **exec form** (`["cmd", "arg"]`) not shell form (`cmd arg`) for CMD/ENTRYPOINT
so the process gets signals directly (important for graceful shutdown).

---

## Multi-Stage Builds

The goal: use a fat builder image (with compilers, dev deps) and copy only the
compiled output into a lean runtime image.

```dockerfile
# Stage 1: install all deps + build
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci                          # full install including devDependencies
COPY . .
RUN npm run build && npm prune --production

# Stage 2: minimal runtime
FROM node:22-alpine
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
RUN addgroup -S app && adduser -S app -G app
USER app
EXPOSE 3000
CMD ["node", "dist/index.js"]
```

Target a specific stage: `docker build --target builder -t myapp:dev .`

---

## Layer Caching Strategy

Docker caches each layer. A cache miss invalidates all subsequent layers.
Order instructions to maximize hits:

```dockerfile
# Good: deps cached separately from app code
COPY package*.json ./
RUN npm ci
COPY . .             # app code changes often — put it last

# Bad: app code change invalidates npm install too
COPY . .
RUN npm install
```

For Python:

```dockerfile
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
```

For Go:

```dockerfile
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN go build ...
```

---

## BuildKit Cache Mounts (advanced)

Dramatically speeds up repeated builds by persisting package manager caches:

```dockerfile
# syntax=docker/dockerfile:1
FROM python:3.12-slim
RUN --mount=type=cache,target=/root/.cache/pip \
    pip install -r requirements.txt

FROM node:22-alpine
RUN --mount=type=cache,target=/root/.npm \
    npm ci

FROM golang:1.23-alpine
RUN --mount=type=cache,target=/root/go/pkg/mod \
    go build ./...
```

The first line `# syntax=docker/dockerfile:1` enables the Dockerfile frontend with
full BuildKit features. This is needed for `--mount=type=cache`.

### Secret mounts (don't bake secrets into layers)

```dockerfile
# syntax=docker/dockerfile:1
RUN --mount=type=secret,id=npmrc,dst=/root/.npmrc \
    npm ci
```

```bash
docker build --secret id=npmrc,src=.npmrc .
```

---

## docker buildx — Extended Build

`buildx` is the modern builder frontend using BuildKit. Use it for:

- Multi-platform builds (`linux/amd64` + `linux/arm64`)
- Cross-compilation
- Advanced cache export/import
- Bake files

```bash
# Set up a multi-platform builder (one-time setup)
docker buildx create --name multibuilder --driver docker-container --bootstrap
docker buildx use multibuilder

# Multi-platform build and push
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag myregistry/myapp:latest \
  --push \
  .

# Build only (load to local Docker — only works for single platform)
docker buildx build --platform linux/amd64 --load -t myapp:latest .

# Inspect current builder
docker buildx inspect
docker buildx ls

# Export cache to registry for CI reuse
docker buildx build \
  --cache-from type=registry,ref=myregistry/myapp:cache \
  --cache-to   type=registry,ref=myregistry/myapp:cache,mode=max \
  --push -t myregistry/myapp:latest .
```

---

## Bake Files

Bake lets you define complex build matrices in a file (`docker-bake.hcl` or
`docker-bake.json`) and build multiple targets with one command.

```hcl
# docker-bake.hcl
variable "TAG" {
  default = "latest"
}

group "default" {
  targets = ["api", "worker"]
}

target "api" {
  context    = "./services/api"
  dockerfile = "Dockerfile"
  platforms  = ["linux/amd64", "linux/arm64"]
  tags       = ["myregistry/api:${TAG}"]
  cache-from = ["type=registry,ref=myregistry/api:cache"]
  cache-to   = ["type=registry,ref=myregistry/api:cache,mode=max"]
}

target "worker" {
  context    = "./services/worker"
  platforms  = ["linux/amd64", "linux/arm64"]
  tags       = ["myregistry/worker:${TAG}"]
}
```

```bash
docker buildx bake                    # Build default group
docker buildx bake api                # Build specific target
docker buildx bake --push             # Build and push all
TAG=v1.2.3 docker buildx bake --push  # Override variable
```

---

## Image Management

```bash
docker images                         # List images
docker images -a                      # Include intermediate images
docker image ls --filter dangling=true  # Untagged/dangling images
docker image prune                    # Remove dangling images
docker image prune -a                 # Remove ALL unused images (confirm first!)

docker rmi image:tag                  # Remove image
docker rmi -f image:tag               # Force (even if containers reference it)

docker tag source:tag target:tag      # Add/rename a tag
docker history image:tag              # Show layer history and sizes
docker image inspect image:tag        # Full metadata

# Save/load for air-gapped environments
docker save myapp:latest | gzip > myapp.tar.gz
docker load < myapp.tar.gz
```

---

## Base Image Selection Guide

| Runtime | Recommended base | Notes |
| --- | --- | --- |
| Node.js | `node:22-alpine` | ~50MB; use `-slim` (Debian) if alpine causes issues |
| Python | `python:3.12-slim` | Debian slim; alpine can cause issues with C extensions |
| Go | `gcr.io/distroless/static` | Near-zero size for static binaries |
| Java | `eclipse-temurin:21-jre-alpine` | JRE only, not JDK |
| Rust | `debian:bookworm-slim` | Copy compiled binary from `rust:alpine` builder |
| Static web | `nginx:alpine` | Or `caddy:alpine` |
| Shell scripts | `alpine:3` | Minimal, has sh and basic tools |
| Debugging | `ubuntu:24.04` | When you need apt and full tooling |
