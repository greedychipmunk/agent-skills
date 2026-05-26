# Pulumi Stacks & Config

## Stack Concept

A **stack** represents a distinct deployment of a Pulumi program (e.g., `dev`, `staging`, `prod`). Each stack has:

- Its own configuration values
- Its own state (resources it manages)
- Its own outputs

## Stack Operations

```bash
# List stacks in current project
pulumi stack ls

# Create a new stack
pulumi stack init prod

# Select a stack
pulumi stack select dev

# Show current stack details
pulumi stack

# Show stack outputs
pulumi stack output
pulumi stack output bucketName         # single output
pulumi stack output --json             # all outputs as JSON

# Delete a stack (must be empty — all resources destroyed)
pulumi stack rm staging
```

## Configuration

```bash
# Set a config value (stored in Pulumi.<stack>.yaml)
pulumi config set aws:region us-east-1
pulumi config set environment prod

# Get a config value
pulumi config get aws:region

# List all config for current stack
pulumi config

# Remove a config value
pulumi config rm environment
```

## Secrets

```bash
# Set a secret (encrypted in state and config file)
pulumi config set --secret dbPassword "s3cr3t!"

# Retrieve secret value (decrypted)
pulumi config get dbPassword
```

Secrets are encrypted using the stack's secret provider (Pulumi Cloud by default; can use AWS KMS, Azure Key Vault, GCP KMS, or a passphrase).

### Using Secrets in Code

```typescript
const config = new pulumi.Config();
const dbPassword = config.requireSecret("dbPassword");  // Output<string>, never logged
```

### Custom Secret Provider

```bash
# Use AWS KMS for secret encryption
pulumi stack init prod --secrets-provider="awskms://alias/my-key"

# Use a passphrase (self-managed backends)
PULUMI_CONFIG_PASSPHRASE=my-passphrase pulumi up
```

## Stack References (Cross-Stack)

Share outputs between stacks:

```typescript
// In consumer stack
const infraStack = new pulumi.StackReference("org/infra/prod");
const vpcId = infraStack.getOutput("vpcId");
```

## Stack Tags

```bash
pulumi stack tag set team platform
pulumi stack tag ls
```

For advanced topics — import/export state, stack migration, self-managed backends — see <https://www.pulumi.com/docs/concepts/stack/>.
