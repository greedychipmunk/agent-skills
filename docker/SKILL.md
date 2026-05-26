---
name: docker
description: Build, run, debug, and manage Docker containers, images, compose files, networking, volumes, registries, Buildx/Bake, Scout/SBOM, Swarm, and Docker AI tooling. Use when the user mentions docker, containers, containerizing, Dockerfile, compose, image registry, volumes, or any docker subcommand.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# Docker

Use this skill to keep Docker work deterministic, safe, and fast across Linux, macOS,
and Windows Docker Desktop hosts.

## Quick Start

1. Run `scripts/probe-docker.ps1` (Windows) or `docker info` / `docker version` (Linux/macOS) first for environment truth.
2. Choose the smallest workflow that solves the request:
   - Core container/build/compose workflow in this file covers ~80% of tasks.
   - Load a reference file only when you need depth on a specific domain.
   - Reuse `assets/templates/` starter packs before writing boilerplate from scratch.
3. Default to read-only diagnostics before proposing mutating commands.
4. Confirm before destructive commands (`rm`, `prune`, `down -v`, `sandbox reset`, builder/cache deletion).
5. Prefer installed CLI behavior when docs and runtime diverge; note the caveat with concrete versions.

## Intent Router (Progressive Disclosure)

Load only the reference file needed for the active request.

- `resources/install-and-setup.md` — Installing Docker Desktop (macOS/Windows) or Docker Engine (Linux), and post-install configuration.
- `resources/core.md` — Windows Desktop-first diagnostics, context management, Desktop status.
- `resources/containers.md` — `run/exec/logs/inspect/debug/stats` and crash triage.
- `resources/images.md` — Dockerfile authoring, multi-stage patterns, Buildx/Bake.
- `resources/compose.md` — Compose authoring and service orchestration.
- `resources/networking.md` — bridge/overlay/macvlan, DNS, port publishing.
- `resources/volumes.md` — named volumes, bind mounts, backup/restore patterns.
- `resources/registry.md` — login/tag/push/pull and registry hygiene.
- `resources/swarm.md` — swarm init, services, stacks, safe operations.
- `resources/troubleshooting.md` — systematic debugging and error classification.
- `resources/security.md` — Scout, SBOM, DHI, pass secrets, supply chain checks.
- `resources/ai-and-agents.md` — Docker AI, agent/cagent, MCP toolkit, model runner, sandbox.
- `resources/cloud-and-remote.md` — Offload, Build Cloud, remote builders and contexts.

## Quick Command Reference

These cover ~80% of daily Docker use. Use them directly without loading a reference file.

```bash
# Container lifecycle
docker run -d --name myapp -p 8080:80 nginx          # Run detached with port mapping
docker run -it --rm ubuntu bash                       # Interactive, auto-remove on exit
docker ps                                             # List running containers
docker ps -a                                          # All containers (incl. stopped)
docker stop myapp && docker rm myapp                  # Stop and remove
docker logs myapp -f                                  # Follow logs
docker logs myapp --tail=100                          # Last 100 lines
docker exec -it myapp bash                            # Shell into running container
docker inspect myapp                                  # Full metadata (JSON)
docker stats                                          # Live resource usage

# Images
docker build -t myapp:latest .                        # Build from Dockerfile in cwd
docker pull nginx:alpine                              # Pull image
docker images                                         # List local images
docker rmi myapp:latest                               # Remove image
docker tag myapp:latest myregistry/myapp:v1.2         # Tag for push

# Compose (v2 — no hyphen)
docker compose config                                 # Validate and view merged config
docker compose up -d                                  # Start all services detached
docker compose down                                   # Stop and remove containers+networks
docker compose logs -f api                            # Follow logs for one service
docker compose exec api sh                            # Shell into service container
docker compose ps                                     # Service status
docker compose build --no-cache                       # Rebuild all images

# Buildx / multi-platform
docker buildx ls
docker buildx build --platform linux/amd64,linux/arm64 -t myorg/myapp:v1 --push .

# System
docker system df                                      # Disk usage breakdown
docker system prune                                   # Remove unused objects (see safety)
```

