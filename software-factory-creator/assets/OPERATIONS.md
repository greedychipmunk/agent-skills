# Factory operations

## Entry points

- Read AGENTS.md and .factory/policy.md for project commands and boundaries.
- Validate structure without executing project code:
  `python3 .factory/check.py`
- Run reviewed project gates: `python3 .factory/check.py --run`.
- In a reviewed, disposable, secret-free environment, install locked tools and
  run gates: `python3 .factory/check.py --run --setup`.
- Stdout is a JSON summary; stderr carries tool output. Exit 0 means configured
  (without --run) or all executed commands exited 0 (with --run). Exit 1 is a
  failed/unavailable/timed-out/background command; 2 is blocked configuration;
  130 is SIGINT cancellation, 143 is SIGTERM cancellation. CI remains unverified
  in these local summaries (unavailable with its reason for ci.provider=none).

The runner is not a sandbox. It inherits the process environment and executes
project code. Do not put secrets in argv or the environment. Install/setup can
run third-party lifecycle hooks. Review all command definitions and dependency
sources first. Commands are argv arrays (no shell strings or shell wrappers).
POSIX process groups enforce timeouts and clean up surviving background members;
an otherwise successful command leaving background work fails. Detached child
sessions and abrupt SIGKILL still need external sandbox/resource cleanup. Use
Linux/macOS and Python >=3.10.

## Delivery loop

1. Copy .factory/tasks/TEMPLATE.md to a task-specific Markdown file. Identify
   acceptance tests, scope, risk, approvals, budgets and instruction sources.
2. Establish baseline checks in an isolated worktree. Record existing failures.
3. Implement one small change and regression tests; check the task's affected
   behavior, boundaries and failure cases, not just happy paths.
4. Run the full factory entry point. Review the diff independently, including
   security changes, scanner suppressions, fixtures and generated files.
5. Record command results, observed test counts and CI run/commit identity.
   Handoff for approved publication/merge; never merge solely because CI is green.
6. For an approved release, use existing release tooling; record artifact
   identity, smoke check, monitoring and a tested rollback or roll-forward plan.
   This factory creates no automatic deployment or release credentials.

## Adaptation and existing-project adoption

Use the existing package manager, lockfiles, runtimes, CI, formatter, linter,
test runner and security scanners. Keep old checks, even if adding this entry
point. Monorepos can register multiple commands with package-specific cwd;
every affected deployable needs coverage. Do not double-run unrelated CI jobs.

Replace config.example placeholders before scaffolding. Write the observed
native versions in config.runtimes, use frozen/locked installs, pin added tools,
and provision those exact runtimes in CI. Version metadata is descriptive; the
runner does not install or enforce it. Use noninteractive non-watch commands,
check-only formatting, real tests and failing scanner thresholds. Never use
echo/true or a test runner's "pass with no tests" option as a gate.

Only typecheck/build/dependencies/sast can use a reviewed waiver, with reason,
approved_by and future expires date. Use applicability waivers for no-dependency
or non-build projects, not temporary scanner outages. Waivers are reported,
expire closed and do not imply a passing check. The runner validates their
shape/date, not the approver's identity; independent protected review does that.

For ci.provider=existing, update the referenced native CI file to invoke the
same entry point. For github, adapt the skeleton with pinned runtime/tool setup
and verify a real run. For none, record why and report CI unavailable, not ready.
Require the actual emitted CI status name in host rules (inspect a real run).
Existing documents preserved by scaffolding still need manual semantic merging.

## Maintenance

Keep commands and AGENTS.md aligned with source/config changes. Review pinned
tool/action updates via the same gates. Recheck waiver expiry, scanner coverage,
secret handling and required review settings. For security regressions, add a
test or rule where possible and update the private response record. Store only
sanitized evidence in version control; never retain raw scanner secret values.
