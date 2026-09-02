# STRIDE Threat Model: MCP Integration

## 1. System Overview

The MCP (Model Context Protocol) integration allows the AI Assistant to connect to external tool servers via the MCP standard. MCP servers are spawned as local processes by the Electron main process and communicate over stdio pipes. The AI Assistant discovers available tools, validates arguments, and executes tools on behalf of the user during chat interactions.

### Components

| Component | Location | Role |
|-----------|----------|------|
| **MCPClientCore** | `ai-common/src/mcp/MCPClientCore.ts` | Platform-agnostic client: initialize servers, discover tools, execute with validation |
| **MCPToolStateStore** | `ai-common/src/mcp/MCPToolStateStore.ts` | Per-tool enabled state and usage statistics, persisted to `mcp-tools-config.json` |
| **mcpServerConfig** | `ai-common/src/mcp/mcpServerConfig.ts` | Server config builder, env var expansion, tool argument validation |
| **MCPClient** | `app/electron/mcp/MCPClient.ts` | Electron main process wrapper, IPC handlers, confirmation dialogs |
| **ElectronMCPClient** | `ai-ui/src/mcp/electron-client.ts` | Renderer process IPC bridge via `window.desktopApi.mcp` |
| **MCPSettings** | `ai-ui/src/components/settings/MCPSettings.tsx` | Settings UI for server management |
| **MCPServerEditor** | `ai-ui/src/components/settings/MCPServerEditor.tsx` | Form dialog for adding/editing servers |
| **MCPConfigEditorDialog** | `ai-ui/src/components/settings/MCPConfigEditorDialog.tsx` | JSON editor for direct config editing |
| **MultiServerMCPClient** | `@anthropic-ai/sdk` (external) | MCP SDK client that spawns and communicates with server processes |

### Data Flow

```
User configures MCP server (name, command, args, env)
        │
        ▼
  MCPSettings UI (renderer)
        │
        ├── Form-based: MCPServerEditor
        │   └── validateServer() — name, command non-empty, unique name
        │
        └── JSON-based: MCPConfigEditorDialog
            └── validateConfig() — type checking, structure validation
        │
        ▼
  IPC: desktopApi.mcp.updateConfig()
        │
        ▼
  MCPClient (Electron main process)
        │
        ├── MCPConfirmationHandler.confirmSettingsChange()
        │   └── Native dialog: shows changes, requires user approval
        │
        ├── MCPSettingsProvider.saveMCPSettings()
        │   └── Writes to settings.json on disk
        │
        └── MCPClientCore.initialize()
            │
            ├── makeMcpServers(mcpSettings, clusters)
            │   ├── expandEnvAndResolvePaths(args, cluster)
            │   │   └── Replaces HEADLAMP_CURRENT_CLUSTER placeholder
            │   └── Inherits process.env + server.env
            │
            └── MultiServerMCPClient
                └── Spawns server process (stdio transport)
                    │
                    ▼
              External MCP Server Process
              (runs with Electron's privileges)
```

```
AI Assistant decides to use a tool
        │
        ▼
  MCPClientCore.executeTool(toolName, args, toolCallId)
        │
        ├── MCPToolStateStore.isToolEnabled() — check tool is enabled
        ├── validateToolArgs(schema, args) — JSON schema validation
        │
        ▼
  MultiServerMCPClient.callTool()
        │
        ▼
  MCP Server Process (stdio)
        │
        ▼
  Tool result returned to AI Assistant
```

### Trust Boundaries

1. **User ↔ Settings UI** — user-provided server configuration (command, args, env)
2. **Renderer ↔ Electron Main Process** — IPC bridge (`desktopApi.mcp.*`)
3. **Electron ↔ Filesystem** — settings.json and mcp-tools-config.json
4. **Electron ↔ MCP Server Process** — stdio pipes, process spawning
5. **MCP Server ↔ External Systems** — server may access APIs, databases, clusters
6. **AI Assistant ↔ Tool Results** — tool output fed back into LLM context

---

## 2. STRIDE Analysis

### S — Spoofing

#### S1: Malicious MCP Server Impersonation

| | |
|---|---|
| **Threat** | A user could be tricked into configuring a malicious MCP server that impersonates a legitimate one (e.g., a fake `flux-operator-mcp` binary placed in `$PATH`). The server would have full access to execute commands and return fabricated results to the AI Assistant. |
| **Mitigation** | The command path is user-configured. No binary verification, signature checking, or path validation is performed. |
| **Risk** | **High** — relies entirely on user judgment. |
| **Fix** | Warn when command is not an absolute path. Consider binary hash verification. Show the resolved command path in the confirmation dialog. |

