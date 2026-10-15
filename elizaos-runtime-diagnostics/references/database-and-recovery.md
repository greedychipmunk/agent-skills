# Database and recovery boundaries

## Identify the effective backend

[Database selection](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/agent/src/runtime/database-selection.ts)
selects PostgreSQL/PGlite through database configuration. Without an explicit
provider, nonempty `POSTGRES_URL`/`DATABASE_URL` select PostgreSQL; otherwise the
fallback is PGlite. Do not print either URL. Presence-only reports cannot tell
whether they are empty or effective.

`ELIZA_DATABASE_PROVIDER=sqlite` is the explicit SQLite opt-in, not a generic
backend selector. Other supplied values are rejected. SQLite plus a configured
PostgreSQL/PGlite provider conflicts. Plugins requiring PostgreSQL storage/schema
are rejected unless explicitly ported to SQLite. Do not switch backends to evade
a plugin failure or assume an existing database is migrated by selecting another.

The [SQL plugin README](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/plugins/plugin-sql/README.md)
requires the vector extension for PostgreSQL, adapter registration before dependent
plugins, and preservation of tenant-scoped authorization. PGlite is embedded WASM;
it is not an external PostgreSQL server. Determine real storage location from
approved host configuration, not guessed legacy `.eliza` paths.

## Understand migration blockers

The [runtime migrator](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/plugins/plugin-sql/src/runtime-migrator/runtime-migrator.ts)
compares schema snapshots/introspection, generates SQL, and records migration
state transactionally. PostgreSQL advisory locking is attempted; lock errors may
warn and continue without a lock. Never promise unconditional race protection.

Destructive diffs are blocked unless exact
`ELIZA_ALLOW_DESTRUCTIVE_MIGRATIONS=true` or code-level `force`/`allowDataLoss`
options authorize them. This describes implementation, **not a repair instruction**.
Do not enable those options, clear journals, skip migrations, hand-edit schema,
or remove storage to get a green boot. An additive migration may also need host
deployment coordination; review its installed source and affected plugin schema.

## Safe repair proposal

1. Record selected backend, failing phase/plugin, migration error and installed
   revision without secrets. Distinguish closed database, connectivity, extension,
   incompatible plugin and destructive-diff findings.
2. Obtain explicit owner approval and downtime window; identify all writers and
   stop only owned instances through the supervisor. Preserve incident evidence.
3. Take a backend-appropriate consistent backup, including necessary state and
   host-owned credential custody. Protect backups as secrets. Do not hot-copy an
   open embedded database or assume a filesystem copy is transactionally valid.
4. Verify restoration in an isolated, nonproduction environment with connectors,
   schedulers, webhooks and live providers disabled by a reviewed host policy.
   Restoring agent state may otherwise repeat effects. Do not fabricate a disable
   flag or assume the backup includes all external stores.
5. Review planned migrations and rollback compatibility before applying them.
   Obtain separate approval for any data-loss authorization. Keep one controlled
   migration owner; do not retry concurrent startups blindly.
6. Verify boot, liveness, selected plugin/service state and intended functionality
   within approved cost/effect limits; preserve the backup and sanitized results.

No universal backup/restore CLI or endpoint was verified. The correct method
depends on backend, host and version. Escalate rather than inventing a command.
Root reset/cleanup scripts exist but are deliberately excluded from this runbook;
do not prescribe them as troubleshooting shortcuts. Migrations and rollbacks can
be irreversible even when the immediate transaction succeeded.
