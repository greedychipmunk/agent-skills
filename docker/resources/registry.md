# Docker Registry Operations Reference

## Authentication

```bash
docker login                              # Docker Hub
docker login myregistry.example.com       # Private registry
docker logout
docker logout myregistry.example.com
```

---

## Image Naming

```text
[registry/][namespace/]repository[:tag][@digest]

nginx                                    # Docker Hub official, latest
nginx:1.25-alpine                        # Pinned tag
myuser/myapp:v1.2.3                      # Docker Hub personal namespace
ghcr.io/myorg/myapp:sha-abc123           # GitHub Container Registry
myregistry.example.com:5000/api:prod     # Private registry with port
myimage@sha256:abc123def456              # Pinned by digest (immutable)
```

---

## Push / Pull

```bash
docker tag myapp:latest myuser/myapp:v1.2.3
docker push myuser/myapp:v1.2.3
docker push myuser/myapp:latest

docker pull myuser/myapp:v1.2.3
docker pull myuser/myapp@sha256:abc123   # By digest (immutable)
```

---

## Common Registry Providers

### Docker Hub

```bash
docker tag myapp myuser/myapp:latest
docker push myuser/myapp:latest
# Auth: username/password or access token (hub.docker.com → Settings → Security)
```

### GitHub Container Registry (GHCR)

```bash
docker login ghcr.io -u USERNAME --password-stdin <<< "$GITHUB_TOKEN"
docker tag myapp ghcr.io/myorg/myapp:latest
docker push ghcr.io/myorg/myapp:latest
# Token needs packages:write scope
```

### AWS ECR

```bash
aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  123456789012.dkr.ecr.us-east-1.amazonaws.com

aws ecr create-repository --repository-name myapp --region us-east-1  # One-time
docker tag myapp 123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp:latest
docker push 123456789012.dkr.ecr.us-east-1.amazonaws.com/myapp:latest
```

### Google Artifact Registry (GAR)

```bash
gcloud auth configure-docker us-central1-docker.pkg.dev
docker tag myapp us-central1-docker.pkg.dev/myproject/myrepo/myapp:latest
docker push us-central1-docker.pkg.dev/myproject/myrepo/myapp:latest
```

### Azure Container Registry (ACR)

```bash
az acr login --name myregistry
docker tag myapp myregistry.azurecr.io/myapp:latest
docker push myregistry.azurecr.io/myapp:latest
```

### Self-hosted Registry

```bash
docker run -d --name registry \
  -p 5000:5000 \
  -v registry-data:/var/lib/registry \
  registry:2
# Add to Docker Desktop Engine config: { "insecure-registries": ["localhost:5000"] }
docker tag myapp localhost:5000/myapp:latest
docker push localhost:5000/myapp:latest
```

---

## Multi-Architecture Images

```bash
# Build and push multi-platform
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  --tag myuser/myapp:latest \
  --push \
  .

# Inspect the manifest list
docker manifest inspect myuser/myapp:latest

# Pull specific platform
docker pull --platform linux/arm64 myuser/myapp:latest
```

---

## Search

```bash
docker search nginx --filter stars=100 --filter is-official=true --limit 5
```

---

## Rate Limits (Docker Hub)

- Unauthenticated: 100 pulls / 6 hours
- Free account: 200 pulls / 6 hours
- Pro/Team/Business: unlimited

If you hit rate limits in CI, authenticate with a Docker Hub account, use a registry
mirror, or cache images in ECR/GHCR.
