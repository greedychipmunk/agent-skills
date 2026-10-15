# Verification and rollback

## Static checks first

- Resolve installed core/provider versions without importing project code.
- Inspect only necessary non-secret setting paths and expected names. Presence
  does not establish nonempty/valid credentials or runtime inheritance.
- Confirm required handlers/registration IDs and host capability admission.
- Check tier overrides, endpoint ownership, local artifacts/hardware and each
  allowed fallback destination.
- Run the owning project's existing typecheck/tests when prepared and approved.
  Installation/build scripts can execute hooks, download artifacts or provision
  services; none is a passive diagnostic command.

Examples of source-documented plugin checks, from a prepared upstream root:

```bash
bun run --cwd plugins/plugin-openai build
bun run --cwd plugins/plugin-openai test
```

Use the actual external project's scripts elsewhere. Read the chosen test lane
for network, paid provider and process effects before running it.

## Minimal approved live check

Source-derived TypeScript shape for an **already initialized, authorized**
runtime and approved text provider; not a standalone executable or test result:

```typescript
import { ModelType } from '@elizaos/core';
const result = await runtime.useModel(ModelType.TEXT_SMALL, {
  prompt: 'Reply with the single word ok.',
  maxTokens: 16,
  signal: AbortSignal.timeout(10_000),
});
// Inspect the result and request-correlated provider/model evidence locally.
// Do not dump whole runtime state, prompts, provider errors or credentials.
```

For current single embeddings the input shape is `{ text: 'public fixture' }`,
not `{ input: ... }`; batch input uses `{ texts: [...] }`. Test only if needed
and authorized. Validate actual finite vectors, expected width and vector-space
identity; a nonzero-length array does not prove retrieval quality. Do not write
test vectors into the live production corpus.

Verify text, embeddings, voice and image capabilities independently. Use synthetic
inputs, a private isolated host, finite budgets and no tools/connectors. Research
models can browse or use tools and are not a harmless replacement for a tiny text
probe. Do not publish messages or start a production agent just to test a key.

## Interpret results honestly

| Evidence | Establishes | Does not establish |
| --- | --- | --- |
| Configuration reviewed | Intended settings and routing | Credential validity or activation |
| Handler registered | A capability is admitted/registered | Model loaded or endpoint healthy |
| Synthetic text call succeeded | That observed call produced text | All tiers, tools or embeddings work |
| Embedding probe succeeded | Returned vector properties | Corpus compatibility or retrieval quality |
| Cancel requested | Caller requested cancellation | Provider stopped billing |

Record actual serving provider/model when available, failures, retries, duration
and cost evidence. A generic display label or most-recent-provider value is not
per-request evidence under concurrent traffic. Report unknowns explicitly.

## Roll back only the intended change

Retain the previous non-secret settings and dependency lockfile revision. Apply
rollback through the owning host's authorized reload/restart path. Never reset
agent storage to reverse a model selection. If embedding representation changed,
restore a compatible index or complete the separately approved reindex/cutover;
simply reverting a model name cannot restore vector consistency. Rotate leaked
credentials through their issuer; do not print or commit them to document repair.
