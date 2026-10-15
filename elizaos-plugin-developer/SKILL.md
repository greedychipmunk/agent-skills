---
name: elizaos-plugin-developer
description: Develops, debugs, migrates, tests, and packages elizaOS TypeScript plugins, actions, providers, evaluators, and services. Use when extending @elizaos/core, integrating external capabilities, fixing plugin lifecycle or registration, or reconciling legacy plugin docs with current source contracts.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# elizaOS Plugin Developer

Build against the target project's actual `@elizaos/core` contract, not a blend of public examples and develop. Keep character/personality authoring outside this skill except where plugin registration and settings require it.

## 1. Establish the version boundary

1. Read project instructions, owning README, package manifest, lockfile, existing plugins, and tests. Record resolved core version and host (embedded runtime, agent host, or app).
2. Inspect installed exported declarations without importing/executing the package. Prefer the lockfile and declarations over a dependency range. If absent, read matching release/tag source through HTTP/GitHub APIs.
3. For develop work, resolve `gh api repos/elizaOS/eliza/commits/develop --jq .sha`; pin subsequent reads. Do not clone the huge monorepo just to inspect types.
4. Read [version and source authority](references/versions-and-sources.md). Treat the snapshot as a baseline, not today's npm dist-tags. Never silently upgrade a 1.x project to 2.x interfaces.
5. Verify the installed CLI version/help/source before recommending scaffold commands. Request approval before installation, migrations, paid calls, or credentialed execution. Do not execute upstream code just to research its API.

If the target is unknown, ask whether this is an existing project/version or new develop-based work. Continue with a labeled design, not unqualified drop-in code.

## 2. Select the smallest extension

| Need | Component | Read next |
| --- | --- | --- |
| Perform an operation/external mutation | Action | [Component contracts](references/component-contracts.md) |
| Supply read-only prompt context | Provider | [Component contracts](references/component-contracts.md) |
| Maintain a client/connection/background resource | Service | [Component contracts](references/component-contracts.md) |
| Extract structured post-turn information | Evaluator | [Evaluator migration](references/evaluators.md) |
| Handle credentials, permissions, confirmations, receipts | Cross-cutting policy | [Settings and safety](references/settings-and-safety.md) |
| Verify, integrate, package, distribute | Delivery | [Testing and distribution](references/testing-and-distribution.md) |

Use one plugin for one coherent concern. Reuse an existing service instead of parallel connection management. Register component arrays on the exported Plugin object and service classes rather than instances. Check the host's loader/export conventions.

## 3. Implement verified contracts

- Import public types from `@elizaos/core`; avoid private deep imports and copied substitute interfaces.
- Use precise action descriptions and supported parameter schemas. Read structured inputs from `options?.parameters`; narrow domain values and handle parameter errors.
- Return an ActionResult on every current handler path. Separate admitted requests, previews, and verified committed effects.
- Keep providers read-only and authorized; propagate cancellation. Never mutate external systems during context composition.
- Make service start/stop and plugin init/dispose ownership explicit. Clear timers, close clients, and handle absent services.
- Recheck evaluators before implementing: legacy validate/handler examples do not match the pinned develop pipeline.
- Inspect the loader before promising dependency order, priority behavior, hot reload, or init-error recovery. Types alone do not establish execution order.
- Inspect host APIs before exposing HTTP/UI surfaces: pinned current Plugin has no routes property despite public examples.

Use the source-derived minimal example in the component reference as a starting shape, not a complete scaffold. Do not add build tooling, dependencies, or UI until needed.

## 4. Verify changed behavior

Read the testing reference before selecting commands. Run the owning project's typecheck/build/relevant existing tests when authorized. Add focused tests only for changed behavior, not implementation duplication.

Check admission rejection, missing config/service, structured inputs, provider cancellation, service cleanup, evaluator processing, and external failures as applicable. Verify actual effect boundaries before claiming end-to-end success. Do not present mocks, typechecks, or source review as live runtime proof.

Debug loading in order: dependency/version → package exports/built entry → manifest → host registration → service readiness → per-agent settings → authorization/context selection → execution errors. Never print whole config/settings to diagnose credentials.

## 5. Package and report

Read distribution policy before publishing or proposing upstream contributions. Keep external package publication separate from official registry inclusion: upstream currently rejects third-party listings/submission tooling. Do not create upstream issues or PRs as a side effect of plugin development.

Return target core/host/CLI versions and source revision; changed components/files; required setting names (not values); exact checks/outcomes; untested live boundaries; compatibility caveats; and remaining decisions. Publish only when requested, without implicit credential changes.
