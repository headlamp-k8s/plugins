# Proposals: Backend runCommand, MCP Across All Modes, and Terminal Access

## Overview

Three related proposals for extending Headlamp's command/tool execution beyond Electron:

1. **Backend runCommand** — HTTP-based `runCommand` through the Go backend (headless + in-cluster)
2. **MCP across all modes** — MCP tool execution in desktop, headless, in-cluster, and CLI
3. **Terminal access** — Interactive shell via WebSocket on the backend server

All three share a common security model: permission secrets, backend token auth, and user consent.

---

## Shared Security Model

Today `runCommand` only works in Electron via IPC. The security layers translate directly to HTTP:

| Layer | Electron (today) | Backend (proposed) |
|-------|-------------------|-------------------|
| **Plugin isolation** | Random permission secrets per command, distributed via IPC | Same secrets, distributed via `GET /api/v1/run-command/secrets` |
| **Caller auth** | IPC (implicit — only renderer can call) | `X-HEADLAMP_BACKEND-TOKEN` header (headless) or Bearer/OIDC (in-cluster) |
| **Command allowlist** | `['minikube', 'az', 'scriptjs']` | Same, validated server-side |
| **User consent** | Electron native dialog | Terminal prompt (headless) / COOP popup (no terminal) / Helm pre-approval (in-cluster) |
| **Script path validation** | Resolves to plugins directory | Same |

### Permission Secret Flow

```
Plugin loader (getAllowedPermissions)
      │
      ├─ @headlamp-k8s/minikube  → gets runCmd-minikube secret
      ├─ @headlamp-k8s/ai-assistant → gets mcp-execute, mcp-tools secrets
      └─ other-plugin → gets nothing
```

Only the plugin that is granted a secret can call the corresponding endpoint. A malicious plugin cannot forge the secret.

---

## 1. Backend runCommand

### Architecture

```
Plugin code                    Go backend (/api/v1/run-command)
──────────                     ────────────────────────────────
pluginRunCommand('minikube',   ──HTTP──►  handleRunCommand()
  ['status'], {})                          │
                                           ├─ checkPermissionSecret
                                           ├─ checkHeadlampBackendToken
                                           ├─ validateCommand (allowlist)
                                           ├─ checkConsent
                                           │
                                           └─ exec.Command(...)
                                                │
stdout/stderr/exit  ◄──SSE─────────────────────┘
```

### API Endpoints

```
POST /api/v1/run-command/start     → { id }
GET  /api/v1/run-command/{id}/stream  → SSE (stdout/stderr/exit events)
POST /api/v1/run-command/{id}/input   → stdin to running command
GET  /api/v1/run-command/consent      → check pre-approval
POST /api/v1/run-command/consent      → record user decision
```

### Mode Gating

- `!useInCluster` (headless): stdio commands allowed — user's machine, same trust as Electron
- `useInCluster`: stdio disabled by default (security risk in shared pod). Admin can opt-in via Helm.

---

## 2. MCP Across All Runtime Modes

### Problem

MCP currently only works in Electron (IPC + stdio). It needs to work everywhere:

| Mode | Transport | stdio? |
|------|-----------|--------|
| **Desktop** (Electron) | Electron IPC → stdio | ✅ |
| **Headless** (`--headless`) | Go backend → stdio or HTTP | ✅ |
| **In-cluster** (K8s pod) | Go backend → HTTP/HTTPS only | ❌ |
| **CLI** (`headlamp-ai`) | In-process | ✅ |

### Architecture

```
Desktop app          Headless                In-cluster             CLI
─────────────        ────────                ──────────             ─────
ElectronMCPClient    HTTPMCPClient           HTTPMCPClient          Direct
      │                    │                      │                   │
  Electron IPC        Go backend              Go backend          In-process
      │              /api/v1/mcp/*           /api/v1/mcp/*             │
 stdio child         ┌─────┴──────┐         ┌─────┴──────┐      stdio child
 processes           │            │         │            │      processes
               stdio child   HTTP/SSE    HTTP/SSE     Streamable
               processes     servers     servers      HTTP servers
```

