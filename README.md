# Agent Skills

A curated collection of specialized skills for AI coding agents. Each skill packages expert knowledge, production-ready scripts, document templates, and reference guides into a self-contained module that any compatible agent can load on demand.

## What's Inside

| Skill | Description | Category |
|-------|-------------|----------|
| [Agent Development](./agent-development) | Design and build AI agents with persistent memory, tool use, and multi-turn conversation | AI Agents |
| [AngularJS Unit Testing](./angularjs-unit-test) | Jasmine and Jest testing for AngularJS controllers, services, filters, and directives | Testing |
| [Ansible](./ansible) | Automate configuration management and application deployment with Ansible | DevOps |
| [Argo CD](./argocd) | Deploy Kubernetes apps declaratively with Argo CD applications and projects | DevOps |
| [Datadog](./datadog) | Query Datadog observability data — logs, metrics, monitors, dashboards, APM, and incidents | Observability |
| [Docker](./docker) | Build, run, debug, and manage Docker containers, compose files, networking, and registries | DevOps |
| [GitHub](./github) | GitHub operations via `gh` CLI — issues, PRs, CI runs, code review, and API queries | Developer Tools |
| [GitHub CI](./github-ci) | Write and maintain GitHub Actions CI workflows, triggers, runners, and caching | CI/CD |
| [Helm](./helm) | Package and deploy Kubernetes applications with Helm charts and releases | DevOps |
| [kubectl](./kubectl) | Manage Kubernetes resources, contexts, and workloads with kubectl | DevOps |
| [MCP Builder](./mcp-builder) | Create MCP (Model Context Protocol) servers for LLM tool integration | AI Agents |
| [MedusaJS Developer](./medusajs-developer) | Medusa v2 modules, API routes, data models, workflows, and plugin development | E-commerce |
| [Next.js Developer](./nextjs-developer) | App Router, Server Components, data fetching, routing, caching, and performance optimization | Web Framework |
| [Pulumi](./pulumi) | Manage cloud infrastructure with Pulumi using general-purpose programming languages | IaC |
| [Roblox Game Developer](./roblox-game-developer) | Luau scripting, game mechanics, UI/UX design, and monetization strategies | Game Development |
| [Sentry](./sentry) | Inspect Sentry issues and events, summarize production errors, and pull health data | Observability |
| [Supabase Developer](./supabase-developer) | PostgreSQL, authentication, Row Level Security, Storage, Edge Functions, and Realtime | Backend / BaaS |
| [Terraform](./terraform) | Plan, apply, and manage infrastructure with Terraform and HCL configuration | IaC |

## Skill Structure

Every skill follows the same convention so agents can discover and load them predictably:

```
<skill-name>/
├── SKILL.md          # Skill definition and instructions
├── scripts/          # Production-ready utility scripts
├── templates/        # Document and code templates
└── resources/        # Reference guides and deep-dive docs
```

- **SKILL.md** — The entry point. Contains the skill name, description, and procedural instructions the agent follows when the skill is activated.
- **scripts/** — Copy-paste-ready code the agent can drop into a project.
- **templates/** — Scaffolding for common project artifacts (design docs, test plans, etc.).
- **resources/** — In-depth reference material the agent can consult when it needs deeper context.

## Adding a New Skill

1. Create a directory at the project root named in kebab-case (e.g. `stripe-developer`)
2. Add a `SKILL.md` with frontmatter containing `name` and `description`
3. Include `scripts/`, `templates/`, and `resources/` directories as needed
4. Open a PR

### SKILL.md Template

```markdown
---
name: your-skill-name
description: One-line description of what this skill provides
---

# Your Skill Name

## Overview
Brief description of the skill and what it covers.

## Core Capabilities
- Capability one
- Capability two

## Scripts
- `scripts/example.ts` — What it does

## Templates
- `templates/example.md` — What it produces

## Resources
- `resources/reference.md` — Deep-dive reference material
```

## License

[MIT](./LICENSE) — Dawson Blackhouse, 2026
