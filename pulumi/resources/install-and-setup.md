# Pulumi Install & Setup

## Prerequisites

- macOS, Linux, or Windows
- Language runtime for your chosen language (Node.js, Python, Go, .NET, JDK)
- Cloud provider credentials (e.g., AWS, Azure, GCP)

## Install Pulumi CLI

### macOS (Homebrew)

```bash
brew install pulumi/tap/pulumi
pulumi version
```

### Linux (curl installer)

```bash
curl -fsSL https://get.pulumi.com | sh
# Add to PATH if prompted:
export PATH="$HOME/.pulumi/bin:$PATH"
```

### Windows (winget)

```powershell
winget install pulumi
```

### Windows (Chocolatey)

```powershell
choco install pulumi
```

## Backend Login

Pulumi stores state in a backend. Choose one:

### Pulumi Cloud (default — recommended for teams)

```bash
pulumi login
# Opens browser for authentication
# State is stored at app.pulumi.com with encryption and history
```

### Self-Managed (S3, Azure Blob, GCS)

```bash
# S3
pulumi login s3://my-pulumi-state-bucket

# Azure Blob Storage
pulumi login azblob://my-state-container

# GCS
pulumi login gs://my-state-bucket

# Local filesystem (single-user only)
pulumi login --local
```

## Language Runtime Prerequisites

| Language | Install |
| --- | --- |
| TypeScript/JS | `brew install node` or <https://nodejs.org> |
| Python | `brew install python` or <https://python.org> |
| Go | `brew install go` or <https://go.dev> |
| C# / .NET | <https://dotnet.microsoft.com/download> |
| Java | `brew install openjdk` or <https://adoptium.net> |

## Post-Install Verification

```bash
pulumi version
# Expected: v3.x.x

# Verify login
pulumi whoami

# Create a minimal test project
mkdir /tmp/pulumi-test && cd /tmp/pulumi-test
pulumi new yaml --name test --stack dev --yes
pulumi preview
```

## Shell Completion

```bash
# bash
pulumi gen-completion bash >> ~/.bashrc && source ~/.bashrc

# zsh
pulumi gen-completion zsh >> ~/.zshrc && source ~/.zshrc
```