### Key Design Decisions

1. Plugin auto-detects mode: `window.desktopApi` → `ElectronMCPClient`, else → `HTTPMCPClient`
2. Headless: Go backend spawns stdio (same machine, single-user trust) AND connects to HTTP servers
3. In-cluster: HTTP/HTTPS only — no child process spawning
4. Config source: Helm ConfigMap (in-cluster) or local settings file (headless)
5. Plugin isolation via permission secrets — only ai-assistant gets MCP access

### Go Backend MCP Endpoints

```
POST /api/v1/mcp/tools     → list tools from configured MCP servers
POST /api/v1/mcp/execute   → execute a tool (with approval check)
GET  /api/v1/mcp/status    → connection status
POST /api/v1/mcp/reset     → reconnect to MCP servers
```

### Transport Support

| Transport | Desktop | Headless | In-Cluster | CLI |
|-----------|---------|----------|------------|-----|
| stdio | ✅ | ✅ | ❌ | ✅ |
| SSE | ❌ | ✅ | ✅ | ❌ |
| Streamable HTTP | ❌ | ✅ | ✅ | ❌ |

### Helm Configuration

```yaml
ai:
  mcp:
    enabled: false
    servers:
      - name: "my-mcp-server"
        url: "https://mcp-server.internal:8080/sse"
        transport: "sse"
        enabled: true
    preApprovedTools: []
    rateLimit: 60
    timeoutSeconds: 120
  provider: ""
  model: ""
  apiKeySecret: ""    # K8s Secret name
  baseUrl: ""
```

### Why MCP Cannot Use runCommand

The execution models are fundamentally different:

| | runCommand | MCP |
|---|-----------|-----|
| Process lifetime | Short (run → exit) | Long (session duration) |
| Protocol | Raw text streams | JSON-RPC over stdin/stdout |
| Multiplexing | None | Concurrent requests via IDs |
| HTTP servers | Not supported | Required for in-cluster |

**Share the security model (permission secrets, consent, audit), not the execution path.** The Go backend has two subsystems (`runCommandHandler` + `mcpHandler`) behind a common auth layer.

### STRIDE Security Analysis

| Threat | Category | Mitigation |
|--------|----------|------------|
| Unauthenticated MCP call | Spoofing | Bearer/OIDC (in-cluster) or `HEADLAMP_BACKEND_TOKEN` (headless) |
| Malicious MCP server added | Tampering | Config is read-only from frontend; requires Helm upgrade (in-cluster) |
| Tool argument injection | Tampering | Validate against tool `inputSchema` |
| Unaudited tool execution | Repudiation | Structured JSON logs with user identity |
| API keys leaked to browser | Info Disclosure | Keys in K8s Secrets, backend-only access |
| Tool call flooding | DoS | Per-user rate limit (default 60/min) |
| Prompt injection triggers tools | EoP | Tool approval flow; write tools require explicit consent |

OWASP mappings: LLM-01 (Prompt Injection), LLM-06 (Excessive Agency), MCP-02 (Privilege Escalation), MCP-05 (Command Injection).

---

## 3. Consent UI Security

### Why It Matters

Without consent, any plugin with a valid permission secret could silently run commands. Consent adds user awareness as defense-in-depth.

### Approaches Evaluated

| Approach | Secure? | Why |
|----------|---------|-----|
| In-page React dialog | ❌ | Plugin can call API directly, DOM-manipulate the dialog, or override `window.fetch` |
| Same-origin popup (no COOP) | ❌ | Same origin = plugin has full DOM access to popup |
| Cross-origin popup (different port) | ✅ | SOP isolates; popup immune to clickjacking |
| **Same-port COOP popup** | ✅ | COOP severs opener; Sec-Fetch blocks programmatic access; nonce prevents direct approval |
| Terminal prompt (headless) | ✅ | Outside browser context entirely |
| Admin pre-approval (in-cluster) | ✅ | No runtime consent; unapproved = 403 |

