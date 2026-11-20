# Agent Skills

A curated collection of specialized skills for AI coding agents. Each skill packages expert knowledge, production-ready scripts, document templates, and reference guides into a self-contained module that any compatible agent can load on demand.

## What's Inside

| Skill | Description | Category |
|-------|-------------|----------|
| [Agent Development](./agent-development) | Design and build AI agents with persistent memory, tool use, and multi-turn conversation | AI Agents |
| [AngularJS Unit Testing](./angularjs-unit-test) | Jasmine and Jest testing for AngularJS controllers, services, filters, and directives | Testing |
| [Ansible](./ansible) | Automate configuration management and application deployment with Ansible | DevOps |
| [Argo CD](./argocd) | Deploy Kubernetes apps declaratively with Argo CD applications and projects | DevOps |
| [Astryx](./astryx) | Generate Astryx design system components, themes, and layouts for React 19 applications | Design System |
| [Blog Manager](./blog-manager) | Autonomous blog manager that proposes topics, drafts articles, and skips topics for Leaflet.pub | AI Agents |
| [Datadog](./datadog) | Query Datadog observability data — logs, metrics, monitors, dashboards, APM, and incidents | Observability |
| [Docker](./docker) | Build, run, debug, and manage Docker containers, compose files, networking, and registries | DevOps |
| [elizaOS Character Builder](./elizaos-character-builder) | Author version-correct agent personas, character JSON, conversation examples, and safe capability configuration | AI Agents |
| [elizaOS Knowledge Workflows](./elizaos-knowledge-workflows) | Operate approved document ingestion, authorized retrieval, source provenance, embedding migrations, and RAG evaluations | AI Agents |
| [elizaOS Model Configurator](./elizaos-model-configurator) | Configure model providers, capability routing, embedding compatibility, and privacy- and cost-bounded verification | AI Agents |
| [elizaOS Plugin Developer](./elizaos-plugin-developer) | Build, migrate, test, and package version-compatible elizaOS actions, providers, evaluators, and services | AI Agents |
| [elizaOS Runtime Diagnostics](./elizaos-runtime-diagnostics) | Safely investigate startup, plugin, database, service, and model readiness failures with offline configuration-presence checks | AI Agents |
| [GitHub](./github) | GitHub operations via `gh` CLI — issues, PRs, CI runs, code review, and API queries | Developer Tools |
| [GitHub CI](./github-ci) | Write and maintain GitHub Actions CI workflows, triggers, runners, and caching | CI/CD |
| [Herdr Plugin Builder](./herdr-plugin-builder) | Build, validate, and publish Herdr plugins — manifests, actions, event hooks, panes, and link handlers for the Herdr terminal multiplexer | Developer Tools |
| [Helm](./helm) | Package and deploy Kubernetes applications with Helm charts and releases | DevOps |
| [kubectl](./kubectl) | Manage Kubernetes resources, contexts, and workloads with kubectl | DevOps |
| [MCP Builder](./mcp-builder) | Create MCP (Model Context Protocol) servers for LLM tool integration | AI Agents |
| [MediaCMS Admin Portal](./mediacms/admin-portal) | Extend the fork's Jazzmin admin portal — dashboard sections, sidebar, health checks, and Flatly/Darkly theme polish | Developer Tools |
| [MediaCMS Auth & Identity](./mediacms/auth-identity) | Configure django-allauth login options, OAuth/social apps, SAML, and secret-field handling | Developer Tools |
| [MediaCMS Dev API](./mediacms/dev-api) | Smoke-test the MediaCMS REST API against a running dev instance — uploads, auth, and endpoint checks | Testing |
| [MediaCMS Dev Manage](./mediacms/dev-manage) | Run manage.py tasks in the web container — Django shell, fake media, DB export, translations | Developer Tools |
| [MediaCMS Dev Stack](./mediacms/dev-stack) | Run and rebuild the Docker Compose dev stack — ports 80/8088, frontend rebuilds, and service restarts | DevOps |
| [MediaCMS Fork Docs & Release](./mediacms/fork-docs-release) | Maintain fork documentation, mike channels, what's-new notes, and GHCR beta/stable releases | CI/CD |
| [MediaCMS i18n & Translations](./mediacms/i18n) | Add frontend and admin translations with RTL checks — translateString, gettext, and process_translations | Developer Tools |
| [MediaCMS Issue Triage](./mediacms/issue-triage) | Triage GitHub issues against the current branch and draft minimal-impact fix plans | Developer Tools |
| [MediaCMS Maintainer](./mediacms/maintainer) | Fork maintainer rules — branch targets, upstream PRs, authorship, labels, and AI disclosure | Developer Tools |
| [MediaCMS Media Pipeline](./mediacms/media-pipeline) | Debug encoding, HLS, media integrity, storage paths, and nginx media auth | Developer Tools |
| [MediaCMS Merge Hygiene](./mediacms/merge-hygiene) | Merge branches into mediacms-next safely — conflict handling and local_settings protection | Developer Tools |
| [MediaCMS Plan History](./mediacms/plan-history) | Archive Cursor plans into .agent/plan-history with INDEX.md and manifest.json | Developer Tools |
| [MediaCMS RBAC & Permissions](./mediacms/rbac-permissions) | Align roles and permissions across docs, Django backend, and React frontend | Developer Tools |
| [MediaCMS Test & CI](./mediacms/test-ci) | Run pytest/Jest with TESTING=True and fix CI, pre-commit, lint, and coverage failures | Testing |
| [MedusaJS Developer](./medusajs-developer) | Medusa v2 modules, API routes, data models, workflows, and plugin development | E-commerce |
| [Mermaid](./mermaid) | Generate and validate Mermaid.js diagrams — flowcharts, sequence, Gantt, ER, and all other diagram types | Diagrams |
| [Next.js Developer](./nextjs-developer) | App Router, Server Components, data fetching, routing, caching, and performance optimization | Web Framework |
| [Pulumi](./pulumi) | Manage cloud infrastructure with Pulumi using general-purpose programming languages | IaC |
| [Roblox Game Developer](./roblox-game-developer) | Luau scripting, game mechanics, UI/UX design, and monetization strategies | Game Development |
| [Sentry](./sentry) | Inspect Sentry issues and events, summarize production errors, and pull health data | Observability |
| [Software Factory Creator](./software-factory-creator) | Bootstrap a minimum viable software factory with project instructions, security and quality gates, CI, and bounded autonomy | Developer Tools |
| [Standard Site](./standard-site) | Convert data into Standard.site AT Protocol lexicon records and validate them against official schemas | Publishing |
| [Supabase Developer](./supabase-developer) | PostgreSQL, authentication, Row Level Security, Storage, Edge Functions, and Realtime | Backend / BaaS |
| [Terraform](./terraform) | Plan, apply, and manage infrastructure with Terraform and HCL configuration | IaC |

## Vendored skills

The 14 `MediaCMS …` skills above live under [`mediacms/`](./mediacms) and
were created by **Josh Preston (@mrjoshuap)** for his MediaCMS fork. They are
vendored from [mrjoshuap-hq/mediacms](https://github.com/mrjoshuap-hq/mediacms)
(branch `mediacms-next`, commit `a8c0ce1`) under **AGPL-3.0**. Each skill
carries a scope note naming its target repository, and cross-references use
skill names so they resolve when installed from this catalog — see
[`mediacms/ATTRIBUTION.md`](./mediacms/ATTRIBUTION.md) for details.

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
