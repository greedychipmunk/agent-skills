# Version boundaries and source authority

Prefer installed exported declarations + lockfile → matching package/tag source and owning README → pinned develop source for develop work → public prose. Do not infer library version from root monorepo version.

Baseline: GitHub API verified default branch develop at `eb9a6f7d3ccc46d3ff9d173383cff900004738c9` on 2026-10-15. Complete tree response was not truncated. Research did not install or execute upstream packages.

- [Root manifest](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/package.json): version 2.0.4, Node 24.15.0, Bun 1.4.2.
- [Core manifest](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/package.json): @elizaos/core 2.0.3-beta.7, Node >=24, ESM exports, Vitest tests.
- [Core README](https://github.com/elizaOS/eliza/blob/eb9a6f7d3ccc46d3ff9d173383cff900004738c9/packages/core/README.md): hosts explicitly compose adapters/model providers/assistant behavior; settings are per-agent.

Unknown: current npm latest/beta tags, published CLI behavior, and older plugin compatibility. Read registry metadata without installing when needed. Never call this snapshot the current stable API.

## Refresh selectively

```bash
gh api repos/elizaOS/eliza --jq .default_branch
gh api repos/elizaOS/eliza/commits/develop --jq .sha
# Replace SHA with the exact returned revision; quote URLs containing ?.
gh api 'repos/elizaOS/eliza/contents/packages/core/src/types/plugin.ts?ref=SHA' \
  --jq .content | base64 -d
```

Read a few relevant files rather than cloning/retrieving huge trees. Source access is not permission to run install hooks or builds.

## Public docs drift

Review official [architecture](https://docs.elizaos.ai/plugins/architecture), [components](https://docs.elizaos.ai/plugins/components), [development](https://docs.elizaos.ai/plugins/development), and [reference](https://docs.elizaos.ai/plugins/reference) as secondary conceptual sources. They are mutable, not revision-pinned. Treat legacy/v1-style examples as such, not proof every example belongs to one release.

| Public recipe | Pinned develop contract | Response |
| --- | --- | --- |
| Plugin.routes; adapter instance | No Plugin.routes; adapter is AdapterFactory | Inspect host API/factory |
| Handler may return void | Promise<ActionResult> | Return results consistently |
| Evaluator validate/handler/alwaysRun/examples | schema/shouldRun/prompt/processors | Redesign pipeline |
| getSetting returns string/undefined | string/boolean/number/null | Narrow types; missing is null |
| message.content.includes(...) | Content is an object | Read optional content.text |
| callback(content, []) | Argument two is optional string action name | Do not pass an array |
| Simple default provider composition | Context/role/disclosure selection | Verify admitted composition |
| Bootstrap/SQL universally assumed | Host composes capabilities | Inspect host configuration |

When character validation appears during integration, inspect the exported validator's return type: do not copy docs' `.valid` when the target returns `.success`. Do not add character validation to a plugin by default.

## CLI creation caveat

Public development docs advertise `elizaos create my-plugin --type plugin`, quick/full templates, tsup, and elizaos dev/start. The pinned tree has no packages/cli, and root has no bin entry. This does not prove older published CLIs are broken/absent. Resolve the exact CLI version and capabilities first; otherwise adapt a minimal manifest into the existing project. Never promise generated files/scripts from these docs alone.
