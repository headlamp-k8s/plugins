# STRIDE Threat Model: Holmes Integration

## 1. System Overview

The Holmes integration connects the AI Assistant to a [HolmesGPT](https://github.com/robusta-dev/holmesgpt) agent running in the user's Kubernetes cluster. Holmes provides enhanced diagnostic reasoning by analyzing cluster signals (logs, events, resource state) and returning natural-language explanations via the [AG-UI protocol](https://docs.ag-ui.com/).

### Components

| Component | Location | Role |
|-----------|----------|------|
| **HolmesAgent** | `ai-common/src/agent/holmesClient.ts` | AG-UI client wrapper — manages threads, messages, SSE event subscriptions |
| **getHolmesServiceProxyPath()** | `ai-common/src/agent/holmesClient.ts` | Builds K8s service proxy path for routing requests to Holmes |
| **getHolmesProxyBaseUrl()** | `ai-common/src/agent/holmesClient.ts` | Builds full absolute URL including backend origin and cluster routing |
| **checkHolmesAgentHealth()** | `ai-common/src/agent/holmesClient.ts` | Health probe via K8s service proxy |
| **ClusterRequestFn** | `ai-common/src/agent/holmesClient.ts` | Injectable interface for platform-specific cluster requests |
| **HolmesPluginConfig** | `ai-common/src/agent/holmesClient.ts` | Configuration: namespace, service name, port |
| **holmesClient wrapper** | `ai-assistant/src/holmesClient.ts` | Pre-binds headlamp-plugin's `clusterRequest` to `ClusterRequestFn` |
| **Holmes Pod** | In-cluster | HolmesGPT AG-UI server (`server-agui.py`) deployed via Helm chart |

### Data Flow

```
User query (natural language)
        │
        ▼
  AI Assistant (browser)
        │
        ├── HolmesAgent.addMessage(userMessage)
        │
        ├── HolmesAgent.runAgent()
        │        │
        │        ▼
        │   HttpAgent (AG-UI client)
        │        │
        │        ▼
        │   fetch() to getHolmesProxyBaseUrl(cluster) + "/api/agui/chat"
        │        │
        │        ▼
        │   Backend proxy (Headlamp backend server)
        │        │
        │        ▼
        │   K8s API Server (service proxy)
        │        │   /api/v1/namespaces/{ns}/services/{svc}:{port}/proxy/api/agui/chat
        │        │
        │        ▼
        │   Holmes Pod (uvicorn + AG-UI server)
        │        │
        │        ▼
        │   Holmes queries cluster (logs, events, resources)
        │   Holmes calls external LLM provider (with its own API key)
        │        │
        │        ▼
        │   SSE event stream back through proxy chain
        │
        ▼
  AI Assistant renders Holmes response
  (text messages, tool call visualizations, thinking steps)
```

### Trust Boundaries

1. **User ↔ AI Assistant** — user input sent to Holmes as conversation messages
2. **Browser ↔ Backend** — requests pass through the Headlamp backend proxy
3. **Backend ↔ K8s API Server** — authenticated via user's kubeconfig / bearer token
4. **K8s API Server ↔ Holmes Pod** — service proxy forwards to in-cluster pod
5. **Holmes Pod ↔ Cluster Resources** — Holmes reads logs, events, resource state
6. **Holmes Pod ↔ External LLM** — Holmes sends cluster data to its configured LLM provider
7. **AI Assistant config ↔ Plugin Store** — Holmes namespace/service/port stored in plugin config

---

## 2. STRIDE Analysis

### S — Spoofing

#### S1: Spoofed Holmes Service

| | |
|---|---|
| **Threat** | An attacker with namespace-level access could deploy a Service with the same name (`holmesgpt-holmes`) that impersonates the real Holmes agent. The AI Assistant would connect to the malicious service and receive fabricated diagnostic responses. |
| **Mitigation** | The service name and namespace are configurable via `HolmesPluginConfig`. The K8s API server authenticates the proxy request. However, there is no mutual authentication — the AI Assistant trusts whatever responds at the configured service path. |
| **Risk** | **Medium** — requires cluster access to the target namespace. |
| **Fix** | Validate Holmes responses contain expected AG-UI event structure. Consider adding a shared secret or health check fingerprint. |

#### S2: Backend Origin Spoofing

| | |
|---|---|
| **Threat** | `getHeadlampBackendOrigin()` uses heuristics (Electron port, Docker Desktop port, dev mode port, `window.location.origin`) to determine the backend URL. A malicious page or extension could manipulate `window.headlampBackendPort` or `window.headlampBaseUrl` to redirect Holmes requests to an attacker-controlled server. |
| **Mitigation** | These globals are set by the Headlamp runtime. In production, `window.location.origin` is used. |
| **Risk** | **Low** — requires control over the browser environment or an XSS vulnerability. |
| **Fix** | Validate the origin against an allowlist. Avoid relying on mutable `window` properties for security-critical decisions. |

#### S3: ClusterRequestFn Injection

| | |
|---|---|
| **Threat** | The `ClusterRequestFn` interface is injected at runtime. A compromised plugin or module could inject a malicious request function that redirects cluster requests, logs credentials, or modifies responses. |
| **Mitigation** | The injection point is controlled by the host application code (`ai-assistant/src/holmesClient.ts`). |
| **Risk** | **Low** — requires code-level compromise of the host application. |
| **Fix** | Freeze the injected function reference. Type-check at injection time. |

---

### T — Tampering

#### T1: Response Tampering via Proxy Chain

| | |
|---|---|
| **Threat** | Holmes responses traverse multiple proxies (Holmes Pod → K8s API Server → Headlamp backend → browser). Any compromised intermediary could modify the SSE event stream to inject false diagnostics or malicious instructions. |
| **Mitigation** | K8s API server communication uses TLS within the cluster (if configured). The Headlamp backend proxies transparently. |
| **Risk** | **Medium** — cluster-internal traffic may not use TLS by default. |
| **Fix** | Ensure cluster networking uses mTLS (e.g., via a service mesh). Validate AG-UI event schema on the client side. |

#### T2: Config Tampering

| | |
|---|---|
| **Threat** | `HolmesPluginConfig` values (namespace, service name, port) are stored in the plugin store. Tampering with these values could redirect Holmes requests to a malicious service. |
| **Mitigation** | Plugin store uses the same persistence mechanism as other plugin settings. |
| **Risk** | **Low** — requires access to the plugin store or local storage. |
| **Fix** | Validate config values (`normalizeConfigString`, `normalizeConfigPort` already sanitize inputs). Log config changes. |

#### T3: Thread ID Predictability

| | |
|---|---|
| **Threat** | `HolmesAgent` generates thread IDs using `thread-${Date.now()}`. An attacker who can predict or observe the thread ID could potentially inject messages into an existing conversation. |
| **Mitigation** | Thread IDs are local to the browser session. The AG-UI protocol does not expose cross-session thread access. |
| **Risk** | **Low** — would require a separate vulnerability to exploit. |
| **Fix** | Use cryptographically random thread IDs (`crypto.randomUUID()`). |

---

### R — Repudiation

#### R1: No Audit Trail for Holmes Interactions

| | |
|---|---|
| **Threat** | Holmes queries and responses are not logged. A user or compromised process could interact with Holmes (reading sensitive cluster data) with no record. |
| **Mitigation** | K8s API server audit logs capture the service proxy requests. The Headlamp backend may log proxy requests. |
| **Risk** | **Medium** — depends on cluster audit log configuration. |
| **Fix** | Log Holmes interactions (query sent, response summary, cluster, timestamp) in the AI Assistant. Correlate with K8s audit log entries. |

#### R2: Health Check Results Not Logged

| | |
|---|---|
| **Threat** | `checkHolmesAgentHealth()` silently swallows errors and returns `true`/`false`. Failed health checks (which could indicate security issues) leave no trace. |
| **Mitigation** | None — errors are caught and discarded. |
| **Risk** | **Low** |
| **Fix** | Log health check attempts and failures with error details (excluding sensitive data). |

---

### I — Information Disclosure

#### I1: Cluster Data Sent to External LLM

| | |
|---|---|
| **Threat** | Holmes reads cluster data (pod logs, events, resource manifests) and sends it to its configured external LLM provider for analysis. This can expose sensitive information including secrets in environment variables, internal service names, IP addresses, and application-specific data. |
| **Mitigation** | Holmes uses its own LLM provider configuration (separate from the AI Assistant's). The user controls which provider Holmes uses. |
| **Risk** | **High** — cluster data routinely contains sensitive information. |
| **Fix** | Document clearly that Holmes sends cluster data to an external LLM. Allow Holmes configuration to filter sensitive fields (e.g., exclude Secret values, mask environment variables). Recommend self-hosted LLM options for sensitive environments. |

#### I2: User Queries Expose Investigation Context

| | |
|---|---|
| **Threat** | User queries to Holmes (e.g., "Why is the payment-service pod crashing?") reveal application names, architecture, and operational issues to the Holmes LLM provider. |
| **Mitigation** | Users voluntarily provide queries. Same exposure as any LLM chat interaction. |
| **Risk** | **Medium** — operational context can be sensitive. |
| **Fix** | Inform users that queries are forwarded to Holmes and its LLM provider. Apply the same disclosure notices as other AI provider interactions. |

#### I3: Service Proxy Path Reveals Cluster Topology

| | |
|---|---|
| **Threat** | The proxy path (`/api/v1/namespaces/{ns}/services/{svc}:{port}/proxy`) reveals namespace names and service topology in browser network traffic and any intermediate logs. |
| **Mitigation** | This information is already available to authenticated cluster users. |
| **Risk** | **Low** |
| **Fix** | No action needed — this is standard K8s API behavior. |

#### I4: Console Logging of Holmes URL

| | |
|---|---|
| **Threat** | `HolmesAgent.createAgent()` logs the full URL (`console.log('[HolmesAgent] Creating HttpAgent with URL:', url)`) to the browser console. This reveals cluster name, namespace, and service details. |
| **Mitigation** | Browser console is only accessible to the user or browser extensions. |
| **Risk** | **Low** |
| **Fix** | Remove or guard console.log behind a debug flag. Use structured logging. |

---

### D — Denial of Service

#### D1: Holmes Agent Unavailability Blocks Diagnostics

| | |
|---|---|
| **Threat** | If the Holmes pod is down, overloaded, or evicted, the AI Assistant loses diagnostic capability. The health check returns `false` but the user experience degrades silently. |
| **Mitigation** | `checkHolmesAgentHealth()` has a 5-second timeout. The AI Assistant falls back to its own LLM without Holmes when the agent is unavailable. |
| **Risk** | **Low** — graceful degradation is implemented. |
| **Fix** | Show clear status indicators for Holmes availability. Cache health status with reasonable TTL. |

#### D2: SSE Stream Stalling

| | |
|---|---|
| **Threat** | A malicious or buggy Holmes server could send an SSE stream that never completes (no `run_finished` event), keeping the connection open indefinitely and blocking the UI. |
| **Mitigation** | `HolmesAgent.abortRun()` allows manual cancellation. `resetThread()` creates a new agent instance. |
| **Risk** | **Medium** — requires user intervention to recover. |
| **Fix** | Add a configurable timeout for agent runs. Auto-abort after timeout. Show a cancel button during long-running Holmes queries. |

#### D3: Large Response Payloads

| | |
|---|---|
| **Threat** | Holmes could return extremely large text content (e.g., full log dumps) that overwhelm the browser's memory or rendering. |
| **Mitigation** | No response size limits in `HolmesAgent`. |
| **Risk** | **Medium** |
| **Fix** | Implement max response size. Truncate or paginate large responses. Limit tool args buffer accumulation in `toolArgsBuffers`. |

#### D4: Rapid Thread Creation

| | |
|---|---|
| **Threat** | Repeated calls to `resetThread()` create new `HttpAgent` instances. A bug or malicious automation could exhaust browser resources. |
| **Mitigation** | `resetThread()` replaces the previous agent (no accumulation). |
| **Risk** | **Low** |
| **Fix** | Rate-limit thread resets. Clean up previous agent resources before creating new ones. |

---

### E — Elevation of Privilege

#### E1: Holmes Pod Has Cluster Read Access

| | |
|---|---|
| **Threat** | The Holmes pod needs RBAC permissions to read cluster resources (pods, events, logs, deployments) for diagnostics. These permissions could be abused if the pod is compromised. |
| **Mitigation** | Holmes uses a ServiceAccount with RBAC policies defined in the Helm chart. Permissions should follow least privilege. |
| **Risk** | **High** — a compromised Holmes pod with broad read access can exfiltrate cluster state. |
| **Fix** | Document minimum required RBAC permissions. Provide a restrictive default RBAC policy. Allow namespace-scoped access only where possible. Recommend Pod Security Standards. |

#### E2: Service Proxy Bypasses Network Policies

| | |
|---|---|
| **Threat** | The K8s service proxy mechanism (`/api/v1/namespaces/.../proxy`) allows any authenticated API server user to reach the Holmes pod, potentially bypassing NetworkPolicy restrictions that would otherwise block direct pod access. |
| **Mitigation** | Service proxy access is gated by RBAC (`services/proxy` verb). |
| **Risk** | **Medium** — depends on RBAC configuration. |
| **Fix** | Ensure RBAC restricts `services/proxy` access to authorized users/service accounts. Document required RBAC bindings. |

#### E3: Prompt Injection via Holmes Response

| | |
|---|---|
| **Threat** | Holmes responses are rendered in the AI Assistant UI. If Holmes is compromised, it could inject content that tricks the user (e.g., "Run `kubectl delete namespace production` to fix the issue") or injects prompt instructions into subsequent LLM interactions. |
| **Mitigation** | Holmes responses are rendered through the `TextStreamContainer` content renderer. Tool calls go through approval flow. |
| **Risk** | **Medium** — social engineering risk; depends on how Holmes output is integrated with subsequent LLM calls. |
| **Fix** | Clearly label Holmes responses as coming from the in-cluster agent. Do not inject Holmes output directly into subsequent LLM system prompts. Sanitize Holmes output before rendering. |

#### E4: Port Configuration Allows Targeting Other Services

| | |
|---|---|
| **Threat** | `HolmesPluginConfig` allows configuring any namespace, service name, and port (1–65535). A malicious config could redirect the proxy to an unrelated service (e.g., a database, internal API) and use the Holmes client as an SSRF vector. |
| **Mitigation** | `normalizeConfigPort()` validates port range (1–65535). `normalizeConfigString()` trims whitespace. But **no validation of namespace or service name** beyond emptiness. |
| **Risk** | **Medium** — requires plugin config access, but could reach any cluster service. |
| **Fix** | Validate namespace and service name against K8s naming conventions (`[a-z0-9-]+`, max 63 chars). Consider restricting to a known set of service names. Log config changes for audit. |

---

## 3. Summary

| ID | Category | Threat | Severity | Status |
|----|----------|--------|----------|--------|
| **I1** | Info Disclosure | Cluster data sent to external LLM | **High** | ⚠️ By design — needs documentation |
| **E1** | EoP | Holmes pod cluster read access | **High** | ⚠️ Partial (RBAC in Helm chart) |
| **S1** | Spoofing | Spoofed Holmes service | **Medium** | ❌ Not mitigated |
| **T1** | Tampering | Response tampering via proxy chain | **Medium** | ⚠️ Partial (TLS depends on cluster config) |
| **R1** | Repudiation | No audit trail for Holmes interactions | **Medium** | ⚠️ Partial (K8s audit logs) |
| **I2** | Info Disclosure | User queries expose investigation context | **Medium** | ❌ Not mitigated |
| **D2** | DoS | SSE stream stalling | **Medium** | ⚠️ Partial (manual abort) |
| **D3** | DoS | Large response payloads | **Medium** | ❌ Not mitigated |
| **E2** | EoP | Service proxy bypasses network policies | **Medium** | ⚠️ Partial (RBAC gated) |
| **E3** | EoP | Prompt injection via Holmes response | **Medium** | ⚠️ Partial (approval flow for tool calls) |
| **E4** | EoP | Port config targets other services | **Medium** | ⚠️ Partial (port validation only) |
| **S2** | Spoofing | Backend origin spoofing | **Low** | ⚠️ Partial (production uses same origin) |
| **S3** | Spoofing | ClusterRequestFn injection | **Low** | ⚠️ Partial (controlled injection point) |
| **T2** | Tampering | Config tampering | **Low** | ⚠️ Partial (input sanitization) |
| **T3** | Tampering | Thread ID predictability | **Low** | ❌ Not mitigated |
| **R2** | Repudiation | Health check results not logged | **Low** | ❌ Not mitigated |
| **I3** | Info Disclosure | Service proxy path reveals topology | **Low** | ✅ Acceptable (standard K8s) |
| **I4** | Info Disclosure | Console logging of Holmes URL | **Low** | ❌ Not mitigated |
| **D1** | DoS | Holmes agent unavailability | **Low** | ✅ Mitigated (graceful fallback) |
| **D4** | DoS | Rapid thread creation | **Low** | ✅ Mitigated (replaces, not accumulates) |

## 4. Recommended Actions (Priority Order)

### 1. Document cluster data exposure to external LLM (I1) — HIGH
- Clearly document that Holmes sends cluster data (logs, events, manifests) to its configured LLM provider
- Provide guidance on data sensitivity and self-hosted LLM options
- Consider adding a configuration option to filter sensitive fields before sending to LLM

### 2. Provide minimum-privilege RBAC template (E1) — HIGH
- Document the minimum RBAC permissions Holmes needs
- Provide a restrictive default ServiceAccount and RoleBinding
- Recommend namespace-scoped access where possible
- Include Pod Security Standards recommendations

### 3. Add Holmes interaction audit logging (R1) — MEDIUM
- Log Holmes queries, response summaries, cluster context, and timestamps
- Correlate with K8s API server audit log entries
- Include health check results (R2)

### 4. Add SSE stream timeout and response size limits (D2, D3) — MEDIUM
- Configurable timeout for agent runs (e.g., 120 seconds)
- Maximum response payload size
- Auto-abort with user notification on timeout
- Cap `toolArgsBuffers` accumulation

### 5. Validate Holmes service identity (S1) — MEDIUM
- Validate AG-UI event structure in responses
- Consider a health check fingerprint or version verification
- Validate namespace/service name against K8s naming conventions (E4)

### 6. Harden proxy and response chain (T1, E3) — MEDIUM
- Document mTLS recommendations for cluster networking
- Sanitize Holmes output before rendering
- Clearly label Holmes responses in the UI
- Do not inject Holmes output into subsequent LLM system prompts

### 7. Use cryptographic thread IDs (T3) — LOW
- Replace `Date.now()` with `crypto.randomUUID()` for thread IDs

### 8. Remove production console logging (I4) — LOW
- Guard `console.log` in `createAgent()` behind a debug flag
- Use structured logging for diagnostics

### 9. Restrict service proxy access (E2) — LOW
- Document required RBAC bindings for `services/proxy`
- Provide example ClusterRole restricting proxy access to Holmes service only
