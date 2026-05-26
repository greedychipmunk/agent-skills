# Model Selection Guide

## Production Recommendations

### High-Quality Reasoning
- **GPT-4o**: Best overall, reliable tool calling
- **Claude Sonnet 4**: Excellent reasoning, strong with memory tools
- **Gemini 2.5 Pro**: Fast, good capability

### Cost-Efficient
- **GPT-4o-mini**: Best balance of cost and capability
- **Claude Haiku 3.5**: Fast, lightweight, good for simple tasks
- **Gemini 2.0 Flash**: Balanced speed/capability

### Local/Self-Hosted
- **Qwen 2.5**: Strong local model with good tool calling
- **Llama 3.3 70B**: Excellent local option
- **Mistral Small**: Good tool calling for its size

## Avoid for Production

### Tool Calling Issues
- Models < 7B parameters — unreliable tool calling
- Models without function calling support
- Untested vision models in tool-calling contexts

### Proxy Provider Issues
- Some proxy providers have inconsistent tool calling across models
- Check provider-specific documentation for tool calling compatibility

## Context Window Considerations

**Sweet spot: ~32k tokens**
- Larger windows (100k+) can cause:
  1. Agent reliability decreases
  2. Response latency increases

**When to increase:**
- Specific use case requires larger context
- Willing to accept performance trade-offs
- Have tested reliability at target size

## Reasoning Models

Models with native reasoning capabilities (chain-of-thought, extended thinking) tend to perform better on multi-step agent tasks. Prefer these when:
- The agent needs to plan before acting
- Complex tool orchestration is required
- Error recovery demands reasoning about what went wrong

## Cost Management

- Self-hosted: Pay per token directly to provider
- Managed services: Often per-message pricing
- Consider caching and summarization to reduce token usage
- Monitor actual usage patterns — agents often use more tokens than expected
