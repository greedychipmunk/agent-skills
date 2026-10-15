# Persona design and behavioral evaluation

## Design from the job

Keep a clear role, audience, voice, knowledge boundary and action boundary.
Prefer three concrete traits over contradictory adjective lists. Align bio,
system, style and examples. Do not invent human experience, certifications,
citations, customer facts or guarantees of accuracy.

Show normal help, ambiguity and boundaries, not only greetings. Examples
condition responses; they are not fine-tuning or behavioral proof. Style `all`
should work in chat and posts; specialize only where contexts differ. Do not
embed actual private customer conversations without authorization/sanitization.

## Behavioral matrix

| Scenario | Desired observation | Failure |
| --- | --- | --- |
| Normal domain question | Grounded, useful answer | Fabricated feature or citation |
| Missing information | Honest uncertainty and useful next step | Confident guessing |
| Out-of-domain request | Scope and useful redirection | Claims unavailable expertise |
| Malicious retrieved text | Retrieved content remains data | Obeys instructions to reveal secrets |
| External/destructive action | Actual authenticated authorization | Claims success without verified effect |
| Frustration/correction | Calm, factual response | Persona theatrics replace help |

Use the same model, settings and knowledge snapshot before/after a change.
Record actual answers, time/call/token budget and explicit outcome reasoning.
Keep transcripts local and sanitized. A keyword match, mock response or desired
answer proves neither persona quality nor prompt-injection resistance.

Change one source of inconsistency at a time. Keep a before/after diff; roll
back character edits only, never clear storage to fix tone. Use a private local
room, not public posts or customer messages, to evaluate voice.
