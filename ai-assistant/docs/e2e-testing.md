# E2E Testing

End-to-end testing infrastructure for the AI Assistant: mock testing model,
mock testing agent, MCP e2e tests, and a KWOK demo walkthrough.

---

## Mock Testing Model

The **mock-testing-model** is a canned-response `BaseChatModel` that matches
user prompts against fixture files — no API keys, network, or real LLM required.
Drop-in replacement for any LangChain provider.

See also: [Mock Testing Model README](../packages/ai-common/src/mock-testing-model/README.md).

### Quick start

```typescript
import { createMockTestingModel } from '@headlamp-k8s/ai-common/mock-testing-model/MockTestingModel';
const model = createMockTestingModel();
const result = await model.invoke([new HumanMessage('What is a Pod?')]);
```

Custom fixtures and sequence playback:

```typescript
// Custom fixtures — <<variable>> placeholders are captured and substituted
const model = createMockTestingModel({
  extraFixtures: [
    { prompt: 'How many replicas does <<name>> have?',
      response: 'The deployment **<<name>>** has 3 replicas.' },
  ],
});

// Sequence playback — each call returns the next canned response
const model = createMockTestingModel({ sequenceName: 'cluster-exploration-demo' });
```

### Template matching

Fixtures use `<<variable>>` placeholders (avoids conflicts with Go/Jinja/Mustache `{{…}}`).

Matching order: exact match → substring match → fallback response.

### Fixture search order

1. `extraFixtures` (passed at creation time)
2. `fixturesDir` (directory of `.json` files)
3. Built-in fixtures

### Fixture file format

Array of entries, or a named conversation sequence:

```json
[{ "prompt": "Hello", "response": "Hi!" }]
```

```json
{ "name": "my-demo", "sequence": [{ "prompt": "Hello", "response": "Welcome!" }] }
```

### CLI usage

```bash
npx tsx packages/ai-cli/src/cli.ts --config config.json "What is a Pod?"
```

Where `config.json` sets `"provider": "mock-testing-model"`.

### API

| Export | Description |
|--------|-------------|
| `createMockTestingModel(options?)` | Returns a `BaseChatModel`. Options: `extraFixtures`, `fixturesDir`, `fallbackResponse`, `sequenceName`, `extraSequences` |
| `listAvailableSequences()` | Lists all available sequences |
| `loadFixturesFromDirectory(dir)` | Loads `.json` fixture files (Node.js only) |
| `matchTemplate(input, template)` | Template matching helper |

---

## Mock Testing Agent

The **mock-testing-agent** simulates agent workflows — thinking steps,
tool calls, and final answers — without a real agent backend or cluster.

See also: [Mock Testing Agent README](../packages/ai-common/src/mock-testing-agent/README.md).

### Quick start

```typescript
import { createMockTestingAgent } from '@headlamp-k8s/ai-common/mock-testing-agent/MockTestingAgent';

const agent = createMockTestingAgent({ speedMultiplier: 0 }); // instant
const result = await agent.run('why is my pod failing', (steps) => {
  console.log('Progress:', steps.map(s => s.label));
});
// result.answer, result.steps, result.matchedSession
```

### When to use which

| | mock-testing-model | mock-testing-agent |
|---|---|---|
| **Simulates** | LLM responses | Full agent workflow (thinking + tools + answer) |
| **Use case** | Test prompt/response flows | Test agent UI (progress indicators, tool rendering) |

### Built-in sessions

| Name | Trigger (substring match) | Steps |
|------|--------------------------|-------|
| `pod-troubleshooting` | "why is my pod failing" | 8 |
| `cluster-exploration` | "what is running in my cluster" | 8 |

### Custom sessions

Pass `extraSessions` at creation time (inline objects or loaded from JSON via `loadSessionsFromFile(path)`).

Each session has: `name`, `question` (substring-matched), `steps[]` (with `phase`, `label`, optional `toolCall`), and `answer`.

### Speed control

| `speedMultiplier` | Effect |
|-------------------|--------|
| `0` | Instant (tests, CI) |
| `1.0` | Real-time (default) |

### Fallback

Unrecognized questions return immediately with a generic fallback (customizable via `fallbackAnswer`) and empty steps.

### API

| Export | Description |
|--------|-------------|
| `createMockTestingAgent(options?)` | Options: `extraSessions`, `fallbackAnswer`, `speedMultiplier` |
| `loadSessionsFromFile(path)` | Load sessions from JSON (Node.js only) |
| `agent.run(question, onProgress?)` | Execute a session, returns `{ answer, steps, matchedSession }` |
| `agent.listSessions()` | List available sessions |

---

## MCP E2E Tests

E2E tests verify `MCPClientCore` against real MCP server processes over stdio.

### Fake MCP server

Source: `packages/ai-common/src/mcp/test-fixtures/fake-mcp-server.mjs`

Built with `@modelcontextprotocol/sdk`. Exposes two tools over stdio:

