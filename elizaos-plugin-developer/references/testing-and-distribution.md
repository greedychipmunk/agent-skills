# Testing, packaging, and distribution

## Select existing checks

Read owning README/scripts first. [Core README](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/README.md) documents these commands from an authorized upstream checkout:

```bash
bun run --cwd packages/core build
bun run --cwd packages/core test
bun run --cwd packages/core typecheck
bun run --cwd packages/core lint:check
bun run verify
```

Do not clone/install/build upstream just to research a plugin. For external plugins, run their own verified scripts. Pinned core uses Vitest, not generic bun test; integration checks live in test/, source unit tests were removed, and live-model checks are opt-in.

Inspect the [current assistant README](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/plugins/plugin-assistant/README.md) for a real package, not stale bootstrap counts. [Test convention guard](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/scripts/ensure-plugin-test-conventions.ts) checks reachability through registered Vitest/native lanes; naming a test file does not prove it runs.

## Verify the changed boundary

| Boundary | Evidence |
| --- | --- |
| Package/load | Built entry/declarations/manifest resolve in target consumer |
| Action | Rejected unauthorized/missing config; valid inputs; failures remain failures |
| Provider | Authorized read-only output, propagated cancellation, no credentials |
| Service | Startup/readiness, absent-service path, teardown releases resources |
| Evaluator | Schema/parser agreement, processor effects, replay if enabled |
| Mutation | Approved real operation and authoritative commit proof; no duplicate retry |

Use mocks for isolated checks, not end-to-end proof. Separate static/type checks, mocks, host integration, and live external execution in reports. Obtain approval for paid/live APIs, financial operations, or real mutations. Redact credentials from evidence.

[testing.ts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/testing.ts) defines in-runtime self-tests:

```ts
interface TestCase {
  name: string;
  fn: (runtime: IAgentRuntime) => Promise<void> | void;
}
interface TestSuite { name: string; tests: TestCase[]; }
// Plugin.tests?: TestSuite[]
```

Verify the host harness executes exported suites. A direct handler call proves neither planner selection nor host registration.

## Package without implied registry acceptance

Keep the target build system. Verify ESM exports/built entry/declarations in the artifact, exclude secrets, document configuration names, and select compatible dependencies. Keep core external if required by the selected bundler convention. Do not add tsup/Vite solely because old docs show it.

Public development docs describe independent scoped npm/GitHub Packages publication, not official approval. Publish only when requested to the chosen account/registry. Do not run npm login, change ownership, or create releases as an implicit check.

[Root README](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/README.md) explicitly rejects third-party plugin/registry submissions, listing updates and submission tooling. Do not recommend elizaos publish or registry PRs as the route for new external plugins.

For separately authorized first-party contributions, read [CONTRIBUTING.md](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/CONTRIBUTING.md) and root AGENTS.md. Policy requires approved scope, real behavior evidence and PRs to develop; agents may not draft/create contributor issues even with human approval. Report privately to the human, not via API/CLI/browser-created issues. This policy is distinct from contributing a skill here.

For first-party releases only, [release.yaml](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/.github/workflows/release.yaml) uses explicit dispatch, exact SHA/ref/version/channel, immutable candidates, protected npm publication and full-cohort registry verification before tag/GitHub Release finalization. Do not replace it with tag pushes or copy its machinery into external plugins by default.
