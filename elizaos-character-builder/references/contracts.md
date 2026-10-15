# Character contracts and migration

At snapshot `eb9a6f7d3ccc46d3ff9d173383cff900004738c9`:

| Surface | Contract | Consequence |
| --- | --- | --- |
| Core `types/agent.ts` | Canonical bio is `string[]`, examples are `MessageExampleGroup[]`; name optional in interface | Type-checking alone is not runtime validation |
| Core `character-schema.ts` | Requires nonempty name; accepts string/array bio and grouped/nested-array examples, normalizing both | Use validated `.data` for normalized output |
| Core `character.ts` | `parseCharacter(object)` normalizes then validates; `createCharacter` only normalizes | Construction is not validation |
| Host `config/character-schema.ts` | Strict subsection allows name, username, bio, system, adjectives, topics, style, messageExamples, postExamples | Plugins/settings/documents belong elsewhere in host config |

The host allows optional name (max 100), username (max 50), system (max 10,000),
adjective/topic entries (1–100 characters) and nonempty example text. Examples
must be groups. The helper requires a nonblank name for useful authoring; that
is skill policy, not a claim that all upstream schemas require one.

## Migrate deliberately

Older input examples:

```json
{"name":"Guide","bio":"Helpful","messageExamples":[[{"name":"Guide","content":{"text":"Hello"}}]]}
```

Current canonical authoring:

```json
{"name":"Guide","bio":["Helpful"],"messageExamples":[{"examples":[{"name":"Guide","content":{"text":"Hello"}}]}]}
```

Current core normalizers can accept the first form. Host configuration is not
the same loader. Preserve content, IDs, plugin lists and settings. Do not mass-
convert an older project without inspecting its actual installed contract.

## Documents are not biography facts

Current canonical document descriptors:

```json
{"item":{"case":"path","value":"./docs/approved-guide.md"}}
```

```json
{"item":{"case":"directory","value":{"path":"./docs/approved","shared":false}}}
```

`normalizeCharacterInput` treats strings as paths and combines documents and
knowledge. Direct `validateCharacter` uses knowledge only when documents is
empty. Do not lose information by switching entry points. Move prose facts
into bio or approved document content after review, not fabricated filenames.
Configuration alone does not prove ingestion or correct retrieval.

## Authoritative validation

Type-check against the target dependency, then use its actual schema:

```typescript
import { validateCharacter } from '@elizaos/core';
const result = validateCharacter(input);
if (!result.success) {
  throw new Error('Character validation failed; inspect sanitized issue paths locally');
}
const character = result.data;
```

Do not copy the guide's `.valid`/`.errors` API onto this snapshot. Do not print
input, normalized data, full error objects or secret-bearing settings. The
offline helper is a partial authoring check; it does not implement every Content
union, function template, UUID constraint, transformation or future extension.
