---
name: terraform
description: Plan, apply, and manage infrastructure with Terraform. Use when tasks mention terraform commands, HCL configuration, provider setup, state management, or workspace operations.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# Terraform

## Intent Router

| Request | Reference | Load When |
| --- | --- | --- |
| Install tool, first-time setup, tfenv | `resources/install-and-setup.md` | User needs to install Terraform or manage versions |
| Provider config, variables, backends | `resources/configuration.md` | User needs provider blocks, variable files, or backend setup |
| CLI commands, workflows | `resources/command-cookbook.md` | User needs init/plan/apply/destroy patterns or state commands |
| State management, remote backends | `resources/state-and-backends.md` | User asks about state files, locking, or remote backends |

## Quick Start

```bash
# 1. Initialize working directory (downloads providers)
terraform init

# 2. Preview changes (always run before apply)
terraform plan

# 3. Apply changes (requires confirmation)
terraform apply

# 4. Destroy infrastructure (DANGEROUS — requires confirmation)
terraform destroy
```

## Core Command Tracks

- **Initialize:** `terraform init` — downloads providers, sets up backend
- **Validate & format:** `terraform validate`, `terraform fmt -recursive`
- **Preview:** `terraform plan [-out=tfplan]` — no changes made
- **Apply:** `terraform apply [tfplan]` — creates/updates resources
- **Inspect state:** `terraform state list`, `terraform state show <resource>`
- **Workspaces:** `terraform workspace list`, `terraform workspace select <name>`

## Safety Guardrails

- Always run `terraform plan` before `terraform apply` — review the diff carefully.
- `terraform destroy` is **irreversible** — confirm resource list before proceeding.
- Never commit `terraform.tfstate` or `.tfvars` files containing secrets to version control.
- Use `-target` sparingly; it can leave state inconsistent.
- Enable state locking on remote backends to prevent concurrent modifications.

```bash
# Inspect managed resources in state before making changes
terraform state list
terraform state show aws_instance.web
```

## Workflow

1. Write or edit `.tf` configuration files.
2. Run `terraform fmt` to normalize formatting.
3. Run `terraform validate` to catch syntax errors.
4. Run `terraform plan` and review the proposed changes.
5. Run `terraform apply` only after reviewing the plan.
6. Commit updated `terraform.lock.hcl` but never `terraform.tfstate`.

## Related Skills

- **pulumi** — IaC using general-purpose languages (TypeScript, Python, Go, C#)
- **ansible** — configuration management and agentless automation

## References

- `resources/install-and-setup.md`
- `resources/configuration.md`
- `resources/command-cookbook.md`
- `resources/state-and-backends.md`
- Official docs: <https://developer.hashicorp.com/terraform/docs>
- Provider registry: <https://registry.terraform.io>
- Best practices: <https://www.terraform-best-practices.com>
- Tutorials: <https://developer.hashicorp.com/terraform/tutorials>
