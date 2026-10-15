# Official sources and version boundary

Read 2026-10-15. Upstream: https://github.com/elizaOS/eliza.
Pinned develop: `eb9a6f7d3ccc46d3ff9d173383cff900004738c9`.
Root manifest: `2.0.4`; core manifest: `2.0.3-beta.7`. These are not npm dist-tags
or proof that the user's installed package matches.

## Implementation

- [Character types](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/agent.ts)
- [Core schema and validator](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/character-schema.ts)
- [Normalization and parsing](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/character.ts)
- [Document sources](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/src/types/documents.ts)
- [Host subsection schema](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/agent/src/config/character-schema.ts)
- [Core composition/testing](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/README.md)
- [Upstream entry points/policy](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/README.md)

## Conceptual official documentation

- [Index](https://docs.elizaos.ai/llms.txt)
- [Character interface](https://docs.elizaos.ai/agents/character-interface.md)
- [Personality](https://docs.elizaos.ai/agents/personality-and-behavior.md)
- [Customization](https://docs.elizaos.ai/guides/customize-an-agent.md)

Known differences: guides use nested-array examples, string bio, prose knowledge
and `.valid`. Current canonical core uses grouped examples, array bio, tagged
document sources and `.success`. Some legacy inputs are explicitly normalized;
the host uses a different strict schema. Recheck the installed implementation.
