# Model routing change plan

Planning artifact only. Do not load this Markdown as elizaOS configuration.
Keep credential values, private prompts, account IDs and sensitive endpoints out.

## Target and authorization

- Project/host and resolved core/provider versions:
- Evidence paths or pinned source revision:
- Requested change and acceptance criteria:
- Authorized installs/restarts/downloads/live calls (state each separately):
- Sensitive-data policy and allowed inference regions/destinations:

## Capability matrix

| Required slot/capability | Registered provider ID | Concrete model | Setting names | Allowed fallback destinations | Verification |
| --- | --- | --- | --- | --- | --- |
| Text needed by this host | | | | | |
| Embeddings, if used | | | | | |
| Other explicitly needed capability | | | | | |

Remove unused rows. Distinguish planned values from observed registrations.
Record selection restrictions and unsupported capabilities, not guessed defaults.

## Limits and evidence

- Synthetic, non-sensitive verification input:
- Maximum requests, retries, elapsed time and output tokens:
- Total cost ceiling and actual enforcement/stop mechanism:
- Who enforces endpoint, region and fallback restrictions:
- Registration evidence versus actual successful serving provider/model:
- Failed or partially billed attempts included in evidence:
- Embedding model/vector-space compatibility and reindex requirement:
- Separate approval needed before sending sensitive data or widening routing:

## Rollback

- Previous non-secret configuration and dependency lockfile revision:
- Host-specific apply/restart procedure and allowed downtime:
- Vector-store backup/restore/cutover plan if embeddings change:
- Conditions for stopping rather than retrying:
- Remaining unverified capabilities, costs or host controls:
