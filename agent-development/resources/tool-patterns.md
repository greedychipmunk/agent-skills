# Common Tool Configurations

## Memory-Only Agent

Tools: memory insert, memory replace, memory rewrite/search

**Use cases:**
- Personal assistants
- Note-taking agents
- Context managers

## File System Agent

Tools: read file, write file, list files, search files

**Use cases:**
- Code analysis
- Document processing
- Project management

## Database Agent

Tools: memory tools + custom query/update tools

**Use cases:**
- Data analysis
- Report generation
- Database management

## Multi-Agent System

Supervisor agent: memory tools + agent communication tool
Worker agents: memory tools + domain-specific tools

**Pattern:** Supervisor dispatches to workers, collects results.

## Tool Rules

Constrain tool sequences without hardcoded workflows:

- "Always search before answering" — prevents hallucinated responses
- "Always read before writing" — prevents overwriting without context
- "Terminal tools must be last" — ensures the agent completes properly

## Custom Tool Development

**Critical requirements:**
- All imports must be inside the function body (sandboxed execution)
- Return strings or JSON-serializable objects
- Include clear docstrings with parameter descriptions and return types
- Handle errors gracefully with actionable messages

**Example pattern:**

```python
def fetch_weather(city: str) -> str:
    """Fetch current weather for a city.

    Args:
        city: Name of the city

    Returns:
        Weather description string
    """
    import requests  # Import INSIDE function for sandboxed execution

    response = requests.get(f"https://wttr.in/{city}?format=3")
    return response.text
```

**Attaching tools:**
- Most frameworks support creating tools from source code and attaching them to agents
- Check your framework's SDK for tool creation and attachment APIs
