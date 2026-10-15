# Verification contract and CI adaptation

## Gate semantics

Reuse existing tools before adding any. Every registered command must be
reviewed, finite, noninteractive and return nonzero for failure. Configure
check-only formatting, no-watch tests and deterministic builds. Require tests
actually discovered/run; inspect output and add a native wrapper if the runner
permits zero-test success. Do not introduce broad coverage requirements without
a baseline; verify changed behavior and relevant failure/security cases.

| Gate | What to verify |
| --- | --- |
| format | Formatting/style drift fails, not silently rewrites the workspace |
| lint | Actual source/tests/configs are covered; existing exclusions are reviewed |
| typecheck | Native type/compiler checks where applicable |
| test | Real unit/contract tests, failure paths and meaningful test count |
| build | Existing artifact/package build, not a deployment command |
| secrets | Pinned established scanner; worktree/untracked scope plus history/PR range |
| dependencies | Resolved locked dependency audit, including transitive/runtime dependencies |
| sast | Supported-language security rules; review new suppressions and exclusions |

Dependency/SAST findings must follow a recorded threshold and triage rule.
Default to blocking unreviewed high/critical findings and any discovered secret;
add stricter rules at auth/data boundaries. Track lower-severity findings with
an owner and due date. Do not weaken existing thresholds. Scanner failure,
authentication failure, timeout or unavailable database is not a clean scan.
Use synthetic scanner fixtures to verify failure exit behavior and redaction.

Typical native sources: package.json scripts + lockfile; pyproject.toml/tool
config + locked environment; go.mod/go.sum + existing task scripts; Cargo.toml /
Cargo.lock; Gradle/Maven wrapper; solution/project files and tool manifest.
Do not pick a package manager solely by language or install @latest scanners.
If adding a tool, confirm its official install/CLI docs, pin it and review its
download origin and lifecycle behavior. Tool provisioning is part of setup/CI.

## Config contract (schema_version 1)

Unknown fields and duplicate JSON keys are rejected; there is no allow-failure
switch. Obvious no-op executables are rejected, but scripts/interpreters can
still hide no-ops or harmful behavior. Review actual command definitions.

- `project`: actual project name.
- `runtimes`: nonempty map of runtime/tool names to observed pinned versions.
  Metadata only: provision and verify versions separately; the runner does not.
- `commands`: named objects with `argv` (string array), `cwd` (root-relative,
  default `.`), `timeout_seconds` (integer 1..1800), `evidence` (source paths and
  semantics). Shell wrappers and placeholder fields are rejected. Arguments are
  passed literally without shell expansion. Use a reviewed native script if a
  tool needs pipes, wildcard handling or several steps.
- `setup`: list of registered command names; runs only with `--run --setup`.
- `gates`: exactly format/lint/typecheck/test/build/secrets/dependencies/sast.
  Each has a nonempty `commands` list, or an applicability `waiver` only for
  typecheck/build/dependencies/sast. One command may cover multiple gates only
  if its actual behavior covers them. Commands run once in gate order; setup
  first when requested. First failure stops execution; later checks are not run.
- `ci`: `provider` and `path` for github/existing, or provider=none plus `reason`.
  Built-in GitHub path is `.github/workflows/factory.yml`. Existing CI uses its
  own root-relative config path. None prevents a readiness claim.

The runner reports CI as unverified (or unavailable plus reason for none) even
when local commands pass. It never claims to have observed a host CI run.
Timed-out/cancelled groups are killed; background members left by a completed
command are killed and make a successful command fail. Detached processes and
SIGKILL cleanup require the external execution environment, not this helper.

Example applicability waiver, only after explicit owner approval:

```json
{"build": {"waiver": {
  "reason": "Interpreted script-only project has no distributed build artifact",
  "approved_by": "confirmed owner identity or approval record reference",
  "expires": "YYYY-MM-DD"
}}}
```

Replace the date with a real future ISO date and cite real approval. Expires
on or before today's date fails closed. Do not waive required tests, formatting,
lint or secrets. Do not use applicability waivers for broken tools, network
outages or work not yet done. The runner validates shape and expiry, not owner
identity, command adequacy, vulnerability thresholds or test counts. Protected
independent review must enforce these semantics. An agent must not approve its
own waiver, swap in no-ops, alter the runner or narrow scans to pass a task.

## CI and host controls

Use the same entry point locally and in CI. Existing pipelines should call it
without losing current tests, matrices, platform checks or deployment controls.
If CI already runs gates separately, adapt the factory contract to those
equivalent native commands and preserve required aggregate checks. Do not
duplicate jobs, use path filters that skip a required status, or suppress errors
with `continue-on-error`, `|| true` or success on missing tests.

For GitHub, adapt assets/factory.yml:
- Provision pinned project runtimes and tools before invoking the runner. Pin
  added actions to full SHAs verified in their official repositories.
- Use PR/push, contents:read, persist-credentials:false and clean ephemeral hosted
  runners. Full history supports history scanning; configure scanner range
  explicitly, not just fetch depth. Set timeout/concurrency to the project budget.
- No secrets on untrusted PRs, privileged PR triggers, PR-head checkout in
  privileged workflows, production access or release steps. Do not upload raw
  scanner matches or personal data as artifacts. No inline untrusted expressions.
- For trusted private dependencies, design a separate reviewed restricted path;
  public fork code must never gain the corresponding token by convenience.

For other hosts, use native CI syntax with equivalent least privilege,
ephemeral isolation, timeout and review boundaries. For local-only projects,
report CI unavailable and document manual verification; don't claim CI exists.

Confirm owner identities before CODEOWNERS changes. In host rulesets, require
the actual successful emitted verification status and independent approval;
disallow bypass/self-approval. Protect policy, AGENTS.md (including nested),
runner/config, CI, lockfiles and security docs. File presence does not enforce
review. Verify settings through authorized host access or hand off exact manual
instructions and keep status pending. Keep release environment approvals and
credentials separate from PR verification; don't create an automatic deploy.