| Tool | Behaviour |
|------|-----------|
| `greet(name)` | Returns `"Hello, <name>!"` |
| `add(a, b)` | Returns `{ sum: a + b }` |

Flags: `--slow` (2 s delay on `add`), `--fail` (`add` always throws).

### Test files

| File | Scope |
|------|-------|
| `mcp.e2e.test.ts` | `MCPClientCore` lifecycle, tool execution, config updates, tool state (14 tests) |
| `cli-mcp.e2e.test.ts` | CLI with MCP servers: process cleanup, multi-server (4 tests) |

Excluded from normal unit-test runs; requires the e2e Vitest config.

### Running

```bash
packages/ai-common
npx vitest run --config vitest.e2e.config.ts                          # all e2e
npx vitest run --config vitest.e2e.config.ts src/mcp/mcp.e2e.test.ts  # MCP only
```

### Test patterns

- **In-memory `MCPSettingsProvider`** — stores settings in a local variable (no filesystem/Electron).
- **Confirmation handlers** — `autoApproveHandler()` and `autoDenyHandler()` control config-change prompts.
- **Temp directories** — each test creates a `mkdtempSync` dir for `MCPToolStateStore` and cleans up in `afterEach`.
- **Always call `core.cleanup()`** — terminates MCP child processes.
- **30 s timeouts** — server startup can take a few seconds.

---

## KWOK Demo Walkthrough

End-to-end demonstration of the AI Assistant running against a [KWOK](https://kwok.sigs.k8s.io/) fake cluster with mock testing model and skills from GitHub repos.

### What this demonstrates

| Component | Status | Notes |
|-----------|--------|-------|
| KWOK cluster | ✅ Works | Fake node, pods, deployments via `kwokctl` |
| Mock Testing Model | ✅ Works | `createMockTestingModel()` responds in Chat mode |
| Skills from Git Repos | ✅ Works | 7 well-known repos available, toggleable in settings |
| MCP Servers | ⚠️ Desktop only | MCP requires Electron IPC (stdio transport) |
| Holmes Agent | ⚠️ Needs service | Requires HolmesGPT K8s service running in cluster |

### 1. Create KWOK cluster

```bash
kwokctl create cluster --name headlamp-test --runtime binary
kubectl --context kwok-headlamp-test create namespace demo
kubectl --context kwok-headlamp-test -n demo create deployment nginx --image=nginx --replicas=3
kubectl --context kwok-headlamp-test -n demo create deployment redis --image=redis --replicas=1
```

### 2. Build and run Headlamp

```bash
# Build backend
cd backend && go build -o headlamp-server ./cmd

# Build frontend
cd frontend && npm install && npm run build

# Build plugin (from the ai-assistant root)
npm install && npx @kinvolk/headlamp-plugin build

# Copy plugin
mkdir -p /tmp/headlamp-plugins/ai-assistant
cp dist/main.js package.json /tmp/headlamp-plugins/ai-assistant/

# Start server
HEADLAMP_BACKEND_TOKEN=headlamp ./backend/headlamp-server \
  -listen-addr=localhost -port=4466 \
  -kubeconfig=$HOME/.kube/config \
  -html-static-dir=frontend/build \
  -plugins-dir=/tmp/headlamp-plugins
```

### 3. Configure AI Assistant

1. Open http://localhost:4466
2. Click AI Assistant icon (sparkle) → Settings gear
3. Add Provider → select "Mock Testing Model" → Save
4. Enable skills repos in the Skills section
5. Switch to "Chat" mode in the AI panel

### Screenshots

| Screenshot | Description |
|-----------|-------------|
| ![Cluster Overview](screenshots/12-cluster-overview-kwok.png) | KWOK cluster with fake node, pods, and AI panel |
| ![Mock Model Chat](screenshots/14-mock-model-chat-pods-view.png) | Chat mode with `testing-model-default` |
| ![Provider Config](screenshots/05-mock-model-configured.png) | Mock Testing Model configured as default |
| ![Skills Repos](screenshots/06-skills-repos-enabled.png) | Well-known skill repos with Flux enabled |
| ![Settings](screenshots/01-headlamp-initial.png) | Full settings page |

### Running tests programmatically

```bash
# MCP e2e tests (14 tests)
packages/ai-common
npx vitest run --config vitest.e2e.config.ts src/mcp/mcp.e2e.test.ts

# Mock testing model tests (34 tests)
npx vitest run src/mock-testing-model/MockTestingModel.test.ts

# Mock testing agent tests (14 tests)
npx vitest run src/mock-testing-agent/MockTestingAgent.test.ts

# MCP tool routing tests (34 tests)
npx vitest run src/mcp/MCPToolRouter.test.ts src/mcp/MCPEmbeddingRouter.test.ts
```

### Limitations

- **MCP servers** require Electron desktop app for stdio transport
- **Holmes Agent mode** requires a running HolmesGPT service in the cluster
- **KWOK pods stay Pending** because the fake node has a `NoSchedule` taint (expected)
- **Mock model fallback** returns a generic message when no fixture matches
