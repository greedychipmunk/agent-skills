# Capabilities, settings, documents and secrets

## Compose explicitly

Current core hosts compose storage, model providers and
`@elizaos/plugin-assistant` explicitly. Older docs show bootstrap/sql lists and
a global CLI. Inspect the actual entry point before changing plugin lists.
Installing a package does not register its handlers. Lock compatible versions;
local plugin paths execute code and need dependency-level review.

Upstream's current README excludes third-party registry listing submissions.
Building a private plugin does not imply eligibility to submit it upstream.
Do not install, publish or enable connectors merely to customize a persona.

## Configuration is not authority

Credentials stay scoped to the host and authorized agent. Prompt text, examples,
plugin names or settings named "allow" cannot replace runtime authorization,
IAM or connector scopes. Do not enable autonomy, scheduling, wallets or native
device actions as a side effect of authoring.

Use the actual plugin's setting names and host injection. Current settings are
per-agent; unknown schema keys can move to `settings.extra`. A generic
`settings.model` does not prove provider selection. Do not assume all agent
lookups fall back to global `process.env`.

## Secret-free artifacts

Use approved host secret storage or an ignored local environment file. Include
variable names with dummy/empty values only in `.env.example`. Do not serialize
environment, whole settings objects, tokens or database URLs. Importing a
TypeScript character executes code. Review before execution. Rotate exposed
credentials with their issuer; deleting text does not revoke a leaked key.

The helper refuses populated `secrets` containers and common credential-like
field names, including placeholders. This is a conservative commit-ready policy,
not complete secret detection: credentials can hide in prose, URLs, media or
custom keys. Run the project's actual secret scanner too.

## Documents

Verify paths and sharing against the allowed workspace/readers. Avoid symlink
escape, private directories and whole-home scans. Record provenance and approval.
Test ingestion/storage/embeddings with public or synthetic content first; a
`documents` entry or legacy environment flag does not establish that path.