### Recommended: Same-Port COOP Popup

```
Main app (:4466)                    Consent handler (same :4466)
───────────────                     ────────────────────────────
1. Plugin requests command
   → Backend returns 202 + consentId

2. UI shows "Click to review"
   → window.open('/consent/{id}')
   (user gesture = popup allowed)
                                    3. Server checks Sec-Fetch:
                                       Sec-Fetch-Dest: document ✓
                                       Sec-Fetch-Mode: navigate ✓
                                       → Serves page with COOP + nonce

                                    4. COOP severs opener relationship

                                    5. User clicks Approve
                                       → POST with nonce
                                       → Validated → recorded → popup closes

6. Plugin polls → consent recorded
   → Command executes
```

**Security layers:**

| Layer | What it stops |
|-------|---------------|
| Sec-Fetch filtering | `fetch()`, XHR, `<iframe>` — only top-level navigation served |
| COOP (`same-origin`) | Parent reading popup DOM via `window.opener` |
| Server-side nonce | Direct POST to approve endpoint |
| SW registration blocking | Service Worker interception |

**Proof of Concept:** See [`consent-poc/`](./consent-poc/) — 159 Playwright tests across Chromium, Firefox, and WebKit validating all security layers plus a deliberately-vulnerable twin as negative control.

### Consent Per Mode

| Mode | Consent mechanism |
|------|-------------------|
| Desktop | Electron native dialog (unchanged) |
| Headless (terminal visible) | stdin/stdout prompt |
| Headless (no terminal) | COOP popup |
| In-cluster | Admin pre-approval via Helm; unapproved = 403 |

---

## 4. Terminal Access (WebSocket)

Interactive shell on the backend server via WebSocket. Reuses existing Headlamp infrastructure:

| Existing component | Reuse |
|-------------------|-------|
| XTerm.js (`Terminal.tsx`) | Same component, different WebSocket URL |
| Channel protocol (`useTerminalStream.ts`) | Direct reuse (StdIn/Out/Err/Resize channels) |
| WebSocket streaming (`streamingApi.ts`) | Direct reuse |

### Why WebSocket (not SSE)

| Property | WebSocket | SSE + POST |
|----------|-----------|------------|
| Latency per keystroke | 1 message | 1 HTTP POST |
| Bidirectional | Native | Emulated |
| Existing infra | ✅ Already used for pod exec | ❌ New |

### Security

- **Opt-in**: Disabled by default (`--enable-terminal` or Helm `terminal.enabled: true`)
- **Consent**: Same COOP popup mechanism
- **Audit**: All sessions logged with user identity, start/end time
- **In-cluster**: Disabled by default (runs on Headlamp pod, not cluster nodes)
- **Session timeout**: Auto-close after idle timeout (default 30 min)

---

## Implementation Phases

| Phase | Scope | Effort |
|-------|-------|--------|
| 1 | `MCPClientInterface` abstraction | Small |
| 2 | Go backend MCP proxy (core work) | Medium |
| 3 | `HTTPMCPClient` for browser | Small |
| 4 | Backend runCommand endpoints | Medium |
| 5 | Frontend HTTP fallback for runCommand | Small |
| 6 | Consent: terminal prompt (headless) | Small |
| 7 | Consent: COOP popup | Medium |
| 8 | Helm/ConfigMap configuration | Small |
| 9 | Terminal WebSocket endpoint | Small |

---

## Open Questions

1. **Per-user vs shared MCP config in-cluster** — Shared ConfigMap (simpler, admin-controlled) vs per-user stored in backend?
2. **AI provider proxy** — Should the backend proxy all AI API calls (keys server-side) or let the frontend call providers directly?
3. **In-cluster runCommand** — Disabled entirely, or configurable per-command?
4. **Terminal scope** — Full shell or restricted commands? Could offer both modes.
