# Terraform Install & Setup

## Prerequisites

- macOS, Linux, or Windows
- 64-bit OS (arm64 or amd64)
- Network access to download providers during `terraform init`

## Install by Platform

### macOS (Homebrew)

```bash
brew tap hashicorp/tap
brew install hashicorp/tap/terraform

# Verify
terraform version
```

### Linux (apt — Ubuntu/Debian)

```bash
wget -O- https://apt.releases.hashicorp.com/gpg | sudo gpg --dearmor -o /usr/share/keyrings/hashicorp-archive-keyring.gpg
echo "deb [signed-by=/usr/share/keyrings/hashicorp-archive-keyring.gpg] https://apt.releases.hashicorp.com $(lsb_release -cs) main" | sudo tee /etc/apt/sources.list.d/hashicorp.list
sudo apt update && sudo apt install terraform
```

### Linux (manual binary)

```bash
# Check https://releases.hashicorp.com/terraform/ for the latest version
TERRAFORM_VERSION=1.8.5
curl -Lo terraform.zip "https://releases.hashicorp.com/terraform/${TERRAFORM_VERSION}/terraform_${TERRAFORM_VERSION}_linux_amd64.zip"
unzip terraform.zip
sudo mv terraform /usr/local/bin/
```

### Windows

```powershell
# Chocolatey
choco install terraform

# Winget
winget install Hashicorp.Terraform
```

## Version Management (tfenv)

Manage multiple Terraform versions with [tfenv](https://github.com/tfutils/tfenv):

```bash
# Install tfenv (macOS/Linux)
git clone https://github.com/tfutils/tfenv.git ~/.tfenv
export PATH="$HOME/.tfenv/bin:$PATH"

# Install a specific version
tfenv install 1.8.5
tfenv use 1.8.5

# Pin version per project
echo "1.8.5" > .terraform-version
```

## Post-Install Verification

```bash
terraform version
# Expected: Terraform v1.x.x

# Initialize a test directory
mkdir /tmp/tf-test && cd /tmp/tf-test
cat > main.tf <<'EOF'
terraform {
  required_version = ">= 1.0"
}
output "hello" { value = "ok" }
EOF
terraform init && terraform apply -auto-approve
```

## Shell Completion

```bash
# bash
terraform -install-autocomplete
source ~/.bashrc

# zsh — add to ~/.zshrc
autoload -U +X bashcompinit && bashcompinit
complete -o nospace -C $(which terraform) terraform
```
