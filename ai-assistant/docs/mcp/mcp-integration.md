# MCP Support in AI Assistant

The AI Assistant supports the [Model Context Protocol](https://modelcontextprotocol.io/) (MCP) to bring specialized expertise directly into the Kubernetes UI. MCP servers surface insights next to workloads and applications instead of in separate tools or terminals. Teams gain clarity without losing context, troubleshoot faster, and make better decisions in their day-to-day Kubernetes work.

## What Is MCP

The Model Context Protocol is an open standard that defines how an AI system connects to external tools and data through a consistent interface.

MCP uses a client-server model. The AI Assistant acts as the host and connects to one or more MCP servers. Each server exposes capabilities that the host can discover and use.

MCP servers can provide tools that perform actions, resources that supply data, and prompts that guide interactions. The host can list available capabilities and call them using structured inputs. Results are returned in a structured form.

## Why Use MCPs

Kubernetes teams often switch between dashboards, terminals, and scripts to understand what is happening. Each switch breaks focus and slows action.

With MCPs, expertise shows up where Kubernetes work already happens. Insight appears alongside pods, namespaces, and applications. Results stay tied to the resources on screen instead of being shown somewhere else.

This reduces context switching and makes investigations faster. It also makes answers easier to trust, since the insight is grounded in the same Kubernetes context you are viewing.

## Architecture

The MCP integration is composed of several layers:

```
┌─────────────────────────────────────────┐
│  Renderer Process (React Components)    │
│  ├─ MCPSettings          (settings UI)  │
│  ├─ MCPServerEditor      (add/edit)     │
│  ├─ MCPConfigEditorDialog (JSON editor) │
│  └─ ElectronMCPClient    (IPC bridge)   │
└────────────┬────────────────────────────┘
             │ IPC: desktopApi.mcp.*
             ▼
┌─────────────────────────────────────────┐
│  Electron Main Process                  │
│  ├─ MCPClient             (IPC handler) │
│  └─ MCPClientCore         (ai-common)   │
│     ├─ MCPSettingsProvider (settings.json)│
│     ├─ MCPToolStateStore  (tool config) │
│     └─ MultiServerMCPClient (MCP SDK)   │
└────────────┬────────────────────────────┘
             │ stdio pipes
             ▼
┌─────────────────────────────────────────┐
│  External MCP Server Processes          │
│  (flux-operator-mcp, kubectl, etc.)     │
└─────────────────────────────────────────┘
```

### Components

| Component | Package | Role |
|-----------|---------|------|
| **MCPClientCore** | `@headlamp-k8s/ai-common` | Platform-agnostic MCP client managing tool lifecycle and execution. Accepts injectable `MCPSettingsProvider` and `MCPConfirmationHandler` interfaces. |
| **MCPToolStateStore** | `@headlamp-k8s/ai-common` | Manages per-tool enabled state and usage statistics. Persists to `mcp-tools-config.json`. |
| **mcpServerConfig** | `@headlamp-k8s/ai-common` | Builds server configs, expands environment variables, validates tool arguments against JSON schemas. |
| **MCPClient** | `app/electron/mcp/` | Electron main process wrapper. Registers IPC handlers, creates settings provider and confirmation handler. |
| **ElectronMCPClient** | `@headlamp-k8s/ai-ui` | Renderer process bridge. Communicates with Electron main process via `window.desktopApi.mcp`. |
| **MCPSettings** | `@headlamp-k8s/ai-ui` | Settings UI for adding, editing, and managing MCP servers. |
| **MCPServerEditor** | `@headlamp-k8s/ai-ui` | Form dialog for adding/editing individual MCP server configurations. |
| **MCPConfigEditorDialog** | `@headlamp-k8s/ai-ui` | JSON editor dialog for direct configuration editing with schema validation. |

### Injectable Interfaces

The `MCPClientCore` in `ai-common` uses injectable interfaces to remain platform-agnostic:

- **`MCPSettingsProvider`** — Loads and saves MCP settings. The Electron implementation reads/writes `settings.json`.
- **`MCPConfirmationHandler`** — Presents confirmation dialogs to the user before applying config changes. The Electron implementation uses native dialog boxes.

## Requirements

- The desktop application — MCP server support is currently available only in the desktop application (Electron).
- The AI Assistant plugin enabled and at least one AI provider configured.
- Access to an MCP server that can run locally.

## Setting Up MCP Support

### Enable MCP Servers

1. Open **Settings**.
2. Go to **AI Assistant**.
3. Find the **MCP Servers** section.
4. Turn MCP servers on.

### Configuring MCP Servers

When adding a server you provide a name, a command, optional arguments, and any required environment variables. After you save, the application starts the server and discovers the tools it provides.

Each server is configured with:

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | A unique identifier for the server | `flux-operator` |
| **Command** | The executable to run | `flux-operator-mcp` |
| **Args** | Command-line arguments | `serve --kube-context HEADLAMP_CURRENT_CLUSTER` |
| **Environment Variables** | Optional env vars required by the server | `KUBECONFIG=/path/to/kubeconfig` |

**Note:** `HEADLAMP_CURRENT_CLUSTER` is a placeholder that gets replaced with the name of the currently selected cluster before running the command. It should only be referenced in the **Args** field.

You can configure servers using the form-based UI or by editing the JSON configuration directly via the config editor dialog.

### JSON Configuration Format

```json
{
  "enabled": true,
  "servers": [
    {
      "name": "flux-operator",
      "command": "flux-operator-mcp",
      "args": ["serve", "--kube-context", "HEADLAMP_CURRENT_CLUSTER"],
      "enabled": true,
      "env": {
        "KUBECONFIG": "/path/to/kubeconfig"
      }
    }
  ]
}
```

## Managing MCP Tools

Once a server is connected, the AI Assistant lists the tools it exposes.

- Enable or disable individual tools per server.
- View tool descriptions and input schemas.
- Track tool usage statistics (usage count, last used time).
- Use bulk operations to enable or disable all tools at once.

Tool state is persisted in `mcp-tools-config.json` and survives application restarts. New tools discovered from a server default to enabled.

### Tool Execution

When the AI Assistant decides to use an MCP tool:

1. The tool's enabled state is checked via `MCPToolStateStore`
2. Tool arguments are validated against the tool's JSON schema
3. The tool is executed via `MCPClientCore.executeTool()`
4. Results are returned to the AI Assistant for processing

Tool argument validation checks:
- Required parameters are present
- Type correctness (string, number, boolean, array, object)
- Schema compliance

### Cluster-Dependent Servers

Servers that use the `HEADLAMP_CURRENT_CLUSTER` placeholder in their arguments are automatically restarted when the active cluster changes. This ensures the MCP server always operates against the correct cluster context.

## Using MCPs in Chat

After setup, MCPs are used through normal chat prompts. For example:

- "What is happening with this deployment?"
- "Why is this workload out of sync?"
- "Show all Flux resources in this namespace."

The AI Assistant selects the right tool and presents results next to the Kubernetes resources you are already viewing.

## Programmatic Usage

### MCPClientCore

The core MCP client in `@headlamp-k8s/ai-common` can be used independently:

```typescript
import { MCPClientCore } from '@headlamp-k8s/ai-common/mcp/MCPClientCore';

const client = new MCPClientCore(settingsProvider, confirmationHandler);
await client.initialize();

// Get available tools
const tools = client.getTools();

// Execute a tool
const result = await client.executeTool('serverName__toolName', { arg1: 'value' }, 'call-id');
```

### ElectronMCPClient

The renderer-side bridge communicates with the Electron main process:

```typescript
import { ElectronMCPClient } from '@headlamp-k8s/ai-ui/mcp/electron-client';

const mcpClient = new ElectronMCPClient();
const tools = await mcpClient.getTools();
const result = await mcpClient.executeTool('toolName', args, 'call-id');
```

## Limitations

- MCP server support is currently available only in the desktop application (Electron).
- MCP servers must be available as local commands, since the desktop app runs them as local processes via stdio transport.
- Available tools depend on the servers you connect.
- No sandboxing — MCP server processes run with the same privileges as the Electron main process.
- Tool argument validation is schema-based but does not validate enum constraints or deeply nested structures.

## Security Considerations

- **Command execution**: MCP servers are spawned as local processes. Only configure servers you trust.
- **Environment variables**: Server environment variables may contain sensitive values (API keys, credentials). These are persisted in `settings.json`.
- **Tool approval**: Configuration changes require user confirmation via dialog before being applied.
- **Tool enablement**: Individual tools can be disabled to limit the AI Assistant's capabilities.
- **No sandboxing**: MCP server processes inherit the Electron main process environment and have full system access.

For a detailed security analysis, see the [MCP STRIDE Threat Model](mcp/mcp-stride-threat-model.md).

## References

- [Model Context Protocol specification](https://modelcontextprotocol.io/)
- [MCP TypeScript SDK](https://github.com/modelcontextprotocol/typescript-sdk)
