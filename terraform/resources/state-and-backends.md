# Terraform State & Backends

## What Is State?

Terraform state (`terraform.tfstate`) maps your configuration to real-world resources. It is the source of truth Terraform uses to determine what to create, update, or destroy.

## Local State (Default)

State is stored in `terraform.tfstate` in the working directory.

- Simple for individual use or experimentation.
- **Not safe for teams** — no locking, easy to lose or corrupt.
- Never commit to version control if it contains sensitive values.

## Remote Backends

### S3 + DynamoDB (AWS)

```hcl
terraform {
  backend "s3" {
    bucket         = "my-tf-state-bucket"
    key            = "env/prod/terraform.tfstate"
    region         = "us-east-1"
    dynamodb_table = "terraform-state-locks"
    encrypt        = true
  }
}
```

Create the DynamoDB table for locking:

```bash
aws dynamodb create-table \
  --table-name terraform-state-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST
```

### GCS (Google Cloud)

```hcl
terraform {
  backend "gcs" {
    bucket = "my-tf-state"
    prefix = "env/prod"
  }
}
```

### HCP Terraform / Terraform Cloud

```hcl
terraform {
  cloud {
    organization = "my-org"
    workspaces { name = "prod" }
  }
}
```

HCP Terraform provides built-in state locking, versioning, and audit logs.

## State Locking

State locking prevents concurrent operations from corrupting state.

- **S3 backend:** Uses DynamoDB for locking.
- **GCS backend:** Uses GCS object locking.
- **HCP Terraform:** Built-in.
- **Local backend:** Advisory locking only (`.terraform.tfstate.lock.info`).

If a lock is stuck (e.g., from a crashed apply):

```bash
# List current lock info
terraform force-unlock <LOCK_ID>
```

> Use `force-unlock` only when you are certain no other operation is running.

## Sensitive Values in State

State may contain secrets (passwords, private keys). Protect it:

- Enable server-side encryption on S3 buckets (`encrypt = true` in backend config).
- Restrict IAM/GCS bucket access to CI roles and operators only.
- Use `sensitive = true` on outputs to prevent CLI display.
- Consider [Vault](https://developer.hashicorp.com/vault/docs) for secret injection rather than storing secrets in Terraform variables.

## State Migration

```bash
# Move to a new backend — Terraform prompts to copy state
terraform init -migrate-state

# Reconfigure without migrating
terraform init -reconfigure
```

## Advanced State Operations

For advanced topics — partial state refresh, state surgery, cross-workspace data sources, and Terraform Cloud API-driven workflows — see:

- [Terraform State documentation](https://developer.hashicorp.com/terraform/language/state)
- [Backend configuration reference](https://developer.hashicorp.com/terraform/language/settings/backends/configuration)
- [Gruntwork guides](https://gruntwork.io/guides/)
