# Project discovery and instruction derivation

## Collect evidence without execution

Start with git status and the target directory, not the host filesystem. Respect
ancestor instructions, then read root AGENTS.md and applicable nested files.
Exclude .git internals, dependency/vendor trees, builds, caches, .env files,
credential stores, private keys and customer datasets from content inspection.
Do not follow symlinks outside the project. File names and manifests are often
enough to identify tools; do not ingest sensitive values to learn variable names.

Read in this order:
1. Existing instructions, README/contributing/security docs and architecture docs.
2. Manifests and lockfiles; runtime version files; workspace/package definitions.
3. CI, task scripts, formatter/linter/type/test/scanner configuration.
4. Representative entry point, domain module, data boundary, and existing tests.
5. Release/deployment configuration for understanding, not execution.

For each discovered command, record its source path, argv, cwd, prerequisites,
side effects and trust status. Follow script definitions: a manifest command can
hide deployment, deletion, network access or lifecycle hooks. Do not execute
unfamiliar scripts merely because their names sound like tests.

## Derive missing AGENTS.md

Use assets/AGENTS.template.md as an outline, not boilerplate to copy unfilled.
Prefer short instructions grounded in evidence:

| Instruction | Evidence to inspect |
| --- | --- |
| What the project does | README plus representative domain code |
| Module boundaries | Entrypoints, imports, workspace manifests and tests |
| Install/tool versions | Lockfiles, version files and existing CI |
| Run/build/test commands | Actual manifest targets and scripts, including cwd |
| Style/error handling | Tool configs plus multiple representative modules |
| Test conventions | Test discovery config and actual test cases |
| Sensitive boundaries | Auth/data/network code and security docs |
| Safe autonomous scope | User authorization, project instructions, host limits |

Example evidence-backed entry:
`npm run test:unit -- --run` (repo root; package.json:scripts.test:unit,
vitest.config.ts; observed, not run yet). Use this only when those files and
script semantics really exist. A command that ran successfully can be labelled
verified with its outcome; do not infer a test count or gate coverage.

If a doc disagrees with the source, preserve it and describe the contradiction.
Ask the smallest question needed to resolve it. If no root AGENTS.md exists but
packages have nested instructions, create a root overview that points to them;
do not lift one package's rules into every other package. Do not relax higher-
priority or existing security restrictions in generated instructions.

## Project branching

**Existing working project:** use current setup and gates. Extend missing
security/quality capabilities. Keep existing CI required checks active.

**Legacy failing project:** record reproducible baseline failures separately
from onboarding regressions. Prioritize a small verified slice. Do not turn red
checks green with ignores, empty tests or bulk formatting. A factory can be
configured but blocked; baseline failure is not a pass.

**Empty project:** confirm product outcome, language/toolchain and delivery
target only when not specified. Build one function/endpoint/UI flow and real
positive and negative tests. Record those as approved design decisions, not
facts inferred from nonexistent code. Generate package-native configuration and
lockfiles before connecting gates. No Kubernetes, orchestration service,
queue/database or deployment credentials unless the product actually needs it.

**Monorepo:** enumerate deployables and commands per cwd; each package's nearest
instructions still govern. Add commands for each required package to gate lists.
One passing package cannot stand in for others. Use native CI matrix/sharding if
already present; keep complete coverage and a required aggregate status.

## Adoption decisions

Default to existing project choices. Ask only when missing decisions block safe
execution: intended stack for an empty project, owner/private reporting channel,
permission for dependency/tool installs, or a contradictory instruction. Record
unknown host controls as pending; discovering a factory need is not permission
to edit account settings, start cloud services or provision credentials.
