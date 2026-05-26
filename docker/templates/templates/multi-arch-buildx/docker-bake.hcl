group "default" {
  targets = ["app"]
}

target "app" {
  context    = "."
  dockerfile = "Dockerfile"
  tags       = ["your-registry/your-app:latest"]
  platforms  = ["linux/amd64", "linux/arm64"]
  pull       = true
  push       = true
}
