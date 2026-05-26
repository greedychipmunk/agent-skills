# Agent Architectures

## Single Agent, Stateful (Recommended Default)

**Key Features:**
- Maintains conversation context across turns
- Memory blocks persist between sessions
- Tool calling for external actions
- Works with any frontier model that supports function/tool calling

**When to use:**
- Personal assistants, coding agents, support bots
- Any scenario where the agent needs to remember past interactions
- Most common architecture — start here

**Trade-offs:**
- Context window limits how much the agent can "see" at once
- Long conversations may require summarization or eviction
- Single agent can become a bottleneck for complex multi-domain tasks

## Single Agent, Stateless

**Key Features:**
- No conversation memory between requests
- Each invocation is independent
- Simpler to scale and reason about

**When to use:**
- One-shot tools (classify this, extract that, translate this)
- High-throughput APIs where context isn't needed
- Batch processing pipelines

**Trade-offs:**
- Cannot build on previous interactions
- User must provide all context in each request

## Multi-Agent, Shared Memory

**Key Features:**
- Multiple specialized agents share memory blocks
- Agents can read/write to common blocks
- Coordinator or router dispatches to specialists

**When to use:**
- Complex workflows where different agents specialize (research, coding, review)
- Team-like collaboration patterns
- When a single agent's context window can't cover all domains

**Trade-offs:**
- Concurrency risks on shared memory (see concurrency.md)
- More complex orchestration logic
- Higher latency from agent-to-agent communication

## Multi-Agent, Orchestrated

**Key Features:**
- Pipeline or fan-out patterns
- Router agent dispatches tasks to specialist agents
- Results flow back through the orchestrator

**When to use:**
- Sequential pipelines (research → draft → review)
- Fan-out patterns (same query to multiple agents, compare results)
- When isolation between agents matters more than shared state

**Trade-offs:**
- Latency compounds across pipeline stages
- Context must be serialized between agents
- Error handling is more complex

## Architecture Decision Guide

| Question | Answer → Architecture |
| --- | --- |
| Need to remember past interactions? | Yes → Stateful |
| Single domain or multiple? | Single → Single agent; Multiple → Multi-agent |
| Do agents need to share state? | Yes → Shared memory; No → Orchestrated |
| Is latency critical? | Yes → Single agent (fewer hops) |
| Is scale/throughput critical? | Yes → Stateless or orchestrated |
