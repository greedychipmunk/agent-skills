# Docker Security Reference

## Docker Scout — CVE Scanning

Docker Scout analyzes image layers, generates an SBOM, and matches components against
vulnerability databases.

```bash
# Quick overview — summary + base image recommendations
docker scout quickview myimage:latest
docker scout quickview registry/repo:tag        # Remote image

# Full CVE list
docker scout cves myimage:latest
docker scout cves --only-fixed myimage:latest   # Only CVEs with available fixes
docker scout cves --exit-code myimage:latest    # Exit 1 if vulnerabilities found (CI)
docker scout cves --severity critical,high myimage
docker scout cves --format sarif > results.sarif

# Base image recommendations
docker scout recommendations myimage:latest

# Compare two images
docker scout compare myimage:v1 --to myimage:v2

# Policy evaluation
docker scout policy myimage:latest
```

**Recommended workflow:**

1. `docker scout cves --only-fixed myimage` — fix what can be fixed
2. `docker scout recommendations myimage` — update base image if old
3. For unfixable CVEs, use VEX attestations to document risk acceptance

---

## SBOM Generation

```bash
docker sbom myimage:latest                   # Prints to stdout
docker sbom myimage:latest --format spdx
docker sbom myimage:latest --format cyclonedx-json > sbom.json

docker scout sbom myimage:latest
docker scout attestation list myimage:latest
```

---

## Content Trust (Image Signing)

```bash
export DOCKER_CONTENT_TRUST=1                # Enable for all operations in session
DOCKER_CONTENT_TRUST=1 docker pull myimage   # Or per-command

docker trust sign myregistry/myimage:v1.0
docker trust inspect --pretty myregistry/myimage:latest
```

---

## Container Security Hardening

### Run as non-root

```dockerfile
# Alpine
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Debian/Ubuntu
RUN groupadd -r appgroup && useradd -r -g appgroup appuser
USER appuser
```

```bash
docker run --user 1000:1000 myimage
```

### Drop Linux capabilities

```bash
docker run --cap-drop ALL --cap-add NET_BIND_SERVICE myimage
```

In Compose:

```yaml
services:
  api:
    cap_drop:
      - ALL
    cap_add:
      - NET_BIND_SERVICE
```

Common caps most apps don't need: `CHOWN`, `SETUID`, `SETGID`, `SYS_ADMIN`.

### Read-only filesystem

```bash
docker run --read-only --tmpfs /tmp --tmpfs /var/run myimage
```

```yaml
services:
  api:
    read_only: true
    tmpfs:
      - /tmp
```

### No new privileges

```bash
docker run --security-opt no-new-privileges myimage
```

---

## Secrets Management

### Docker Secrets (Swarm)

```bash
echo "mysecretpassword" | docker secret create db_password -
docker secret create ssl_cert ./ssl/cert.pem
docker secret ls
```

Mounted at `/run/secrets/<name>` inside the container.

### File-based secrets (standalone Compose)

```yaml
services:
  api:
    secrets:
      - db_password
    environment:
      DB_PASSWORD_FILE: /run/secrets/db_password

secrets:
  db_password:
    file: ./secrets/db_password.txt
```

Read in app:

```python
with open(os.environ['DB_PASSWORD_FILE']) as f:
    password = f.read().strip()
```

### Docker Pass (local keychain)

```bash
docker pass set my-token "supersecret"
docker pass get my-token
docker pass ls
docker pass rm my-token
```

---

## Image Security Best Practices

1. **Pin base image versions**: `node:22.11-alpine3.20` not `node:latest`
2. **Minimize attack surface**: Use `alpine`, `distroless`, or `scratch`
3. **Update regularly**: Rebuild to pick up base image patches
4. **Scan in CI**: `docker scout cves --exit-code` in your pipeline
5. **Multi-stage builds**: Compiler tools don't end up in the runtime image
6. **No secrets in layers**: Never `RUN echo "password" > /etc/secret`
7. **Use `--mount=type=secret`** for build-time secrets instead of ARG
8. **.dockerignore**: Exclude `.env`, `.git`, `*.key`, `*.pem` from build context

### Check image history for secrets

```bash
docker history myimage --no-trunc | grep -i password
docker history myimage --no-trunc | grep -i key
```
