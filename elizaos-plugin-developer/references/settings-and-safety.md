# Settings, authorization, and effects

Sources: [runtime implementation](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/runtime.ts#L1972-L2123), [runtime types](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/runtime.ts), [components](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/components.ts), [core README](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/README.md).

## Retrieve per-agent configuration

```ts
getSetting(key: string): string | boolean | number | null;
setSetting(key: string, value: string | boolean | null, secret?: boolean): void;
```

Pinned precedence: character.secrets → character.settings → settings.extra → nested settings.secrets → character.env direct/vars → constructor settings. The method has no direct process.env fallback. Hosts can bridge approved values; core README documents specific host-policy exceptions. Never add broad fallbacks that leak one agent's credentials to another.

Require nonblank strings for credentials; distinguish missing from false/zero for ordinary settings. getSetting decrypts strings and converts literal true/false strings to booleans. setSetting(key,null) clears current maps, including shadowed secret snapshots. Verify persistence separately: runtime state changes do not prove durability after restart.

Use secret-aware host storage rather than manifest literals. The setter secret flag routes strings into character secret state; it does not itself establish encrypted persistence. Never print whole configs/settings, return credentials in provider data, commit .env files, or use real tokens in examples/tests.

## Selection is not authority

- Similes, examples, validate selection and provider private/description flags do not establish identity or consent.
- Use host-authenticated actors, permission and destination-audience evidence; never grant permission from message text/model parameters.
- Apply roleGate/disclosureGate in addition to context routing. Recheck mutable permissions at execution/commit boundaries.
- Pinned provider disclosureGate permits only owner_exclusive. Do not widen to action-only audience_admission: source explicitly warns provider enforcement is narrower.
- A discovered tool schema is not a permanent grant.

## Ground consequential effects

Use typed parameters and explicit confirmations. Preserve exact operation identity, approved scope, and provider/store commit evidence. A prediction, preview, queue admission, or transport acknowledgment is not a committed effect.

ActionResult supports success, effectReceipts, userFacingText, verifiedUserFacing, userFacingEffectReceiptIds, failure provenance, and chain controls. Source says success alone is not mutation proof. Before implementing visible mutation completion, inspect types/effects.ts and an analogous maintained action. Use canonical receipt constructors/validation and exact bound receipt IDs; never fabricate receipt schemas from prose.

Current confirmation status names include CONFIRMATION_REQUIRED, NOT_CONFIRMED, REQUIRES_CONFIRMATION, AWAITING_CONFIRMATION, NEEDS_CONFIRMATION. Comments also describe requiresConfirmation handling. Verify where fields belong in the target result/executor; do not invent top-level properties.

continueChain:false aborts the remaining queue; it is not equivalent to successful turn completion. turnComplete has conservative single-operation semantics. Do not drop pending user intents merely to stop execution.

## Cancellation and teardown

Propagate provider execution signal and server-owned action abortSignal where supported. Never allow model parameters to select privileged execution/cancellation options. Stop admitting service work during shutdown, then drain/close resources. Reconcile uncertain mutations against authoritative receipts before retrying; do not blindly replay effects.

Follow [SECURITY.md](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/SECURITY.md): report privately via GitHub Security Advisories or security@elizalabs.ai, never public vulnerability issues. Official security scope excludes independently maintained third-party plugins.
