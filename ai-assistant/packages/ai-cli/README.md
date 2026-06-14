# @headlamp-k8s/ai-cli

Command-line interface for the Headlamp AI assistant. Ask questions about your
Kubernetes cluster, run queries in scripts, or use it in CI pipelines — all with
the same AI core as the Headlamp UI.

## Installation

```sh
npm install -g @headlamp-k8s/ai-cli
```

## Quick start

```sh
# One-shot query (GitHub Copilot auto-detected from `gh auth token`)
headlamp-ai --auto-detect "how many pods are running in kube-system?"

# Interactive REPL
headlamp-ai -i --provider openai --api-key sk-...

# Pipe a question via stdin
echo "show me all failing pods" | headlamp-ai --provider gemini --api-key ...
```

## Options

| Flag | Description |
|---|---|
| `--provider <id>` | AI provider to use (see [Providers](#providers)) |
| `--api-key <key>` | API key for the provider |
| `--base-url <url>` | Base URL for `local` / `vllm` providers |
| `--model <name>` | Override the model name |
| `-i` / `--interactive` | Start an interactive REPL session |
| `--allow-mutations` | Allow POST/PUT/DELETE kubectl operations. Default: read-only |
| `--auto-approve` | Approve all tool calls without prompting (see [Tool approval](#tool-approval)) |
| `--auto-detect` | Detect available providers (Copilot, Azure, Ollama) and use the first one |
| `--save` | With `--auto-detect`: save the detected provider to `headlamp-ai.json` |
| `--skill-source <url>` | Git URL of a skills repo (repeatable) |
| `--mock-skills` | Inject a built-in mock skill set instead of loading from Git (no network needed) |
| `--mock-tools` | Inject mock Kubernetes tool results — no real cluster needed |
| `--config <path>` | Path to a JSON config file |
| `-h` / `--help` | Print usage |

## Providers

| ID | Notes |
|---|---|
| `openai` | Requires `--api-key` |
| `anthropic` | Requires `--api-key` |
| `gemini` | Requires `--api-key` |
| `mistral` | Requires `--api-key` |
| `deepseek` | Requires `--api-key` |
| `copilot` | Uses `gh auth token` — no separate key needed |
| `azure` | Requires `--api-key`, `--base-url`, `--model` (deployment name) |
| `local` | Ollama or any OpenAI-compatible server at `--base-url` |
| `mock-testing-model` | No API key or network needed — returns canned responses (see [Mock mode](#mock--offline-mode)) |

## Configuration

Config is resolved in this order (later wins):

1. `headlamp-ai.json` in the Headlamp data directory
2. Environment variables (see [Environment variables](#environment-variables))
3. CLI flags

## Tool approval

When the assistant uses a Kubernetes tool, read-only calls are approved
automatically. Mutating calls (POST/PUT/DELETE) require `--allow-mutations`.

MCP tools always prompt for approval unless `--auto-approve` is set:

```sh
# CI pipeline: approve every tool call without prompting
HEADLAMP_AI_AUTO_APPROVE=1 headlamp-ai \
  --provider openai --api-key "$OPENAI_KEY" \
  "what is the status of all deployments in production?"

# Same with the flag
headlamp-ai --auto-approve --provider openai --api-key "$OPENAI_KEY" \
  "summarise the events in the default namespace"
```

> **Warning:** `--auto-approve` lets the model use any enabled tool without
> confirmation. Combine with `--allow-mutations` only in trusted environments.

## Mock / offline mode

Run without an API key or a Kubernetes cluster for demos and development:

```sh
# No API key required — returns fixture responses
headlamp-ai --provider mock-testing-model "what is a Pod?"

# Mock model + auto-approve in an interactive session
headlamp-ai -i --provider mock-testing-model --auto-approve
```

The mock model returns canned responses matched against built-in fixtures. Tool
calls are accepted but return empty/scripted results so the full conversation
flow runs without a real cluster.

For a fully offline demo — no API key, no cluster, with skill prompt injection:

```sh
headlamp-ai -i \
  --provider mock-testing-model \
  --auto-approve \
  --mock-skills \
  --mock-tools
```

Or with a single environment variable:

```sh
HEADLAMP_AI_MOCK_ALL=1 headlamp-ai -i
```

`--mock-skills` injects a built-in mock skill set so the system prompt
contains skill context even without loading from a Git repository.

## Skills

```sh
# Load skills from a Git repository
headlamp-ai -i --provider copilot \
  --skill-source https://github.com/my-org/headlamp-skills

# Multiple skill sources
headlamp-ai -i --provider copilot \
  --skill-source https://github.com/org/skills-a \
  --skill-source https://github.com/org/skills-b

# Built-in mock skills — no network needed, good for testing the skills pipeline
headlamp-ai -i --provider mock-testing-model --mock-skills

# Built-in mock tools — no cluster needed
headlamp-ai -i --provider mock-testing-model --mock-tools --auto-approve
```

## Environment variables

| Variable | Description |
|---|---|
| `HEADLAMP_AI_PROVIDER` | Provider ID (e.g. `openai`, `copilot`) |
| `HEADLAMP_AI_API_KEY` | API key |
| `HEADLAMP_AI_BASE_URL` | Base URL for local/custom providers |
| `HEADLAMP_AI_MODEL` | Model name |
| `HEADLAMP_AI_AUTO_APPROVE` | Set to `1` to auto-approve all tool calls (same as `--auto-approve`) |
| `HEADLAMP_AI_MOCK_SKILLS` | Set to `1` to inject the built-in mock skill set (same as `--mock-skills`) |
| `HEADLAMP_AI_MOCK_TOOLS` | Set to `1` to inject mock Kubernetes tool results (same as `--mock-tools`) |
| `HEADLAMP_AI_MOCK_ALL` | Set to `1` to enable full offline/demo mode: mock model + mock skills + mock tools + auto-approve |
