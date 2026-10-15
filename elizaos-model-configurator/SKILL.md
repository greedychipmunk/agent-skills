---
name: elizaos-model-configurator
description: >
  Plans, configures, and verifies elizaOS model providers, capability routing,
  model-slot overrides, local versus hosted inference, embedding compatibility,
  and bounded failover. Use when selecting OpenAI, Anthropic, Eliza Cloud or
  local inference, changing the chat model, separating text and embedding
  backends, or reviewing privacy and cost implications of a model change.
  Checks installed contracts instead of copying outdated model-routing examples.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# elizaOS Model Configurator

Make an intentional model configuration change, not a general runtime repair or
plugin implementation. Keep capability availability, data destinations, billing
and actual routing explicit. Configuration is not proof of working inference.

## 1. Establish the target

Read project instructions, the owning README, manifest/lockfile, existing host
configuration and installed model-plugin declarations. Identify core embedding,
standalone agent, app/desktop, Cloud-hosted runtime or thin client. Record the
resolved package versions and whether the user requested configuration only or
also approved installation, restart, downloads and paid verification.

Read [versions and sources](references/versions-and-sources.md). The baseline is
a pinned 2.x develop snapshot, not npm's latest release. Do not silently upgrade
an existing 1.x project or install a global CLI to match these examples.

## 2. Specify the capability plan

Fill [the routing-plan template](assets/routing-plan.md) with the actual needed
capabilities: text tiers, response handler/planner, embeddings, and any approved
image/audio operations. It is a planning document, **not runtime configuration**.
For each capability, record provider/model, setting names, data destination,
permitted fallbacks, budget, verification and rollback. Unknowns remain unknown.

Do not assume the chat provider supplies embeddings, or that enabling one model
plugin makes all capabilities available. Read [provider choices](references/provider-recipes.md).
Choose only compatible, necessary plugins; reuse existing explicit host composition.
Do not add a second storage adapter or duplicate registration to select a model.

## 3. Apply the smallest authorized change

Configure through the target host's supported settings/loader. Preserve unrelated
settings and source identities. Use the provider's actual setting names rather
than generic `modelProvider` or arbitrary `settings.model` fields.

Keep keys in approved host secret storage. Never print keys, full environment,
runtime settings, connection strings or configuration dumps. Core settings and
plugin environment fallback differ; inspect both. For example, current OpenAI
plugin helpers can fall back to process environment even though core getSetting
itself is per-agent. Do not assume that means safe multi-agent secret isolation.

Review custom endpoints before supplying a credential: who owns the origin,
what base-path/API compatibility is required, what data may leave, and whether
fallback uses the same approved destination. Do not disable TLS/auth checks.
Changing a provider endpoint is a data-disclosure decision, not cosmetic setup.

## 4. Verify actual routing and constraints

Read [routing and safeguards](references/routing-and-safeguards.md). Inspect the
target's registered capability metadata, not an old tutorial's priority table.
Current core offers handler-free `getModelRegistrations()` metadata; the
registered provider ID is not necessarily its package name. Inspect only needed
metadata locally; do not dump the runtime or assume metadata proves liveness.

Distinguish a model-type slot, provider selection and concrete model ID. Use
exported `ModelType` constants. A per-call provider argument and the current
`ELIZA_BRAIN_PROVIDER` selection constrain routing; do not promise that every
failure tries another provider. Canonical host service routing can disable a
capability regardless of a package being installed.

Treat embedding changes as vector-space changes. Matching dimensions alone is
insufficient if the model or preprocessing changed. Do not hot-switch providers,
delete vectors or recreate a database to resolve a dimension error. Plan approved
re-embedding, backup and cutover separately.

## 5. Verify in layers and hand off

Read [verification and rollback](references/verification.md). Start with static
version/configuration/registration checks. Then, only if approved, run a tiny
synthetic request for each required capability in an isolated host, with finite
calls, output limits and cancellation. Do not use customer prompts or trigger
tools, public messages, research agents or wallets to test model setup.

Report **planned**, **configured**, **registered**, and **live-verified** separately.
Record intended and observed provider/model, exact checks, failures/attempts,
cost/privacy boundaries and rollback. A key being present, model in a catalog,
HTTP 200 or successful text call does not establish all capabilities. Do not
claim paid/live behavior when only docs and source were checked.

## References

- [Versions and sources](references/versions-and-sources.md): source authority and doc drift.
- [Provider recipes](references/provider-recipes.md): settings, local/Cloud separation and embeddings.
- [Routing and safeguards](references/routing-and-safeguards.md): selection, failover, privacy and budgets.
- [Verification](references/verification.md): safe probes, evidence and rollback.
