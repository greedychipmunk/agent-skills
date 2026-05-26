# kubectl — Install and Setup

## Install by Platform

### Linux (curl binary)

```bash
# Download latest stable release
curl -LO "https://dl.k8s.io/release/$(curl -sL https://dl.k8s.io/release/stable.txt)/bin/linux/amd64/kubectl"
chmod +x kubectl
sudo mv kubectl /usr/local/bin/kubectl
kubectl version --client
```

### macOS (Homebrew)

```bash
brew install kubectl
kubectl version --client
```

### Debian/Ubuntu (apt)

```bash
sudo apt-get update && sudo apt-get install -y apt-transport-https ca-certificates curl
curl -fsSL https://pkgs.k8s.io/core:/stable:/v1.31/deb/Release.key | sudo gpg --dearmor -o /etc/apt/keyrings/kubernetes-apt-keyring.gpg
echo 'deb [signed-by=/etc/apt/keyrings/kubernetes-apt-keyring.gpg] https://pkgs.k8s.io/core:/stable:/v1.31/deb/ /' | sudo tee /etc/apt/sources.list.d/kubernetes.list
sudo apt-get update && sudo apt-get install -y kubectl
```

### RHEL/Fedora (yum/dnf)

```bash
cat <<EOF | sudo tee /etc/yum.repos.d/kubernetes.repo
[kubernetes]
name=Kubernetes
baseurl=https://pkgs.k8s.io/core:/stable:/v1.31/rpm/
enabled=1
gpgcheck=1
gpgkey=https://pkgs.k8s.io/core:/stable:/v1.31/rpm/repodata/repomd.xml.key
EOF
sudo dnf install -y kubectl
```

### asdf plugin

```bash
asdf plugin add kubectl https://github.com/asdf-community/asdf-kubectl.git
asdf install kubectl latest
asdf global kubectl latest
```

## Verify Installation

```bash
kubectl version --client
kubectl version  # also shows server version if connected
```

## kubeconfig File

The default kubeconfig is located at `~/.kube/config`. It stores clusters, users, and contexts.

```bash
# View merged config
kubectl config view

# View raw config
kubectl config view --raw

# View only active context config
kubectl config view --minify
```

## KUBECONFIG Environment Variable

Override or merge multiple kubeconfig files:

```bash
# Single file
export KUBECONFIG=/path/to/my-cluster.yaml

# Merge multiple files (colon-separated on Linux/macOS)
export KUBECONFIG=~/.kube/config:/path/to/other-cluster.yaml

# Verify merged result
kubectl config view --merge --flatten
```

## Context Management

```bash
# List all contexts
kubectl config get-contexts

# Show current context
kubectl config current-context

# Switch context
kubectl config use-context my-context

# Set default namespace for a context
kubectl config set-context --current --namespace=my-namespace

# Rename a context
kubectl config rename-context old-name new-name

# Delete a context
kubectl config delete-context old-context
```

## Namespace Flag

Always specify namespace to avoid ambiguity:

```bash
kubectl get pods -n kube-system
kubectl get pods --namespace=production
kubectl get pods -A  # all namespaces
```

## Shell Completion

```bash
# bash
echo 'source <(kubectl completion bash)' >> ~/.bashrc

# zsh
echo 'source <(kubectl completion zsh)' >> ~/.zshrc

# fish
kubectl completion fish | source
```

## Useful Aliases

```bash
alias k='kubectl'
alias kgp='kubectl get pods'
alias kgs='kubectl get svc'
alias kgd='kubectl get deployments'
complete -F __start_kubectl k  # enable completion for alias
```
