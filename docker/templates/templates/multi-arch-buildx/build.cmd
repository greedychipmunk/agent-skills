# Build and push multi-arch image
# Requires a configured buildx builder and registry auth

docker buildx bake --file docker-bake.hcl
