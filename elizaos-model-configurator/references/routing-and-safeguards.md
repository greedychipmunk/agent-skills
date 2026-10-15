# Routing, privacy and cost safeguards

Source: pinned core model-dispatch implementation and types listed in the
source reference. Verify the same executed branches in the target revision.

## Selection has several independent layers

1. Canonical host service routing may disable text/embedding capabilities, even
   if a plugin package is installed. Do not widen it to make a test pass.
2. Supported `LLMMode` overrides can change requested text tiers. Do not assume
   every model type is affected or that SMALL means a fixed-price model.
3. Registered handlers are ordered by descending priority and registration
   order within a model type. Inspect actual metadata, not fixed vendor rankings.
4. A per-call provider argument restricts provider candidates. It is not a promise
   of one exact concrete model ID or of no provider-internal retry.
5. Current unpinned text calls can honor `ELIZA_BRAIN_PROVIDER`. The executed
   selection branch treats this as a provider constraint; do not rely on older
   comments claiming a missing/exhausted selection silently uses another provider.
6. Approved per-action model routing may add its own strategy chain. Inspect the
   existing host/action policy rather than adding a second routing system.

Current runtime exposes handler-free `getModelRegistrations()` and optional
`getLastResolvedModelProvider(modelType)` attribution. Registration metadata is
not proof that a credential works or that an endpoint served a particular call.
The last-resolved value is not request-correlated under concurrency; use the
host's per-request evidence for exact attribution and concrete model identity.

## Parameters and results

Current normal text `useModel(ModelType.TEXT_SMALL, params, provider?)` returns
`Promise<string>` at the public runtime surface. Provider handlers can expose
stream results internally; do not return raw SDK objects where strings are
expected. Inspect installed declarations if source comments describe different
stream overloads. Use supported runtime streaming context, not guessed fields.

Numerical setting precedence is explicit call parameters → model-slot settings
(for example `TEXT_SMALL_MAX_TOKENS`) → defaults (`DEFAULT_MAX_TOKENS`). Keep zero
values where meaningful; do not use `value || default` indiscriminately. Check
provider/model support for temperature, sampling and output limits. A per-call
`model` ID is honored only by adapters supporting it.

## Failover is not a blanket retry loop

The source's tier chains are candidates, not permission to replay every error.
The dispatcher checks error eligibility, explicit provider/embedding pins,
remaining candidates and whether output started. Cancellation is not a reason
to call another provider. A partial answer followed by another provider can
duplicate output or violate a caller's privacy choice.

Do not stack arbitrary retries on top of SDK/runtime retries. Count every
attempt, including failed/billed requests. Inspect the installed classifier and
actual receipts before making rate-limit, auth or timeout retry claims. No
universal fallback matrix is asserted here.

## Privacy and budgets must be enforced

Record allowed destinations for prompts, documents, images, audio and embeddings
separately. A local primary with Cloud fallback is not a local-only guarantee.
Use trusted host routing, network restrictions and isolated secrets where needed;
neither model descriptions nor plan Markdown enforce egress or budget ceilings.

Bound requests, retries, total elapsed time and output tokens. Set a total cost
ceiling using actual host/provider enforcement, or state that it remains manual.
Do not invent a `useModel(maxCost)` option from tutorial pseudocode. Do not set
`omitMaxTokens` merely to improve a smoke test. A caller AbortSignal stops local
consumption/transport where honored; it does not prove provider billing stopped
or refund a request already dispatched. Revalidate after changing model/provider.
