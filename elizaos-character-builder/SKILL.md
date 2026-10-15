---
name: elizaos-character-builder
description: >
  Creates, reviews, and migrates elizaOS character configurations with coherent
  personas, conversation examples, document sources, plugin choices, and safe
  settings. Use when writing character.json or character.ts, customizing an
  elizaOS agent, converting legacy character examples, or diagnosing character
  validation errors. Separates current core Character contracts from host config
  and older 1.x tutorials; includes an offline JSON authoring preflight.
license: MIT
compatibility: Python 3.10+ for optional offline preflight; the target project's elizaOS and TypeScript toolchain for full validation.
metadata:
  author: greedychipmunk
  version: "1.0"
---

# elizaOS Character Builder

Turn a role description or existing character into a small, version-correct
configuration. Personality text does not grant permissions; parsing does not
prove an agent is operational.

## 1. Identify the contract

Read the project's `AGENTS.md`, manifest, lockfile, entry point, and installed
`@elizaos/core` exports/types. Identify the destination: a core `Character`, a
host configuration's narrower `character` subsection, or a published 1.x project
with its own CLI and loader. Read [contracts](references/contracts.md).

The researched source is a **2.x develop snapshot**, not npm's latest release.
Public tutorials still show older APIs. Prefer the target's installed types,
schema and loader. Do not install a global CLI, upgrade packages or rewrite a
loader merely to match this skill. Preserve existing IDs and unrelated work.

## 2. Design the persona

Infer role, audience, voice and boundaries from the request and code. Ask only
about a missing decision that changes implementation. Read
[persona and evaluation](references/persona-and-evaluation.md). Start with the
matching asset: [core character](assets/character.core.json) or
[host subsection](assets/character.host.json).

Use a short bio, useful topics, consistent style and examples for normal help,
uncertainty, out-of-scope requests and actions requiring authorization. Examples
illustrate behavior; they are not training runs or permission grants. Never
invent real qualifications, customer facts, integrations or capabilities.

For current core TypeScript, use `import type { Character } from '@elizaos/core'`
and `satisfies Character` against the installed package. Prefer the canonical
`bio: string[]` and `messageExamples: [{ examples: [...] }]` form. Do not put
`plugins`, `settings` or `documents` into a host character subsection just
because those fields are valid in a core character.

## 3. Wire capabilities separately

Read [capabilities and secrets](references/capabilities.md). Reuse the host's
existing, explicit composition of compatible storage, model and feature plugins.
A package name in JSON does not install a dependency, register a model, ingest
documents or grant connector access. Do not assume bootstrap/sql/model plugins
are always implicit, or a generic `settings.model` selects a provider.

Keep credentials in approved host secret storage. Use names, not live values,
in examples. Review document paths and sharing: current input normalization
treats document strings as **paths**, not biography facts. Do not enable public
connectors, scheduling, wallets, device access or autonomy as a side effect of
persona authoring. Prompt rules are not a runtime authorization mechanism.

## 4. Validate in layers

Run from the installed skill directory, or use an absolute script path:

```bash
python3 scripts/check_character.py --input /path/to/character.json --target core
python3 scripts/check_character.py --input /path/to/host-character-subsection.json --target host
```

The helper reads JSON only, with no project-code imports, network or writes.
It checks a conservative authoring subset and common credential field names.
Exit 0 is **preflight passed**, 1 is authoring issues, 2 is unreadable/invalid
JSON. It is not the elizaOS schema, a secret scanner, plugin resolution or a
runtime test. Advanced content/templates/settings still need the installed
authoritative schema. Review warnings even when exit 0 is returned.

Then run the project's typecheck and exact loader/schema validation. Current
core `validateCharacter(input)` returns `{ success, data?, error? }`, not `.valid`
or `.errors`. `parseCharacter(object)` additionally normalizes; it does not load
a filename. Do not print entire inputs or secret-bearing validation payloads.
Importing arbitrary `character.ts` executes code; review it before execution.

## 5. Verify behavior and hand off

Use an isolated local agent and approved model/backend, with finite call/token
budgets and no real outbound messages or wallet operations. Evaluate actual
replies against the persona scenarios and authorization boundaries. A static
fixture or desired answer is not live evidence. Report unavailable credentials,
models and storage as untested, not passed.

Report target version/commit, character location, identity changes, plugin and
environment **names only**, document sharing decisions, exact checks/outcomes,
live versus static evidence and remaining prerequisites. Do not deploy or
publish unless asked.

## References

- [Contracts and migration](references/contracts.md): read before choosing shapes or migrating.
- [Persona and evaluation](references/persona-and-evaluation.md): read before designing voice and tests.
- [Capabilities and secrets](references/capabilities.md): read before wiring settings/documents/plugins.
- [Pinned sources](references/sources.md): official implementation and documentation differences.
