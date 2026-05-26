# Docker AI and Agent Tooling

Covers Docker's AI-centric CLI features: Model Runner, MCP Toolkit, Ask Gordon, Agent/cagent, and Sandbox.

## Related References

- `references/troubleshooting.md` — runtime troubleshooting.
- `references/cloud-and-remote.md` — remote/offload behavior.

---

## Docker Model Runner (`docker model`)

Pulls and runs LLMs from Docker Hub and HuggingFace, exposing a local OpenAI-compatible API endpoint.

### Setup

```bash
docker model status                        # Check if runner is active
docker model version
docker model logs                          # Runner service logs
```

### Finding & Pulling Models

```bash
docker model search llama
docker model search mistral
docker model pull ai/llama3.2             # From Docker Hub
docker model pull hf.co/Qwen/Qwen2.5-Coder-7B-Instruct-GGUF  # From HuggingFace
docker model list
docker model show ai/llama3.2
docker model df                            # Disk usage
```

### Running Models

```bash
docker model run ai/llama3.2              # Interactive chat (REPL)
docker model run ai/llama3.2 "Explain Docker in one sentence"
docker model ps                           # Running models
docker model rm ai/llama3.2               # Remove downloaded model
docker model purge                        # Remove ALL models (confirm first!)
```

### OpenAI-Compatible API

When Model Runner is active it exposes `http://localhost:12434/engines/llama.cpp/v1`.

```bash
curl http://localhost:12434/engines/llama.cpp/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{"model": "ai/llama3.2", "messages": [{"role": "user", "content": "Hello!"}]}'

curl http://localhost:12434/engines/llama.cpp/v1/models
```

Point any OpenAI-compatible SDK at the local endpoint:

```python
from openai import OpenAI
client = OpenAI(base_url="http://localhost:12434/engines/llama.cpp/v1", api_key="unused")
response = client.chat.completions.create(
    model="ai/llama3.2",
    messages=[{"role": "user", "content": "Explain containers in one sentence"}]
)
```

```javascript
import OpenAI from 'openai';
const client = new OpenAI({ baseURL: 'http://localhost:12434/engines/llama.cpp/v1', apiKey: 'unused' });
```

### Benchmarking

```bash
docker model bench ai/llama3.2
docker model bench ai/llama3.2 --concurrency 4
```

---

## Docker MCP Toolkit (`docker mcp`)

Manages MCP servers — processes that give AI assistants tools to interact with external services.

### Server Management

```bash
docker mcp catalog list                   # Browse available servers
docker mcp catalog search github
docker mcp server add mcp/github
docker mcp server ls
docker mcp server start mcp/github
docker mcp server logs mcp/github
```

### Gateway (Client Connection)

```bash
docker mcp gateway start                  # Start local proxy for MCP clients
docker mcp gateway stop
docker mcp gateway status
```

### Secrets

```bash
docker mcp secret set GITHUB_TOKEN ghp_xxxx
docker mcp secret ls
docker mcp secret rm GITHUB_TOKEN
```

### Tools and Clients

```bash
docker mcp tools list
docker mcp tools list --server mcp/github
docker mcp client ls                      # Supported clients
docker mcp client configure claude-desktop
docker mcp client configure vscode
```

### Typical Workflow: Add GitHub MCP Server

```bash
docker mcp secret set GITHUB_TOKEN ghp_yourtoken
docker mcp server add mcp/github
docker mcp gateway start
docker mcp client configure claude-desktop
docker mcp tools list
```

---

## Ask Gordon (`docker ai`)

```bash
docker ai
docker ai "How do I run redis with persistent storage?"
```

Keep shell-out opt-in. Confirm before letting Gordon execute commands.

---

## Docker Agent / cagent (`docker agent`)

```bash
docker agent --help
docker agent run ./agent.yaml
docker agent serve --help
```

Treat agent execution as code execution. Confirm before running untrusted agent configs.

---

## Docker Sandbox (`docker sandbox`)

```bash
docker sandbox ls
docker sandbox run --help
docker sandbox exec --help
```

Never run `docker sandbox reset` without explicit confirmation — treated as a destructive reset.

---

## Safety Pattern for AI Tooling

1. Inspect available commands and versions first.
2. Confirm trust boundaries (files, network, command execution).
3. Use minimal privileges and reversible steps.
4. Summarize side effects before execute-style recommendations.

Model workflows can consume significant storage and network bandwidth — confirm before large pulls.

---

## Source Links

- <https://docs.docker.com/ai/gordon/>
- <https://docs.docker.com/ai/cagent/>
- <https://docs.docker.com/reference/cli/docker/ai/>
- <https://docs.docker.com/reference/cli/docker/agent/>
- <https://docs.docker.com/reference/cli/docker/mcp/>
- <https://docs.docker.com/reference/cli/docker/model/>
- <https://docs.docker.com/reference/cli/docker/sandbox/>
