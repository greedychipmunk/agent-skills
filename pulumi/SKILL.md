---
name: pulumi
description: Manage cloud infrastructure with Pulumi using general-purpose programming languages. Use when tasks mention pulumi commands, Pulumi stacks, infrastructure as code in TypeScript/Python/Go/C#, or deploying with pulumi up.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# Pulumi

## Intent Router

| Request | Reference | Load When |
| --- | --- | --- |
| Install tool, first-time setup, backend login | `resources/install-and-setup.md` | User needs to install Pulumi or configure backend |
| Language choice, project layout, resource patterns | `resources/language-and-project.md` | User asks about supported languages or project structure |
| Stacks, config, secrets | `resources/stacks-and-config.md` | User needs stack management, config values, or secrets |
| CLI commands, workflows | `resources/command-cookbook.md` | User needs preview/up/destroy patterns or command reference |

## Quick Start

```bash
# 1. Create a new project (prompts for language, cloud, stack)
pulumi new aws-typescript

# 2. Preview changes (no modifications made)
pulumi preview

# 3. Deploy changes
pulumi up

# 4. Destroy infrastructure (DANGEROUS — requires confirmation)
pulumi destroy
```

## Language Selection

Pulumi supports multiple languages — choose based on your team's familiarity:

| Language | Template prefix | Runtime needed |
| --- | --- | --- |
| TypeScript | `aws-typescript` | Node.js |
| Python | `aws-python` | Python 3.8+ |
| Go | `aws-go` | Go 1.21+ |
| C# | `aws-csharp` | .NET 6+ |
| Java | `aws-java` | JDK 11+ |
| YAML | `aws-yaml` | None |

## Core Command Tracks

- **New project:** `pulumi new <template>` — scaffold project with language/cloud
- **Preview:** `pulumi preview` — show planned changes, no deployment
- **Deploy:** `pulumi up` — create or update resources
- **Destroy:** `pulumi destroy` — remove all stack resources
- **Refresh:** `pulumi refresh` — sync state with actual cloud resources
- **Stack ops:** `pulumi stack ls`, `pulumi stack select`, `pulumi stack output`

## Stack Concept

A **stack** is a deployment target (e.g., `dev`, `staging`, `prod`). Each stack has its own config and state:

```bash
pulumi stack init prod
pulumi stack select dev
pulumi config set aws:region us-west-2
pulumi up
```

## Safety Guardrails

- Always run `pulumi preview` before `pulumi up` — review resource diffs carefully.
- `pulumi destroy` is **irreversible** — confirm the stack resource list before proceeding.
- Use `pulumi config set --secret` for sensitive values (passwords, API keys).
- Never commit Pulumi state files or unencrypted secret values.
- Use stack policies (CrossGuard) to enforce organizational guardrails.

## Workflow

1. Select or create a stack: `pulumi stack select dev`
2. Set required config: `pulumi config set aws:region us-east-1`
3. Write or update program code.
4. Run `pulumi preview` and review the diff.
5. Run `pulumi up` to deploy.
6. Check outputs: `pulumi stack output`

## Related Skills

- **terraform** — HCL-based IaC; Pulumi can import from Terraform state
- **ansible** — configuration management for post-provision setup

## References

- `resources/install-and-setup.md`
- `resources/language-and-project.md`
- `resources/stacks-and-config.md`
- `resources/command-cookbook.md`
- Official docs: <https://www.pulumi.com/docs/>
- API / provider registry: <https://www.pulumi.com/registry/>
- Tutorials: <https://www.pulumi.com/learn/>
- Community: <https://www.pulumi.com/blog/>