## Safety Matrix

| Command or Pattern | Required Guardrail |
| --- | --- |
| `docker system prune` / `prune -a` | Run `docker system df` first; summarize what will be removed, then confirm. |
| `docker volume rm` | Warn that volume data is permanently deleted and require explicit confirmation. |
| `docker network rm` | Check for attached containers first and list impacted services before remove. |
| `docker rm -f` | Confirm exact container names; avoid bulk force-remove without listing targets. |
| `docker rmi -f` | Check container/image dependents first and confirm impact. |
| `docker swarm leave --force` | Explain manager impact and require explicit confirmation. |
| `docker compose down -v` | Call out database/state loss risk and require explicit confirmation. |
| `docker sandbox reset` | Treat as destructive reset; require explicit confirmation. |
| `docker push` to registry | Confirm the full destination tag before pushing. |
| `--privileged` flag | Explain what it grants and why it's risky before using. |

## Writing Dockerfiles

When asked to write a Dockerfile, always apply these best practices by default:

- **Layer order** — put things that change least at the top (base image, system deps), most at the bottom (app code). Maximizes cache reuse.
- **Multi-stage builds** — compile/install in a build stage; copy only artifacts to a minimal runtime image.
- **Non-root user** — create and switch to a non-root user before CMD.
- **Minimal base image** — prefer `alpine`, `distroless`, or `slim`. Use full images only when system packages are needed.
- **Combine RUN commands** — chain related commands with `&&`; clean up package caches in the same layer.
- **Always create `.dockerignore`** alongside Dockerfile.

For complete Dockerfile templates (Node.js, Python, Go) and `.dockerignore` patterns, see `resources/images.md`.

## Docker Compose Authoring

Key patterns for compose files:

- Use `condition: service_healthy` on `depends_on` when the dependency has a healthcheck.
- Always define named volumes rather than bare bind mounts for data you care about.
- Scope services to internal-only networks when they don't need external access.
- Use `restart: unless-stopped` for production; omit for dev tooling containers.
- Set an explicit `name:` at the top to avoid directory-name collisions.

For complete compose file templates with health checks, see `resources/compose.md`.

## Diagnostic Workflow

When a container is crashing or misbehaving:

```bash
docker ps -a                              # Find container and exit code
docker logs <name> --tail=100             # Last 100 lines (stderr included with 2>&1)
docker inspect <name>                     # Full JSON — check State, Config, Mounts
docker stats --no-stream                  # Snapshot of memory/CPU (check for OOM)
docker exec -it <name> sh                 # Shell in (if still running)
docker debug <name>                       # Debug sidecar, works on stopped containers
docker compose ps && docker compose logs --tail=50   # Compose: all services at once
```

Exit codes: `0` = clean exit, `1` = app error, `137` = OOM killed, `139` = segfault, `143` = SIGTERM, `125/126/127` = Docker/exec errors.

## Core Workflow (Windows Desktop)

1. **Establish baseline** — Run `scripts/probe-docker.ps1 -Json` for structured diagnostics (CLI version, context, plugin availability, daemon reachability).
2. **Diagnose before changing state** — Run `scripts/doctor-docker.ps1` for actionable checks. Use `-Quick` for fast triage; `-IncludeScout` / `-IncludeOffload` only when in scope.
3. **Execute scoped operations** — container lifecycle, build pipeline, compose orchestration, context/Desktop checks.
4. **Report findings by root cause** — sandbox/host permission boundary, daemon/service state, config mismatch.

## Resource Index

- `scripts/probe-docker.ps1` — `probe-docker.ps1 [-Json] [-IncludeExperimental]` — read-only host/runtime probe.
- `scripts/doctor-docker.ps1` — `doctor-docker.ps1 [-Quick] [-IncludeOffload] [-IncludeScout]` — diagnostics and recommendations.
- `assets/templates/` — reusable starter packs for minimal service, compose stack, and multi-arch Buildx.
- `resources/*.md` — deep domain coverage (see Intent Router above).
