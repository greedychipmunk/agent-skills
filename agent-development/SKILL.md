---
name: agent-development
description: Design and build AI agents with persistent memory, tool use, and multi-turn conversation. Covers architecture selection, memory design, model selection, tool configuration, and implementation patterns across agent frameworks. Use when creating, debugging, or improving AI agents.
license: MIT
metadata:
  author: greedychipmunk
  version: "1.0"
---

# Agent Development

Design and build effective AI agents with appropriate architectures, memory configurations, model selection, and tool setups. Works across any agent framework or custom implementation.

## When to Use

- Starting a new agent project
- Choosing between agent architectures (single-agent, multi-agent, stateless, stateful)
- Designing memory structure and context management
- Selecting appropriate models for your use case
- Planning tool configurations
- Optimizing memory management and performance
- Implementing shared memory between agents
- Debugging memory-related issues

## Architecture Selection

| Architecture | When to use |
| --- | --- |
| **Single agent, stateful** | Most common case. Agent maintains context across turns. Best for personal assistants, coding agents, support bots. |
| **Single agent, stateless** | Simple request/response patterns. No conversation memory needed. Good for one-shot tools. |
| **Multi-agent, shared memory** | Complex workflows where different agents specialize. Coordinate via shared memory blocks or message passing. |
| **Multi-agent, orchestrated** | Pipeline or fan-out patterns. A router agent dispatches to specialist agents. |

Read `resources/architectures.md` for detailed comparison and tradeoffs.

## Memory Architecture

Three memory types cover most agent needs:

**Core Memory (in-context):**
- Always accessible in the agent's context window
- Use for: current state, active context, frequently referenced information
- Limit: Keep total core memory under 80% of context window

**Archival Memory (out-of-context):**
- Semantic search over vector database or document store
- Use for: historical records, large knowledge bases, past interactions
- Access: Agent must explicitly search — not automatically populated from context overflow

**Conversation History:**
- Past messages from current conversation
- Use for: referencing earlier discussion, tracking conversation flow
- Older messages may be evicted; store durable facts in core/archival memory

Read `resources/memory-architecture.md` for detailed guidance.

## Memory Block Design

**Core principle:** One block per distinct functional unit.

**Essential blocks:**
- `persona`: Agent identity, behavioral guidelines, capabilities
- `human`: User information, preferences, context

**Add domain-specific blocks based on use case:**
- Customer support: `company_policies`, `product_knowledge`, `customer`
- Coding assistant: `project_context`, `coding_standards`, `current_task`
- Personal assistant: `schedule`, `preferences`, `contacts`

**Guidelines:**
- Keep blocks focused and purpose-specific
- Use clear, instructional descriptions
- Monitor size limits (typically 2000-5000 characters per block)
- Design for append operations when sharing memory between agents

Read `resources/memory-patterns.md` for domain examples and `resources/description-patterns.md` for writing effective descriptions.

## Model Selection

| Use case | Recommended tier |
| --- | --- |
| Complex reasoning, tool calling, multi-step plans | Frontier models (GPT-4o, Claude Sonnet 4, Gemini 2.5 Pro) |
| Cost-efficient general tasks | Mid-tier (GPT-4o-mini, Claude Haiku 3.5, Gemini 2.0 Flash) |
| Fast, lightweight operations | Small/fast models (Haiku, Flash) |

**Avoid for production agents:**
- Models without reliable function/tool calling support
- Small local models (<7B parameters) for tool-use-heavy agents

Read `resources/model-recommendations.md` for detailed guidance.

## Tool Configuration

**Start minimal:** Attach only tools the agent will actively use.

**Common starting points:**
- **Memory tools** (insert, replace, search): Core for most stateful agents
- **File system tools**: When the agent needs to read/write files
- **Custom tools**: For domain-specific operations (databases, APIs, etc.)

**Tool rules:** Enforce sequencing when needed (e.g., "always call search before answer").

Read `resources/tool-patterns.md` for common configurations.

## Advanced Topics

### Memory Size Management

When approaching character limits:
1. **Split by topic:** `customer_profile` → `customer_business`, `customer_preferences`
2. **Split by time:** `interaction_history` → `recent_interactions`, archive older to archival memory
3. **Archive historical data:** Move old information to archival memory
4. **Consolidate:** Summarize and rewrite block

Read `resources/size-management.md` for strategies.

### Concurrency Patterns

When multiple agents share memory or an agent processes concurrent requests:

**Safest operations:**
- Append-only writes (minimal race conditions)
- Database-backed storage with row-level locking

**Risk of race conditions:**
- Replace operations: target string may change before write
- Full rewrites: last-writer-wins, no merge

**Best practices:**
- Design for append operations when possible
- Reserve full rewrites for single-agent exclusive access

Read `resources/concurrency.md` for detailed patterns.

## Implementation Examples

### Python (SDK-based)

```python
agent = client.agents.create(
    name="my-agent",
    model="gpt-4o",
    memory_blocks=[
        {"label": "persona", "value": "You are a helpful assistant..."},
        {"label": "human", "value": "User preferences and context..."},
        {"label": "project", "value": "Current project details..."},
    ],
)
```

### TypeScript (SDK-based)

```typescript
const agent = await client.agents.create({
  name: "my-agent",
  model: "gpt-4o",
  memoryBlocks: [
    { label: "persona", value: "You are a helpful assistant..." },
    { label: "human", value: "User preferences and context..." },
    { label: "project", value: "Current project details..." },
  ],
});
```

### CLI-based

Most agent frameworks provide a CLI for interactive agent creation and configuration. Check your framework's documentation for creating new agents, setting names and descriptions, configuring memory blocks, and attaching tools.

## Validation Checklist

**Architecture:**
- [ ] Does the architecture match the model's capabilities?
- [ ] Is the model appropriate for expected workload and latency?

**Memory:**
- [ ] Is core memory total under 80% of context window?
- [ ] Is each block focused on one functional area?
- [ ] Are descriptions clear about when to read/write?
- [ ] Have you planned for size growth and overflow?
- [ ] If multi-agent, are concurrency patterns considered?

**Tools:**
- [ ] Are tools necessary and properly configured?
- [ ] Are memory blocks granular enough for effective updates?

## Common Antipatterns

**Too few memory blocks:** Everything in one block makes updates expensive and imprecise. Split into focused blocks.

**Too many memory blocks:** 10+ blocks when 3-4 would suffice. Start minimal, expand as needed.

**Poor descriptions:** `data: "Contains data"` tells the agent nothing. Provide actionable guidance about when to read/write.

**Ignoring size limits:** Blocks grow indefinitely until they hit limits. Monitor and manage proactively.

## Resources

- `resources/architectures.md` — Architecture comparison and selection
- `resources/memory-architecture.md` — Memory types and when to use them
- `resources/memory-patterns.md` — Domain-specific memory block examples
- `resources/description-patterns.md` — Writing effective block descriptions
- `resources/size-management.md` — Managing memory block size limits
- `resources/concurrency.md` — Multi-agent memory sharing patterns
- `resources/model-recommendations.md` — Model selection guidance
- `resources/tool-patterns.md` — Common tool configurations