#### S2: IPC Channel Spoofing

| | |
|---|---|
| **Threat** | A compromised renderer process or browser extension could invoke `window.desktopApi.mcp.*` methods to execute tools, change settings, or enumerate available tools without user awareness. |
| **Mitigation** | `desktopApi.mcp` is pre-loaded by Electron's preload script. Electron's `contextIsolation` prevents direct access to Node.js APIs from the renderer. |
| **Risk** | **Low** — requires XSS or compromised renderer. |
| **Fix** | Validate IPC message origins. Rate-limit IPC calls. Log IPC invocations for audit. |

#### S3: Tool Response Spoofing

| | |
|---|---|
| **Threat** | A compromised MCP server could return fabricated tool results that mislead the AI Assistant and user. For example, returning fake cluster health data or fabricated resource listings. |
| **Mitigation** | None — tool results are trusted as-is. |
| **Risk** | **Medium** — depends on user trust in the configured server. |
| **Fix** | Display MCP server attribution alongside tool results. Allow users to inspect raw tool output. |

---

### T — Tampering

#### T1: Command Injection via Server Configuration

| | |
|---|---|
| **Threat** | The `command` and `args` fields in MCP server configuration are passed directly to process spawning without sanitization. A malicious or careless configuration could include shell metacharacters, path traversal sequences, or argument injection payloads. |
| **Mitigation** | `MCPServerEditor` validates that name and command are non-empty. `MCPConfigEditorDialog` checks types. **Neither validates command content, shell metacharacters, or path traversal.** |
| **Risk** | **High** — the command is executed with full process privileges. |
| **Fix** | Validate command against an allowlist or known paths. Reject shell metacharacters (`|`, `;`, `&`, `` ` ``, `$()`) in command and args. Use `execFile` instead of shell-based execution. |

#### T2: Environment Variable Injection

| | |
|---|---|
| **Threat** | MCP servers inherit `process.env` merged with server-specific `env` variables. A malicious server config could override security-sensitive environment variables (e.g., `PATH`, `LD_PRELOAD`, `NODE_OPTIONS`, `KUBECONFIG`) to alter behavior of the spawned process or the host. |
| **Mitigation** | Environment variables are user-configured and persisted as-is. No filtering or validation of variable names or values. |
| **Risk** | **High** — can hijack process execution behavior. |
| **Fix** | Block override of sensitive env vars (`PATH`, `HOME`, `LD_PRELOAD`, `NODE_OPTIONS`, etc.). Warn when security-sensitive variables are set. |

#### T3: Settings File Tampering

| | |
|---|---|
| **Threat** | `settings.json` and `mcp-tools-config.json` are written to disk without integrity protection. Malware or a compromised process could modify these files to add malicious MCP servers, enable dangerous tools, or change server commands. |
| **Mitigation** | Files use standard filesystem permissions. Settings changes require user confirmation via dialog. |
| **Risk** | **Medium** — confirmation only applies to UI-initiated changes, not direct file modification. |
| **Fix** | Verify settings integrity on load (checksum or signature). Re-confirm with user when settings differ from last known state. |

#### T4: Tool Argument Tampering

| | |
|---|---|
| **Threat** | `validateToolArgs()` performs basic type checking but does not validate enum constraints, string patterns, or deeply nested structures. A prompt injection attack could cause the AI to pass malicious arguments that pass validation but exploit the tool. |
| **Mitigation** | Schema validation checks required fields and basic types. Returns `valid: true` on unknown schema types. |
| **Risk** | **Medium** — depends on what the tool does with the arguments. |
| **Fix** | Enforce enum constraints. Add string pattern validation. Reject unknown schema types instead of accepting them. |

#### T5: HEADLAMP_CURRENT_CLUSTER Placeholder Injection

| | |
|---|---|
| **Threat** | The `expandEnvAndResolvePaths()` function replaces `HEADLAMP_CURRENT_CLUSTER` with the current cluster name. If the cluster name contains shell metacharacters or path traversal sequences, these are injected into the command arguments unsanitized. |
| **Mitigation** | Cluster names are typically alphanumeric, but no validation is enforced at the replacement point. |
| **Risk** | **Medium** — cluster names are usually controlled by the user, but could come from kubeconfig files from untrusted sources. |
| **Fix** | Sanitize the cluster name before substitution (strip shell metacharacters, validate against K8s naming conventions). |

---

### R — Repudiation

#### R1: No Audit Log of MCP Tool Executions

| | |
|---|---|
| **Threat** | MCP tool executions are not logged. A compromised AI flow could execute tools (reading sensitive data, modifying resources) with no record of what was executed, with what arguments, or what was returned. |
| **Mitigation** | `MCPToolStateStore` records `usageCount` and `lastUsed` per tool, but not individual execution details (arguments, results, timestamps). |
| **Risk** | **Medium** |
| **Fix** | Log each tool execution with: tool name, server name, sanitized arguments, result summary, timestamp, and whether it was user-initiated or AI-initiated. |

#### R2: No Audit Log of Settings Changes

| | |
|---|---|
| **Threat** | MCP settings changes (adding/removing servers, changing commands, modifying env vars) are not logged. Changes made via direct file modification bypass the confirmation dialog entirely with no trace. |
| **Mitigation** | The confirmation dialog shows changes before applying, but the acceptance is not recorded. |
| **Risk** | **Medium** |
| **Fix** | Log settings change events with before/after state. Detect and log file-level tampering on load. |

---

### I — Information Disclosure

#### I1: Sensitive Environment Variables in Settings

| | |
|---|---|
| **Threat** | MCP server environment variables may contain API keys, tokens, credentials, and paths. These are stored in plaintext in `settings.json` on disk and transmitted over IPC to the renderer process. |
| **Mitigation** | None — values are stored and transmitted as plaintext. |
| **Risk** | **High** — credentials at rest and in transit within the app. |
| **Fix** | Encrypt sensitive env var values at rest. Use the OS keychain for credential storage. Mask values in the UI. Never log env var values. |

#### I2: Tool Results Exposed to LLM Provider

| | |
|---|---|
| **Threat** | MCP tool results are fed back into the AI Assistant's conversation context and sent to the external LLM provider. Tool results may contain sensitive cluster data, secrets, credentials, or internal service details. |
| **Mitigation** | Users control which tools are enabled. Tool results are part of the normal AI conversation flow. |
| **Risk** | **High** — tool results routinely contain sensitive operational data. |
| **Fix** | Document that tool results are sent to the LLM provider. Allow result filtering/redaction before sending to LLM. Show tool results to user before including in context. |

#### I3: Error Messages Expose Internal Details

| | |
|---|---|
| **Threat** | Tool execution errors, initialization failures, and validation errors may expose internal paths, stack traces, server configuration details, or environment variable names to the renderer UI. |
| **Mitigation** | Errors are caught and displayed in the UI. |
| **Risk** | **Low** — primarily a local information disclosure. |
| **Fix** | Sanitize error messages before displaying. Remove file paths and stack traces from user-facing errors. |

#### I4: Tool Schemas Expose Server Capabilities

| | |
|---|---|
| **Threat** | Tool input schemas and descriptions are exposed to the renderer and the LLM. These could reveal internal API structures, capabilities, or attack surface of the MCP server. |
| **Mitigation** | Schemas are provided by the MCP server for its advertised tools. |
| **Risk** | **Low** — schemas are designed to be public. |
| **Fix** | No action needed — this is by design. |

---

### D — Denial of Service

#### D1: MCP Server Process Exhaustion

| | |
|---|---|
| **Threat** | A malicious or buggy MCP server could consume excessive CPU, memory, or file descriptors, degrading the desktop application's performance or causing crashes. |
| **Mitigation** | No resource limits on spawned MCP server processes. |
| **Risk** | **High** — directly impacts application availability. |
| **Fix** | Set resource limits on spawned processes (memory, CPU). Monitor process health. Allow force-killing unresponsive servers. Add a watchdog timer for server initialization. |

#### D2: Hanging Tool Execution

| | |
|---|---|
| **Threat** | A tool call could hang indefinitely, blocking the AI Assistant's response flow. |
| **Mitigation** | Tool execution has a hardcoded 2-minute timeout. |
| **Risk** | **Medium** — timeout exists but is not configurable. |
| **Fix** | Make timeout configurable per-server. Show progress/cancel UI during long-running tool calls. |

#### D3: Large Tool Response Payloads

| | |
|---|---|
| **Threat** | A tool could return extremely large responses (e.g., full log dumps, large JSON payloads) that overwhelm memory or the LLM context window. |
| **Mitigation** | No response size limits. |
| **Risk** | **Medium** |
| **Fix** | Enforce maximum response size. Truncate or paginate large responses. Warn user when response exceeds threshold. |

#### D4: Synchronous File Writes Block Event Loop

| | |
|---|---|
| **Threat** | `MCPToolStateStore` uses synchronous file writes (`writeFileSync`) to persist tool state. Under heavy tool usage, this blocks the Electron main process event loop. |
| **Mitigation** | Writes occur on state changes (enablement, usage recording), not on every tool call. |
| **Risk** | **Low** — state changes are infrequent. |
| **Fix** | Use asynchronous file writes. Debounce writes to batch rapid changes. |

#### D5: Excessive Server Configuration

| | |
|---|---|
| **Threat** | No limit on the number of MCP servers or tools that can be configured. A large number of servers could exhaust system resources during initialization. |
| **Mitigation** | None. |
| **Risk** | **Low** — practically limited by user configuration. |
| **Fix** | Cap the number of servers (e.g., 20). Warn when many servers are configured. |

---

### E — Elevation of Privilege

#### E1: MCP Server Processes Run with Full Electron Privileges

| | |
|---|---|
| **Threat** | MCP server processes are spawned by the Electron main process and inherit its full privileges. A malicious MCP server can access the filesystem, network, and all system resources available to the desktop application. This includes reading `settings.json` (which contains API keys), accessing the user's kubeconfig, and executing arbitrary commands. |
| **Mitigation** | None — no sandboxing or privilege restriction on spawned processes. |
| **Risk** | **Critical** — this is the primary attack surface. |
| **Fix** | Run MCP servers in sandboxed containers or restricted subprocess environments. Apply filesystem and network access policies. Use OS-level sandboxing (seccomp, AppArmor, macOS sandbox). |

#### E2: Arbitrary Command Execution via Configuration

| | |
|---|---|
| **Threat** | The MCP server `command` field accepts any executable path. A user who is tricked into importing a malicious MCP configuration (e.g., via a shared config file or social engineering) gains arbitrary command execution. |
| **Mitigation** | Settings changes require user confirmation via dialog. The dialog shows the command being added. |
| **Risk** | **High** — confirmation dialog relies on user vigilance. |
| **Fix** | Maintain a command allowlist or require explicit approval per binary. Show security warnings for unfamiliar commands. Require re-confirmation when commands change. |

#### E3: Prompt Injection → Tool Execution

| | |
|---|---|
| **Threat** | A prompt injection attack (via user input, skill content, or MCP tool response) could instruct the AI to execute MCP tools with malicious arguments. Since MCP tools can perform system operations, this creates an escalation path from prompt injection to system compromise. |
| **Mitigation** | Tool calls go through the AI Assistant's approval flow. Tool arguments are validated against schemas. |
| **Risk** | **High** — depends on user vigilance in approval dialogs and schema strictness. |
| **Fix** | Show full tool arguments in approval dialogs. Flag unusual argument patterns. Require explicit user approval for destructive operations. Never auto-approve tool calls. |

#### E4: Docker Volume Mount Path Traversal

| | |
|---|---|
| **Threat** | `expandEnvAndResolvePaths()` handles Docker volume mount format and converts Windows paths. Path resolution could be exploited to mount unintended directories into Docker containers if the MCP server uses Docker. |
| **Mitigation** | Path conversion is mechanical (backslash to forward slash, drive letter handling). |
| **Risk** | **Medium** — requires Docker-based MCP server and crafted path arguments. |
| **Fix** | Validate resolved paths stay within expected boundaries. Reject path traversal sequences (`../`). |

#### E5: Auto-Approve Bypass

| | |
|---|---|
| **Threat** | The `MCPSettings` UI has an `autoApprove` toggle for servers. If implemented, this would bypass the confirmation flow for tool executions, removing the last line of defense against prompt-injection-driven tool abuse. |
| **Mitigation** | The `autoApprove` field appears in UI code but may not be fully implemented in `MCPClientCore`. |
| **Risk** | **High** (when implemented) — removes confirmation safety net. |
| **Fix** | Never auto-approve destructive operations. If auto-approve is needed, restrict to read-only tools only. Require per-tool opt-in rather than per-server. Log all auto-approved executions. |

---

## 3. Summary

| ID | Category | Threat | Severity | Status |
|----|----------|--------|----------|--------|
| **E1** | EoP | MCP servers run with full Electron privileges | **Critical** | ❌ Not mitigated |
| **S1** | Spoofing | Malicious MCP server impersonation | **High** | ❌ Not mitigated |
| **T1** | Tampering | Command injection via server config | **High** | ❌ Not mitigated |
| **T2** | Tampering | Environment variable injection | **High** | ❌ Not mitigated |
| **I1** | Info Disclosure | Sensitive env vars in plaintext settings | **High** | ❌ Not mitigated |
| **I2** | Info Disclosure | Tool results exposed to LLM provider | **High** | ⚠️ By design — needs documentation |
| **D1** | DoS | MCP server process exhaustion | **High** | ❌ Not mitigated |
| **E2** | EoP | Arbitrary command execution via config | **High** | ⚠️ Partial (confirmation dialog) |
| **E3** | EoP | Prompt injection → tool execution | **High** | ⚠️ Partial (approval flow + schema validation) |
| **E5** | EoP | Auto-approve bypass | **High** (future) | ⚠️ Not fully implemented |
| **S3** | Spoofing | Tool response spoofing | **Medium** | ❌ Not mitigated |
| **T3** | Tampering | Settings file tampering | **Medium** | ⚠️ Partial (confirmation for UI changes) |
| **T4** | Tampering | Tool argument validation gaps | **Medium** | ⚠️ Partial (basic type checking) |
| **T5** | Tampering | HEADLAMP_CURRENT_CLUSTER injection | **Medium** | ❌ Not mitigated |
| **R1** | Repudiation | No audit log of tool executions | **Medium** | ⚠️ Partial (usage count only) |
| **R2** | Repudiation | No audit log of settings changes | **Medium** | ❌ Not mitigated |
| **D2** | DoS | Hanging tool execution | **Medium** | ⚠️ Partial (2-min timeout) |
| **D3** | DoS | Large tool response payloads | **Medium** | ❌ Not mitigated |
| **E4** | EoP | Docker volume mount path traversal | **Medium** | ❌ Not mitigated |
| **S2** | Spoofing | IPC channel spoofing | **Low** | ✅ Mitigated (contextIsolation) |
| **I3** | Info Disclosure | Error messages expose internals | **Low** | ❌ Not mitigated |
| **I4** | Info Disclosure | Tool schemas expose capabilities | **Low** | ✅ Acceptable (by design) |
| **D4** | DoS | Synchronous file writes | **Low** | ⚠️ Infrequent occurrence |
| **D5** | DoS | Excessive server configuration | **Low** | ❌ Not mitigated |

## 4. Recommended Actions (Priority Order)

### 1. Sandbox MCP server processes (E1) — CRITICAL
- Run MCP servers in sandboxed environments (containers, restricted subprocesses)
- Apply filesystem and network access policies
- Use OS-level sandboxing mechanisms (seccomp, AppArmor, macOS sandbox)
- Restrict inherited environment to minimum needed variables

### 2. Validate and restrict server commands (T1, S1, E2) — HIGH
- Validate command paths against allowlist or known locations
- Reject shell metacharacters in command and args fields
- Warn on non-absolute paths (reliance on `$PATH` resolution)
- Show resolved command path in confirmation dialog
- Consider binary hash verification for known MCP servers

### 3. Protect sensitive environment variables (T2, I1) — HIGH
- Block override of security-sensitive env vars (`PATH`, `HOME`, `LD_PRELOAD`, `NODE_OPTIONS`)
- Encrypt sensitive values at rest using OS keychain
- Mask values in the settings UI
- Never log env var values

### 4. Document tool result exposure to LLM (I2) — HIGH
- Clearly document that tool results are sent to the external LLM provider
- Allow result filtering/redaction before sending to LLM
- Show tool results to user before including in LLM context
- Recommend self-hosted LLM for sensitive environments

### 5. Add comprehensive audit logging (R1, R2) — MEDIUM
- Log each tool execution with: tool name, server, sanitized args, result summary, timestamp
- Log settings change events with before/after diff
- Detect and log settings file tampering on load

### 6. Harden tool argument validation (T4, E3) — MEDIUM
- Enforce enum constraints in schema validation
- Add string pattern validation (regex)
- Reject unknown schema types instead of accepting
- Show full tool arguments in approval dialogs
- Flag unusual argument patterns

### 7. Add MCP server resource limits (D1, D2, D3) — MEDIUM
- Set memory and CPU limits on spawned processes
- Make tool execution timeout configurable per-server
- Enforce maximum response size with truncation
- Add server health monitoring with auto-restart

### 8. Sanitize HEADLAMP_CURRENT_CLUSTER substitution (T5) — MEDIUM
- Validate cluster name against K8s naming conventions before substitution
- Strip shell metacharacters from cluster names
- Escape the substituted value appropriately for the target context

### 9. Restrict auto-approve scope (E5) — HIGH (when implemented)
- Never auto-approve destructive operations
- Restrict to read-only tools only if auto-approve is needed
- Require per-tool opt-in rather than per-server blanket approval
- Log all auto-approved executions with full details

### 10. Protect settings file integrity (T3) — LOW
- Compute and verify settings file checksum on load
- Re-confirm with user when settings differ from last known state
- Consider file system monitoring for tampering detection
