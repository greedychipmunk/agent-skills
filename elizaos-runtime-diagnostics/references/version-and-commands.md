# Version and command provenance

Baseline: GitHub API `GET /repos/elizaOS/eliza/commits/develop` returned
`eb9a6f7d3ccc46d3ff9d173383cff900004738c9`, committed 2026-10-15T04:17:38Z.
Root version: 2.0.4; agent package: 2.0.3-beta.7. These are not a claim about the
operator's deployment or future develop heads. All commands below were checked
against source; none was executed against upstream during skill preparation.

## Source hierarchy

Prefer the installed revision's owning README, package scripts, types and route
implementations over unversioned tutorials. The current monorepo separates core,
agent host, app/UI, optional Cloud services, and first-party plugins.

- [Root README](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/README.md)
- [Root package scripts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/package.json)
- [Agent README](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/agent/README.md)
- [Agent scripts](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/agent/package.json)

Official [overview](https://docs.elizaos.ai/) and
[start reference](https://docs.elizaos.ai/cli-reference/start) were reviewed. They
still show the legacy CLI-project workflow (`elizaos create`, `elizaos start`),
`localhost:3000/health`, environment listing/reset, and broad process kills.
The page does not identify its release. Do not treat these as current 2.x source
instructions, invent CLI flags, copy destructive suggestions, or assume port 3000.

## Repository commands, not passive checks

Root pins Node 24.15.0 and Bun 1.4.2. Do not substitute the diagnostic helper's
Python runtime for these upstream requirements. Installation has consequential
postinstall provisioning/build/patch hooks; do not install dependencies just to
inspect a failure.

| Command | Source meaning and boundary |
| --- | --- |
| `bun run start` | Standalone API-only agent; starts code, no UI |
| `bun run dev` | App plus API development host |
| `bun run dev:local` | Runtime chooser, local agent/own provider keys; `--cloud-target=offline`, no mandatory Cloud sign-in |
| `bun run --cwd packages/agent typecheck` | Package-scoped static check, prepared dependencies required |
| `bun run --cwd packages/agent test -- test/agent-lifecycle-stop-start.test.ts` | Exact-file runtime test, not a promise of offline execution |

Local mode does not guarantee zero network/cost: configured direct providers,
asset downloads and connectors may still use networks. Cloud can be used by a
local runtime for selected model capabilities; Cloud hosting is a separate axis.

The [agent batch runner](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/agent/scripts/run-vitest-batches.ts)
uses the [shared parser](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/scripts/lib/vitest-batches.ts).
Positional selectors must be exact eligible files, relative to the package (or
absolute paths inside it). Supported reporting includes `--reporter=junit` plus
`--outputFile.junit=<path>`; arbitrary Vitest flags are rejected. Read selected
tests before execution: real HTTP/process/storage/provider effects are possible.
Root `test` invokes e2e; agent `test`, `test:e2e`, and `test:integration` share a
suite, not separate safety classifications. Live coding benchmarks explicitly
require real credentials and can execute WRITE/SHELL actions; exclude them from
routine diagnostics. Test isolation is not a cost/authorization boundary.
