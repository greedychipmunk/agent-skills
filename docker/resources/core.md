# Core Docker Workflows (Windows Desktop First)

Use this reference for day-to-day runtime, build, compose, context, and Desktop troubleshooting.

## Deep Reference Map

Use these files for detailed domain guidance:

- `references/containers.md`
- `references/images.md`
- `references/compose.md`
- `references/networking.md`
- `references/volumes.md`
- `references/registry.md`
- `references/swarm.md`
- `references/troubleshooting.md`

## Baseline Probe Sequence

Run these first and keep outputs in notes:

```powershell
docker --version
docker version
docker context ls
docker compose version
docker buildx version
docker info
```

If `docker info` fails but `docker --version` works, treat it as daemon reachability or permission boundary, not a missing CLI.

## Container Lifecycle

```powershell
docker pull <image>
docker run --name <name> -d -p <host>:<container> <image>
docker ps -a
docker logs <name>
docker exec -it <name> sh
docker stop <name>
docker rm <name>
```

Use `docker inspect <name>` for low-level details and mounted config.

## Image Build (BuildKit + Buildx)

```powershell
docker build -t <repo>:<tag> .
docker buildx ls
docker buildx build --platform linux/amd64,linux/arm64 -t <repo>:<tag> --push .
```

Prefer explicit tags and platforms for reproducibility.

## Compose Workflow

```powershell
docker compose config
docker compose up -d
docker compose ps
docker compose logs -f <service>
docker compose down
```

Use `docker compose down -v` only with explicit confirmation (data loss risk).

## Contexts and Endpoints

```powershell
docker context show
docker context ls
docker context inspect <context>
docker context use <context>
```

For Windows Docker Desktop, `desktop-linux` is commonly active for Linux containers.

## Docker Desktop Checks

```powershell
docker desktop status
docker desktop logs
docker desktop restart
```

When status checks fail with access denied or host-log write errors, distinguish permission boundaries from daemon crashes.

## Common Windows Failure Patterns

- `open //./pipe/dockerDesktopLinuxEngine: Access is denied`
  - Usually a permission boundary (sandbox scope or host ACL), not command syntax.
- `Could not retrieve status. Is Docker Desktop running?`
  - Desktop process/engine state issue.
- `permission denied while trying to connect to the docker API`
  - Daemon socket access issue; verify context and user rights.

## Useful Environment Variables

- `DOCKER_HOST`
- `DOCKER_CONTEXT`
- `DOCKER_CONFIG`
- `DOCKER_BUILDKIT`
- `COMPOSE_PROJECT_NAME`
- `COMPOSE_FILE`
- `COMPOSE_PROFILES`

Prefer command flags for one-off overrides; use env vars for session-level behavior.

## Source Links

- <https://docs.docker.com/manuals/>
- <https://docs.docker.com/reference/cli/docker/>
- <https://docs.docker.com/engine/>
- <https://docs.docker.com/compose/>
- <https://docs.docker.com/build/>
- <https://docs.docker.com/desktop/>
