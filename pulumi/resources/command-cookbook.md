# Pulumi Command Cookbook

## Project Creation

```bash
# New project (interactive)
pulumi new

# New project from template
pulumi new aws-typescript
pulumi new azure-python
pulumi new gcp-go
pulumi new kubernetes-yaml

# List available templates
pulumi new --list-templates
```

## Previewing Changes

```bash
# Preview current stack changes
pulumi preview

# Preview with diff output
pulumi preview --diff

# Preview targeting specific resources
pulumi preview --target "urn:pulumi:dev::my-proj::aws:s3/bucketV2:BucketV2::my-bucket"

# Preview with config override
pulumi preview -c aws:region=eu-west-1
```

## Deploying

```bash
# Deploy with confirmation prompt
pulumi up

# Deploy without confirmation (CI/CD)
pulumi up --yes

# Deploy with diff shown
pulumi up --diff

# Target specific resources
pulumi up --target "urn:..."

# Skip resource planning check (refresh + up)
pulumi up --refresh
```

## Destroying

> **DANGER:** `pulumi destroy` removes all stack resources. Always run `pulumi preview` first or review `pulumi stack` resource list.

```bash
# Preview what will be destroyed
pulumi preview --diff   # or pulumi destroy --dry-run (Pulumi 3.x)

# Destroy with confirmation
pulumi destroy

# Destroy without prompt (CI/CD)
pulumi destroy --yes

# Destroy specific resources
pulumi destroy --target "urn:..."
```

## Refreshing State

```bash
# Sync state with actual cloud resources (detect drift)
pulumi refresh

# Refresh without prompt
pulumi refresh --yes
```

## Importing Existing Resources

```bash
# Import a resource into Pulumi state
pulumi import aws:s3/bucketV2:BucketV2 my-bucket my-existing-bucket-name

# Generate code for imported resource
pulumi import --generate-code aws:ec2/instance:Instance web i-0123456789abcdef
```

## Converting from Terraform / CloudFormation

```bash
# Convert Terraform project to Pulumi
pulumi convert --from terraform --language typescript

# Convert CloudFormation template
pulumi convert --from cloudformation --language python --out ./pulumi-project template.yaml
```

## Stack & Output Commands

```bash
pulumi stack ls
pulumi stack select dev
pulumi stack output
pulumi stack output -json
pulumi stack rm staging         # removes stack (must be empty)
pulumi stack export             # export state as JSON
pulumi stack import < state.json
```

## Policy (CrossGuard)

```bash
# Run policy checks against a stack
pulumi policy run my-org/my-policy-pack dev

# List policy packs
pulumi policy ls
```

## Logs

```bash
# View resource logs (AWS CloudWatch, etc.)
pulumi logs --follow

# Filter by resource
pulumi logs --resource "my-function"
```

## Best Practices

- Run `pulumi preview` before every `pulumi up`.
- Use `--yes` only in CI/CD pipelines with proper guardrails.
- Store secrets with `pulumi config set --secret`, never as plain config.
- Use stack references instead of hardcoded values across stacks.
- Tag stacks with team/environment metadata for discoverability.

For advanced Pulumi usage (Automation API, dynamic providers, MLIR, providers SDK), see <https://www.pulumi.com/docs/>.
