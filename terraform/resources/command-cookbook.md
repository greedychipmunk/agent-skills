# Terraform Command Cookbook

## Initialization

```bash
# Initialize working directory (safe to re-run)
terraform init

# Upgrade providers to latest allowed versions
terraform init -upgrade

# Reconfigure backend without interactive prompts
terraform init -reconfigure -backend-config="bucket=new-bucket"
```

## Validation & Formatting

```bash
# Check syntax and internal consistency
terraform validate

# Format all .tf files in place
terraform fmt -recursive

# Check formatting without changing files (CI-safe)
terraform fmt -check -recursive
```

## Planning

```bash
# Preview changes (no modifications made)
terraform plan

# Save plan to file for deterministic apply
terraform plan -out=tfplan

# Target a specific resource
terraform plan -target=aws_instance.web

# Plan for destroy
terraform plan -destroy
```

## Applying

```bash
# Apply with interactive confirmation
terraform apply

# Apply saved plan (no confirmation prompt)
terraform apply tfplan

# Apply without prompt (CI/CD — use with care)
terraform apply -auto-approve

# Refresh state only (no changes)
terraform apply -refresh-only
```

## Destroying

> **DANGER:** `terraform destroy` removes all managed resources. Always run `terraform plan -destroy` first.

```bash
# Preview what will be destroyed
terraform plan -destroy

# Destroy with confirmation prompt
terraform destroy

# Destroy a specific resource only
terraform destroy -target=aws_instance.web
```

## State Commands

```bash
# List all resources in state
terraform state list

# Show details for a resource
terraform state show aws_s3_bucket.data

# Move resource in state (rename without recreating)
terraform state mv aws_instance.old aws_instance.new

# Remove resource from state (does NOT destroy the real resource)
terraform state rm aws_instance.web

# Pull current remote state to stdout
terraform state pull

# Push local state to remote (use with caution)
terraform state push terraform.tfstate
```

## Import

```bash
# Import existing infrastructure into state
terraform import aws_instance.web i-0123456789abcdef

# Import with variables
terraform import -var="environment=prod" aws_s3_bucket.data my-bucket-name
```

## Workspaces

```bash
# List workspaces
terraform workspace list

# Create and switch to a new workspace
terraform workspace new staging

# Select an existing workspace
terraform workspace select prod

# Show current workspace
terraform workspace show

# Delete a workspace (must be empty)
terraform workspace delete staging
```

## Output & Graph

```bash
# Show all outputs
terraform output

# Show a specific output value
terraform output instance_id

# Export outputs as JSON
terraform output -json

# Generate dependency graph (requires graphviz)
terraform graph | dot -Tsvg > graph.svg
```

## Provider Lock File

```bash
# Regenerate .terraform.lock.hcl for all platforms
terraform providers lock \
  -platform=linux_amd64 \
  -platform=darwin_arm64 \
  -platform=windows_amd64
```

## Best Practices

- Commit `.terraform.lock.hcl` to version control.
- Never commit `terraform.tfstate` or `*.tfvars` with secrets.
- Use `terraform plan -out=tfplan` in CI; apply the saved plan in a separate step.
- Use `-target` only as a last resort for emergency fixes.

For advanced workflows (policy as code, drift detection, module publishing), see <https://developer.hashicorp.com/terraform/docs>.
