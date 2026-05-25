# Agent Skills

A curated collection of specialized skills for AI coding agents. Each skill packages expert knowledge, production-ready scripts, document templates, and reference guides into a self-contained module that any compatible agent can load on demand.

## What's Inside

| Skill | Description | Category |
|-------|-------------|----------|
| [AngularJS Unit Testing](./angularjs-unit-test) | Jasmine and Jest testing for AngularJS controllers, services, filters, and directives | Testing |
| [MedusaJS Developer](./medusajs-developer) | Medusa v2 modules, API routes, data models, workflows, and plugin development | E-commerce |
| [Next.js Developer](./nextjs-developer) | App Router, Server Components, data fetching, routing, caching, and performance optimization | Web Framework |
| [Roblox Game Developer](./roblox-game-developer) | Luau scripting, game mechanics, UI/UX design, and monetization strategies | Game Development |
| [Supabase Developer](./supabase-developer) | PostgreSQL, authentication, Row Level Security, Storage, Edge Functions, and Realtime | Backend / BaaS |

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

## Using with Letta Code

This repository integrates with [Letta Code](https://letta.com) via the [letta-code-action](https://github.com/letta-ai/letta-code-action) GitHub Action. The agent can be triggered in three ways:

| Trigger | How |
|---------|-----|
| **Mention** | Include `@letta-code` in a comment, issue body, or PR body |
| **Label** | Add the `letta-code` label to an issue or PR |
| **Assignee** | Assign an issue to the `letta-code` user |

Only repository collaborators with write access can activate the agent.

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
