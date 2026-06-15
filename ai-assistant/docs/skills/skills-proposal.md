# Skills System Proposal for Headlamp AI Assistant

## Recommendation

**Support three skill types — prompt skills (Markdown documents), MCP skills (MCP server endpoints), and tool skills (TypeScript tool classes) — loaded from Git repositories, Helm values, or local directories. Prompt skills are the default for community contributions; MCP and tool skills require explicit admin approval.**

| Skill type | Format | Runtime | Trust level |
|------------|--------|---------|-------------|
| **Prompt skill** | Markdown document (`.md`) | Injected into system prompt | Low risk — no code execution |
| **MCP skill** | MCP server endpoint (HTTP/SSE) | Backend proxy (existing MCP infra) | Medium risk — tool calls go through approval |
| **Tool skill** | TypeScript `ToolBase` subclass | Compiled into plugin bundle | High risk — runs in browser/Node |

### Why this approach

- **Prompt skills are the safe default.** They contain only Markdown text — domain knowledge, procedures, troubleshooting guides — injected into the system prompt. No code runs. Community repos can publish these with minimal review burden.
- **MCP skills reuse the existing MCP infrastructure.** Headlamp already supports MCP servers (Electron stdio, backend HTTP proxy). Adding a skill that points to an MCP server is just adding a server entry — the approval, proxy, and permission-secret systems already handle security.
- **Tool skills are the most powerful but highest risk.** They compile into the plugin bundle and run in the browser or Node.js. Only pre-approved tools from trusted sources should be used.
- **Git-based distribution follows the Azure Skills and Flux agent-skills pattern.** Both Microsoft ([azure-skills](https://github.com/microsoft/azure-skills)) and the Flux project ([agent-skills](https://github.com/fluxcd/agent-skills)) distribute skills as files in Git repositories — Markdown docs, CLI tool references, and structured metadata.

### Alternatives considered

| Approach | Pros | Cons | Why not chosen |
|----------|------|------|----------------|
| **A. Three-tier skills** (chosen) | Graduated trust — text is safe, MCP is sandboxed, tools are explicit | Requires different handling per type | Risk is proportional to capability |
| **B. MCP-only skills** | Single protocol, reuses all existing infra | Can't add pure-knowledge skills without a server; overkill for "here's how to debug X" | Many useful skills are just domain knowledge (no tool calls needed) |
| **C. Plugin-only skills (npm packages)** | Full TypeScript power, familiar packaging | Every skill runs arbitrary code; npm supply-chain risk; heavyweight for simple prompts | Too much trust required for community contributions |
| **D. Marketplace with review** | Curated quality | Requires maintaining a review pipeline and registry; blocks community velocity | Headlamp is open-source; Git repos are the natural distribution channel |

---

## What the industry is doing

### Skills formats across the ecosystem

| Project / Tool | Format | Distribution | Key idea |
|----------------|--------|-------------|----------|
| **GitHub Copilot** | `.github/skills/*/SKILL.md` | Git repo directories | YAML front-matter + Markdown instructions; auto-loaded when prompt matches description |
| **Claude Code** | `AGENTS.md` / `.agents/skills/` | Git repo or `flux-operator skills install` | Cross-tool standard via `agentskills.io`; skills are context docs, not executable code |
| **VS Code Copilot** | `.github/instructions/*.instructions.md` | Git repo files with `applyTo` glob patterns | Path-scoped instructions; always-on context rules |
| **Flux agent-skills** | `SKILL.md` per skill directory | Git repo, installable via `npx skills add fluxcd/agent-skills` | Skills = Markdown runbooks + MCP server references; `flux-operator-mcp` for live cluster access |
| **Azure Skills** | `skills/*/SKILL.md` | Git repo (`microsoft/azure-skills`) | Curated by Microsoft; domain-specific (AKS, networking, etc.) |
| **Solo.io / kagent** | Agent registry + CRDs | Kubernetes-native (CRDs, operator) | Full agent lifecycle management; skills are K8s resources |
| **Holmes (Robusta)** | YAML runbooks + Python toolsets | Helm chart + pip package | AI-driven K8s investigation; runbooks define trigger→collect→diagnose→report flows |
| **K8sGPT** | Go analyzers compiled into binary | Single binary / operator | Each analyzer is a Go struct; not dynamically extensible |
| **LangChain/LangGraph** | `@tool` decorator / `DynamicTool` class | npm/pip packages (`@langchain/community`) | Tools are code (Python/TypeScript classes); distributed via package managers; community tools in `@langchain/community` |
| **agentskills.io** | `SKILL.md` standard | Cross-tool convention | Vendor-agnostic; skills discoverable by Copilot, Claude, Cursor, Gemini |

### Key industry convergence

1. **Markdown is the universal format.** Every major platform uses Markdown (with optional YAML front-matter) for skills. Not JSON, not YAML-only, not code.
2. **Git repos are the distribution channel.** Azure, Flux, GitHub Copilot all load skills from Git directories — no registry servers, no package managers for prompt skills.
3. **`SKILL.md` is becoming a cross-tool standard.** The `agentskills.io` convention means the same skill files work across Copilot, Claude, Cursor, and Gemini.
4. **MCP is the action layer.** When skills need to *do* things (not just *know* things), MCP servers provide the tool interface.
5. **Runbooks bridge knowledge and action.** Holmes/Robusta show that the most useful AI skills are structured troubleshooting procedures that combine knowledge (what to check) with tool calls (how to check it).

### What we can reuse

| Source | What to reuse | How |
|--------|--------------|-----|
| **`agentskills.io` / GitHub Copilot `SKILL.md`** | Format standard | Adopt the same `SKILL.md` front-matter schema — skills written for Copilot work in Headlamp and vice versa |
| **Azure Skills repo** | AKS/Azure content | Load `microsoft/azure-skills` as a skill source — instant Azure guidance |
| **Flux agent-skills** | GitOps knowledge + MCP server | Load `fluxcd/agent-skills` for GitOps skills; `flux-operator-mcp` as an MCP skill |
| **Holmes (Robusta)** | Troubleshooting runbooks | Adapt Holmes' investigation patterns (CrashLoopBackOff, OOMKilled, NodeNotReady) as prompt skills; reference Holmes' toolsets concept for future tool skills |
| **LangChain `@langchain/community`** | Tool class pattern | Headlamp's `ToolBase` already mirrors LangChain's `DynamicTool` pattern; community tools can be wrapped |
| **CNCF ecosystem** | K8sGPT analyzers as knowledge | Convert K8sGPT's analyzer logic (what it checks and why) into prompt skill content |

---

## MVP — most valuable first

Based on what users actually ask for in Kubernetes AI tools (troubleshooting, operational guidance, security audits), what the industry is converging on (Markdown skills in Git repos), and what we can reuse immediately, the MVP focuses on: **prompt skills loaded from local directories, using the `SKILL.md` cross-tool standard**.

### What users want most

| Rank | Feature | Why it's popular | MVP? |
|------|---------|-----------------|------|
| 1 | **Troubleshooting guidance** | #1 request — "Why is my pod in CrashLoopBackOff?" with context-specific advice | ✅ Prompt skill |
| 2 | **Operational playbooks** | Runbooks for common tasks (scale, upgrade, rollback) as AI-ready knowledge | ✅ Prompt skill |
| 3 | **Platform-specific knowledge** | AKS, EKS, GKE, OpenShift — each has quirks the LLM doesn't know | ✅ Prompt skill (reuse Azure Skills) |
| 4 | **Headlamp UI navigation** | LLM doesn't know Headlamp's menu structure without being told | ✅ Built-in prompt skill |
| 5 | **Security & compliance audits** | RBAC review, network policy checks, CIS benchmark guidance | ✅ Prompt skill |
| 6 | **GitOps operations** | Flux/Argo workflows via MCP tools | Phase 2 (MCP skill) |
| 7 | **Cost optimization** | Resource right-sizing recommendations | Phase 2 (needs tool calls) |

### Most useful skills features (prioritized)

| Priority | Feature | Value | Effort |
|----------|---------|-------|--------|
| **P0** | Load Markdown skills from directory | Enables all prompt skills | Low |
| **P0** | `SKILL.md` front-matter parsing (name, description, tags) | Metadata for UI + cross-tool compatibility | Low |
| **P0** | Inject into system prompt with delimiters | Makes skills actually work | Low |
| **P1** | Settings UI: list, toggle, preview | Users can manage skills | Medium |
| **P1** | Ship 3 built-in skills | Immediate value out of the box | Low |
| **P1** | `--skills-dir` CLI flag | CLI users get skills too | Low |
| **P2** | Size budget display | Prevents prompt overflow | Low |
| **P2** | Git repo fetching | Load Azure/Flux/community skills | Medium |
| **P3** | MCP skill auto-registration | Skills that *do* things | Medium |
| **P3** | Skill update detection + diff | Keep skills current safely | Medium |

### MVP scope

Ship prompt skills from **local directories** first. This delivers the highest value with the least infrastructure:

**In:**
- Load `.md` files from a configured directory (e.g. `~/.config/Headlamp/skills/` or `--skills-dir` flag)
- Parse `SKILL.md` front-matter for metadata (name, description, tags) — compatible with `agentskills.io` / GitHub Copilot format
- Inject content into system prompt with delimiters
- Settings UI: list installed skills, toggle enable/disable, preview content
- Size budget display (how much prompt space is used)
- Ship 3 built-in skills: `kubernetes-troubleshooting`, `headlamp-navigation`, `kubernetes-security`

**Out (later phases):**
- Git repository fetching (Phase 1b)
- MCP skills (Phase 2)
- Skill updates, diffing, integrity checks (Phase 3)
- In-cluster / Helm skills (Phase 4)
- Tool skills (Phase 5)

### Why local-first

1. **No network dependencies** — works offline, in air-gapped environments, in CI.
2. **No security surface** — no Git fetching, no remote URLs, no supply-chain risk.
3. **Fastest to ship** — read files from disk, parse front-matter, inject into prompt.
4. **Users can start immediately** — copy a `.md` file into a directory and restart.
5. **Validates the format** — proves `SKILL.md` metadata and prompt injection work before adding complexity.
6. **Cross-tool compatible** — same `SKILL.md` format works in GitHub Copilot, Claude, Cursor.

### Built-in skills to ship with MVP

**`kubernetes-troubleshooting`** — the most requested feature (adapted from Holmes/K8sGPT investigation patterns):
```markdown
---
name: kubernetes-troubleshooting
description: Common Kubernetes troubleshooting procedures
tags: [kubernetes, troubleshooting, debugging]
---

# Kubernetes Troubleshooting Guide

When a user asks about pod issues, check these common causes:

## CrashLoopBackOff
1. Check logs: suggest using the Logs tab in Headlamp
2. Check resource limits: look for OOMKilled in pod status
3. Check image: verify the image exists and is pullable

## OOMKilled
1. Check container memory limits vs actual usage
2. Suggest increasing limits or optimizing the application
3. Show how to view resource metrics in Headlamp

## ImagePullBackOff
1. Verify image name and tag exist
2. Check imagePullSecrets configuration
3. Test registry connectivity
...
```

**`headlamp-navigation`** — helps the LLM guide users through Headlamp's UI:
```markdown
---
name: headlamp-navigation
description: How to navigate Headlamp's UI to find Kubernetes resources
tags: [headlamp, navigation, ui]
---

# Headlamp Navigation Guide

When guiding users to Kubernetes resources in Headlamp:
- Pods: Sidebar → Workloads → Pods
- Services: Sidebar → Network → Services
- ConfigMaps: Sidebar → Configuration → Config Maps
- Secrets: Sidebar → Configuration → Secrets
- Nodes: Sidebar → Cluster → Nodes
...
```

**`kubernetes-security`** — RBAC and security posture guidance:
```markdown
---
name: kubernetes-security
description: Kubernetes security best practices and RBAC guidance
tags: [kubernetes, security, rbac, compliance]
---

# Kubernetes Security Guide

## RBAC Review
When asked about permissions or access:
1. Check ClusterRoles and ClusterRoleBindings
2. Look for overly permissive roles (cluster-admin bindings)
3. Suggest least-privilege alternatives
...
```

### MVP timeline estimate

| Task | Effort |
|------|--------|
| `SKILL.md` parser (front-matter + Markdown) | 1 day |
| Skills directory loader (local + `--skills-dir` flag) | 1 day |
| Prompt injection with delimiters | 0.5 day |
| Settings UI (list, toggle, preview) | 2 days |
| Built-in skills content (3 skills) | 1.5 days |
| Tests | 1 day |
| **Total** | **~1 week** |

---

## Skill types in detail

### 1. Prompt skills (Markdown documents)

A prompt skill is a Markdown file that provides domain knowledge to the AI assistant. It is injected into the system prompt, giving the LLM context about specific tools, platforms, or procedures.

**Format (compatible with Azure Skills convention):**

```
skills/
  azure-kubernetes/
    SKILL.md           # Metadata + entry point
    docs/
      troubleshooting.md
      best-practices.md
```

**SKILL.md structure:**

```markdown
---
name: azure-kubernetes
description: AKS cluster management guidance
version: 1.0.0
author: Microsoft
license: MIT
tags: [azure, aks, kubernetes]
---

# Azure Kubernetes Skills

Guide the AI assistant on Azure Kubernetes Service operations.

## Prompt

Include the contents of `docs/troubleshooting.md` and `docs/best-practices.md`
as context when the user asks about AKS.
```

**How it works:**
1. User adds a skill source (Git URL or local path) in Headlamp settings.
2. Headlamp fetches the repository and reads `SKILL.md` files.
3. The Markdown content is concatenated into the system prompt as additional context.
4. No code executes — pure text injection.

**Security:** Prompt injection is the main risk (see STRIDE analysis below). Mitigated by scoping skill content to a clearly-delimited section in the system prompt and by admin-only installation.

### 2. MCP skills (MCP server endpoints)

An MCP skill adds an MCP server that provides tools to the AI assistant. This reuses Headlamp's existing MCP infrastructure — the backend proxy, permission secrets, and tool approval flow.

**Format:**

```markdown
---
name: flux-gitops
description: GitOps operations via Flux MCP server
version: 2.0.0
author: Flux project
license: Apache-2.0
tags: [flux, gitops, kubernetes]
mcp:
  transport: http
  url: https://mcp.fluxcd.io/v1
  # Or for local: command: flux-operator-mcp, args: ["serve"]
---

# Flux GitOps Skills

Provides tools for managing Flux GitOps resources.
```

**How it works:**
1. Admin adds the skill source.
2. Headlamp reads the `mcp` section and registers the MCP server.
3. Tools from the MCP server appear in the tool approval UI.
4. Users approve/deny tool calls through the existing consent flow.

**Security:** Same security model as manually-configured MCP servers — backend proxy, permission secrets, tool approval. The skill just automates the server registration.

### 3. Tool skills (TypeScript tool classes)

A tool skill is a TypeScript class that extends `ToolBase` and compiles into the plugin bundle. This is the most powerful skill type — it can make API calls, process data, and interact with Kubernetes directly.

**Format:**

```typescript
// skills/cost-analyzer/CostAnalyzerTool.ts
import { ToolBase } from '@headlamp-k8s/ai/langchain';
import { z } from 'zod';

export class CostAnalyzerTool extends ToolBase {
  readonly config = {
    name: 'cost_analyzer',
    description: 'Analyze Kubernetes resource costs',
    schema: z.object({
      namespace: z.string().optional(),
    }),
  };

  async handler(args: { namespace?: string }) {
    // ... implementation
    return { content: 'Cost analysis results...' };
  }
}
```

**How it works:**
1. The tool class is imported and registered in the plugin's tool registry.
2. It compiles into the plugin bundle alongside the ai-assistant plugin.
3. At runtime, it goes through the same tool approval flow as built-in tools.

**Security:** Highest risk — runs arbitrary TypeScript. Only for first-party or explicitly trusted tools. Not suitable for community distribution without code review.

---

## Skill sources

Skills can be loaded from four sources, in order of trust:

| Source | Trust | Who manages | Example |
|--------|-------|-------------|---------|
| **Built-in** | Highest | Headlamp maintainers | `kubernetes_api_request` tool |
| **Local directory** | High | Cluster admin | `/etc/headlamp/skills/` |
| **Git repository** | Medium | Repo maintainers | `github.com/microsoft/azure-skills` |
| **Helm values** | High | Cluster admin | `ai.skills[]` in `values.yaml` |

### Git repository loading

```yaml
# Headlamp config or Helm values
ai:
  skills:
    sources:
      - url: https://github.com/microsoft/azure-skills
        ref: main
        path: skills/azure-kubernetes  # Optional: specific skill
        type: prompt                   # prompt | mcp
        enabled: true
      - url: https://github.com/fluxcd/agent-skills
        ref: v1.2.0                    # Pin to tag for stability
        path: skills/gitops-knowledge
        type: prompt
        enabled: true
```

**Fetching strategy:**
- **Desktop/headless:** Backend clones or fetches the repo at startup and on config change. Caches locally. Checks for updates periodically (configurable, default: daily).
- **In-cluster:** Init container or CronJob fetches repos into a shared volume. Skills ConfigMap is generated from the fetched content.
- **CLI:** Fetches at invocation time, caches in `~/.config/headlamp-ai/skills/`.

### High-quality repositories to support

| Repository | Type | Description |
|------------|------|-------------|
| [microsoft/azure-skills](https://github.com/microsoft/azure-skills) | Prompt | Azure service guidance (AKS, networking, etc.) |
| [fluxcd/agent-skills](https://github.com/fluxcd/agent-skills) | Prompt + MCP | GitOps knowledge, manifest generation, cluster debugging |
| [MicrosoftDocs/Agent-Skills](https://github.com/MicrosoftDocs/Agent-Skills) | Prompt | Azure cloud development skills |
| [kubernetes/website](https://github.com/kubernetes/website) | Prompt | Official K8s documentation (subset) |
| Custom enterprise repos | Any | Internal runbooks, compliance guides, custom tools |

---

## Publishing strategy

### Where should skills be published?

Skills follow the Git-native distribution model the industry has converged on.
The table below shows where each category of skill should live:

| Skill | Repo | Maintained by | Rationale |
|-------|------|---------------|-----------|
| `headlamp-navigation` | `headlamp-k8s/headlamp` (in-tree, `ai/skills/`) | Headlamp maintainers | Tightly coupled to Headlamp's sidebar and routing — changes whenever the UI changes. Must stay in sync. |
| `kubernetes-troubleshooting` | `headlamp-k8s/skills` (dedicated skills repo) | Headlamp + community | General K8s knowledge — not specific to Headlamp's code. A separate repo lets the community contribute troubleshooting runbooks without touching the main codebase. |
| `kubernetes-security` | `headlamp-k8s/skills` | Headlamp + community | Same rationale — security guidance evolves independently and benefits from community review. |
| Cloud provider skills (AKS, EKS, GKE) | Upstream repos (`microsoft/azure-skills`, etc.) or `headlamp-k8s/skills` | Cloud provider teams or community | Prefer upstream when available (Azure Skills already exists). Create in `headlamp-k8s/skills` when no upstream exists yet. |
| Enterprise/internal skills | Private Git repo | Enterprise platform team | Internal runbooks, compliance checklists, custom tooling. Never published publicly. |

### Do we need to create these ourselves?

**Yes for the first three — they are the bootstrap set.** Nobody else will create
Headlamp-specific skills. The community can improve them over time, but the
initial content must come from the Headlamp team:

1. **`headlamp-navigation`** — only Headlamp maintainers know the exact
   sidebar paths, URL routes, and component names. This skill has to ship
   in-tree (co-located with the code it describes). It should be updated
   alongside UI changes.

2. **`kubernetes-troubleshooting`** — generic Kubernetes knowledge is
   well-documented (K8s docs, Holmes, K8sGPT). We can adapt patterns from
   [Holmes runbooks](https://github.com/robusta-dev/holmesgpt) and
   [K8sGPT analyzers](https://github.com/k8sgpt-ai/k8sgpt) into
   Headlamp-flavored Markdown. The initial version (~50 troubleshooting
   patterns) would take ~2 days to write. Community contributions would
   expand it over time.

3. **`kubernetes-security`** — adapt from public RBAC guides, CIS
   benchmarks, and Pod Security Standards documentation. Initial version
   covers RBAC review, PodSecurityPolicy/PSA, network policies, and
   secret management. ~1 day to write the initial content.

For cloud-specific skills, we can **reuse upstream repos** where they exist:
- **Azure:** [microsoft/azure-skills](https://github.com/microsoft/azure-skills)
  already ships AKS, networking, and storage skills in `SKILL.md` format.
  Headlamp just needs to point at this repo as a skill source.
- **Flux/GitOps:** [fluxcd/agent-skills](https://github.com/fluxcd/agent-skills)
  covers GitOps workflows, manifest generation, and cluster debugging.
- **EKS/GKE:** No upstream skill repos exist as of April 2025. If there is demand, we create
  them in `headlamp-k8s/skills` and invite cloud provider teams to
  contribute.

### Recommended repo structure for `headlamp-k8s/skills`

```
headlamp-k8s/skills/
├── README.md                        # How to use, contribute, and install
├── CONTRIBUTING.md                  # SKILL.md format guide, review checklist
├── skills/
│   ├── kubernetes-troubleshooting/
│   │   └── SKILL.md                 # CrashLoopBackOff, OOMKilled, etc.
│   ├── kubernetes-security/
│   │   └── SKILL.md                 # RBAC, PSA, network policies
│   ├── kubernetes-networking/
│   │   └── SKILL.md                 # Service types, DNS, ingress debugging
│   └── kubernetes-storage/
│       └── SKILL.md                 # PV/PVC troubleshooting, CSI drivers
└── .github/
    └── CODEOWNERS                   # Review requirements per skill
```

Users install with:
```bash
# In Headlamp settings UI:
# Add skill source → https://github.com/headlamp-k8s/skills → main

# Or in Helm values (pin to a tag for production):
ai:
  skills:
    sources:
      - url: https://github.com/headlamp-k8s/skills
        ref: v1.0.0  # Use tags for reproducibility; 'main' for latest
```

### Publishing to the agentskills.io ecosystem

The `SKILL.md` format is compatible with the
[agentskills.io standard](https://agentskills.io), which means Headlamp
skills are automatically discoverable by other tools (GitHub Copilot,
Claude, Cursor, Windsurf). Publishing to `headlamp-k8s/skills` with
proper `SKILL.md` front-matter makes them available cross-platform.

To maximize reach:
- Use the `SKILL.md` file name (not `skill.md` or `README.md`).
- Include `tags` in front-matter for discoverability.
- Add `tool: headlamp` in front-matter so tools can filter by platform.
- Submit to the [awesome-agent-skills](https://github.com/punkpeye/awesome-agent-skills)
  list once the initial skills are stable.

---

## STRIDE security analysis

### Threat model scope

The system under analysis is: "Headlamp AI assistant loads skill definitions from external Git repositories and uses them to augment LLM behavior."

### S — Spoofing

| Threat | Scenario | Mitigation |
|--------|----------|------------|
| **S1. Repo impersonation** | Attacker creates `github.com/microsft/azure-skills` (typosquat) | UI shows full URL; admin manually enters URLs (no search/marketplace) |
| **S2. Compromised repo** | Maintainer account takeover pushes malicious content | Pin to Git tags/SHAs, not branches; verify GPG signatures when available |
| **S3. MITM on Git fetch** | Network attacker injects content during clone | HTTPS-only for Git URLs; reject HTTP |

### T — Tampering

| Threat | Scenario | Mitigation |
|--------|----------|------------|
| **T1. Prompt injection via skill content** | Malicious Markdown contains "Ignore previous instructions" | Delimit skill content in system prompt with clear boundaries; LLM guardrails; content-type validation (reject non-Markdown) |
| **T2. MCP server URL replacement** | Skill update changes MCP URL to attacker server | Show diff on skill update; require admin re-approval for URL/command changes |
| **T3. Local cache tampering** | Attacker modifies cached skill files on disk | File permissions (600); integrity checks (SHA-256 of fetched content stored in config) |

### R — Repudiation

| Threat | Scenario | Mitigation |
|--------|----------|------------|
| **R1. Untracked skill changes** | Admin can't tell which skills were active when an incident occurred | Log skill source URL + commit SHA + load timestamp; include in audit trail |
| **R2. Silent skill updates** | Skill auto-updates without admin knowledge | Require explicit approval for updates; show changelog in UI |

### I — Information Disclosure

| Threat | Scenario | Mitigation |
|--------|----------|------------|
| **I1. Skill content leaks cluster info** | Prompt skill designed to make LLM exfiltrate data via tool calls | Tool approval flow catches tool calls; prompt skills can't directly access data |
| **I2. MCP server receives sensitive data** | MCP tool call sends cluster secrets to external server | MCP tool approval shows full arguments before sending; admin reviews MCP server URLs |
| **I3. Git credentials in skill config** | Private repo credentials stored insecurely | Use credential helpers (Git credential store, K8s Secrets); never store tokens in skill config |

### D — Denial of Service

| Threat | Scenario | Mitigation |
|--------|----------|------------|
| **D1. Huge skill content** | Skill repo contains 100MB of Markdown, blows up system prompt | Max skill content size (configurable, default: 50KB per skill); truncate with warning |
| **D2. Many skills enabled** | 50 skills each adding 10KB = 500KB system prompt | Max total prompt skill content (configurable, default: 200KB); priority ordering |
| **D3. Slow Git fetch** | Repo is slow or unreachable, blocks startup | Async fetch with timeout (30s); use cached version if fetch fails; don't block UI |

### E — Elevation of Privilege

| Threat | Scenario | Mitigation |
|--------|----------|------------|
| **E1. Prompt skill escalates to tool calls** | Crafted prompt skill tricks LLM into calling dangerous tools | Tool approval flow is independent of prompt content; user must approve each tool call |
| **E2. MCP skill claims higher privileges** | MCP server metadata claims admin access | MCP tools go through same approval as any other tool; no privilege escalation path |
| **E3. Cross-skill interference** | One skill's prompt content influences another skill's behavior | Namespace skill content in system prompt; each skill gets its own delimited section |

### Security improvements from STRIDE findings

Based on the analysis above, the following controls are added to the design:

1. **HTTPS-only Git URLs** — reject `http://` and `git://` protocols.
2. **Pin to tags or SHAs** — default config uses tags, not branches. UI warns when using `main`/`master`.
3. **Content size limits** — 50KB per skill, 200KB total prompt content. Configurable by admin.
4. **Diff on update** — show what changed before applying skill updates.
5. **Audit logging** — log skill source, commit SHA, load time, and any errors.
6. **Prompt delimiting** — wrap each skill's content in clear boundaries:
   ```
   <skill name="azure-kubernetes" source="github.com/microsoft/azure-skills@v1.0">
   ... skill content ...
   </skill>
   ```
7. **Admin-only installation** — only cluster admins can add skill sources. Regular users can enable/disable individual skills from the approved set.
8. **Integrity checking** — store SHA-256 of fetched content; verify on load.

---

## UI proposal

### Skills settings page

The skills management UI lives in the AI Assistant settings (gear icon → Skills tab).

```
┌─────────────────────────────────────────────────────┐
│ AI Assistant Settings                            ✕  │
├──────────┬──────────────────────────────────────────│
│ Provider │                                          │
│ Skills   │  Skills                                  │
│ MCP      │                                          │
│          │  ┌─ Skill Sources ──────────────────────┐│
│          │  │                                      ││
│          │  │  📦 microsoft/azure-skills    v1.0 ✅ ││
│          │  │     azure-kubernetes ✅               ││
│          │  │     azure-networking ☐               ││
│          │  │                                      ││
│          │  │  📦 fluxcd/agent-skills    main ⚠️    ││
│          │  │     gitops-knowledge ✅               ││
│          │  │     gitops-cluster-debug ✅  (MCP)    ││
│          │  │                                      ││
│          │  │  [+ Add Skill Source]                 ││
│          │  └──────────────────────────────────────┘│
│          │                                          │
│          │  Total prompt size: 45KB / 200KB         │
│          │  Last updated: 2 hours ago  [↻ Refresh]  │
│          │                                          │
├──────────┴──────────────────────────────────────────│
│                            [Cancel]  [Save]         │
└─────────────────────────────────────────────────────┘
```

### Adding a skill source

```
┌────────────────────────────────────────────────┐
│ Add Skill Source                            ✕  │
│                                                │
│  Repository URL                                │
│  ┌────────────────────────────────────────────┐│
│  │ https://github.com/microsoft/azure-skills  ││
│  └────────────────────────────────────────────┘│
│                                                │
│  Version (tag, SHA, or branch)                 │
│  ┌────────────────────────────────────────────┐│
│  │ v1.0.0                                    ││
│  └────────────────────────────────────────────┘│
│                                                │
│  Path (optional — specific skill directory)    │
│  ┌────────────────────────────────────────────┐│
│  │ skills/azure-kubernetes                    ││
│  └────────────────────────────────────────────┘│
│                                                │
│  ⚠️  Using a branch (not a tag) means content  │
│     may change without notice.                 │
│                                                │
│                         [Cancel]  [Add Source]  │
└────────────────────────────────────────────────┘
```

### Skill detail view

Clicking a skill shows its content, metadata, and status:

```
┌────────────────────────────────────────────────┐
│ azure-kubernetes                            ✕  │
│                                                │
│  Author: Microsoft                             │
│  License: MIT                                  │
│  Version: 1.0.0                                │
│  Source: github.com/microsoft/azure-skills      │
│  Commit: a1b2c3d                               │
│  Size: 12KB                                    │
│  Type: Prompt skill                            │
│  Tags: azure, aks, kubernetes                  │
│                                                │
│  ── Preview ──────────────────────────────────  │
│  # Azure Kubernetes Skills                     │
│  Guide the AI assistant on Azure Kubernetes    │
│  Service operations...                         │
│  ──────────────────────────────────────────── │
│                                                │
│  [Disable]  [Remove]  [View on GitHub]         │
└────────────────────────────────────────────────┘
```

### UI design principles

1. **Progressive disclosure** — show sources first, then individual skills on expand.
2. **Trust indicators** — green checkmark for pinned versions, warning for branches, badge for verified publishers.
3. **Size budget** — always show how much of the prompt budget is used.
4. **Preview before enable** — users can read skill content before activating it.
5. **One-click disable** — individual skills can be toggled without removing the source.
6. **MCP skills are clearly labeled** — "(MCP)" badge distinguishes them from prompt-only skills.

---

## Implementation phases

### Phase 1: Prompt skills (lowest risk)
- Add `skills` config section to Headlamp settings.
- Implement Git fetching in the backend (Go) with caching.
- Inject skill content into system prompt with delimiters.
- Build settings UI for managing sources and individual skills.
- Support `SKILL.md` metadata parsing.

### Phase 2: MCP skills
- Extend `SKILL.md` format with `mcp:` section.
- Auto-register MCP servers from skill definitions.
- Reuse existing MCP proxy, approval, and permission-secret systems.
- Add "(MCP)" badge in skills UI.

### Phase 3: Skill updates and integrity
- Check for skill updates (daily by default).
- Show diff before applying updates.
- Store and verify content SHA-256.
- Audit logging of skill loads and changes.

### Phase 4: In-cluster skills
- Load skills from ConfigMap or shared volume.
- Helm `ai.skills` section for declarative skill configuration.
- Init container or CronJob for Git fetching.

### Phase 5: Tool skills (highest risk)
- Define `ToolSkill` interface extending `ToolBase`.
- Compile tool skills into the plugin bundle.
- Code review and signing requirements.
- Registry of trusted tool skill publishers.

---

## Learn: Skills resources

Curated references for understanding agent skills — the standard, how Kubernetes projects ship them, the LangChain tool model Headlamp builds on, and the broader agent architecture. Each entry explains *why* it matters for Headlamp's skills system.

### The `SKILL.md` standard

The industry is converging on a single, cross-tool format for agent skills. Understanding it is essential — Headlamp should adopt it so skills work in Copilot, Claude, Cursor, and Headlamp interchangeably.

- **[Agent Skills specification](https://agentskills.io/specification)** — The formal spec for the `SKILL.md` format: YAML front-matter schema (`name`, `description`, max lengths), folder conventions, and the "progressive loading" pattern where agents read only the description until a skill is triggered. Important because it defines the contract Headlamp's parser must implement.
- **[agentskills/agentskills](https://github.com/agentskills/agentskills)** — The canonical GitHub repo with the full spec text, a reference SDK, and example skills. The best place to verify edge cases in front-matter parsing and understand what "cross-tool compatible" means in practice.
- **[GitHub Copilot: Adding agent skills](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/add-skills)** — GitHub's official guide to creating `SKILL.md` skills. Shows the end-to-end authoring flow that Headlamp should match: write a Markdown file, drop it in a directory, and the agent picks it up.
- **[Manage agent skills with GitHub CLI](https://github.blog/changelog/2026-04-16-manage-agent-skills-with-github-cli/)** — The `gh skill install/list/remove` commands (GitHub CLI v2.90.0+). Shows the one-command install UX that Headlamp's Git-based skill loading (Phase 1b) should match.

### How Kubernetes projects ship skills

These are the projects Headlamp can directly reuse content from. They also demonstrate proven distribution patterns for Kubernetes-specific AI knowledge.

- **[fluxcd/agent-skills](https://github.com/fluxcd/agent-skills)** — The Flux project's official skills for GitOps: manifest generation, repo auditing, cluster debugging. Important because it's the best example of a CNCF project distributing AI skills via the `SKILL.md` standard. Headlamp can load this repo as a skill source out of the box.
- **[Introducing the MCP Server for Flux](https://stefanprodan.com/blog/2025/flux-mcp-server-into/)** — Stefan Prodan's blog post on the Flux MCP server. Important because it shows the architecture for connecting AI assistants to live K8s clusters via MCP — read-only modes, impersonation, secret masking. Directly informs how Headlamp's MCP skills (Phase 2) should work.
- **[microsoft/azure-skills](https://github.com/microsoft/azure-skills)** — Microsoft's curated Azure skills including AKS cluster management. Important as a reference implementation for enterprise skill repos — shows how a large organization structures, versions, and distributes domain-specific skills.
- **[robusta-dev/holmesgpt](https://github.com/robusta-dev/holmesgpt)** — Holmes, an AI-driven Kubernetes investigation tool. Important because its runbook pattern (trigger → collect evidence → AI diagnosis → report) is exactly what Headlamp's troubleshooting prompt skills should capture. Holmes' investigation patterns for CrashLoopBackOff, OOMKilled, and NodeNotReady are directly reusable as skill content.
- **[k8sgpt-ai/k8sgpt](https://github.com/k8sgpt-ai/k8sgpt)** — K8sGPT's analyzer-per-problem-type pattern (one focused diagnostic per failure mode) is a good model for structuring prompt skill content. Each analyzer's logic — what to check, what it means, what to do — can be adapted into Markdown skills.

### LangChain / LangGraph tools

Headlamp's `ToolBase` class and `ToolManager` are built on LangChain's tool abstraction. Understanding these docs is essential for implementing tool skills (Phase 5) and for any contributor extending the AI assistant.

- **[LangChain.js: Custom tools](https://js.langchain.com/docs/how_to/custom_tools/)** — How to create `DynamicTool` and `DynamicStructuredTool` with Zod schemas. Important because Headlamp's `ToolBase.createLangChainTool()` follows this exact pattern — contributors need to understand the underlying abstraction.
- **[LangChain.js: Tool calling](https://js.langchain.com/docs/concepts/tool_calling/)** — How LLMs select and invoke tools: binding tools to models, structured output, tool call messages. Important for understanding how the AI assistant decides which tools to use — the mechanism that MCP and tool skills plug into.
- **[LangGraph.js: ToolNode](https://langchain-ai.github.io/langgraphjs/reference/classes/langgraph.prebuilt.ToolNode.html)** — The prebuilt node for executing tool calls in a LangGraph agent, with parallel execution and error handling. Important because Headlamp's `ToolOrchestrator` performs similar grouping of read-only vs write tools.
- **[@langchain/mcp-adapters](https://www.npmjs.com/package/@langchain/mcp-adapters)** — The adapter that bridges MCP servers to LangChain tools. Important because this is the exact package Headlamp uses — MCP skills ultimately flow through this adapter.

### Awesome lists and skill discovery

These curated lists show the breadth of the skills ecosystem and are useful for finding specific skills to support or adapt.

- **[VoltAgent/awesome-agent-skills](https://github.com/VoltAgent/awesome-agent-skills)** — The largest curated list of agent skills (1000+), organized by provider (Anthropic, Microsoft, Vercel, Stripe, Cloudflare, etc.). Important for discovering existing skills that Headlamp users might want to load — and for understanding what the community considers a "skill" vs a "tool" vs a "plugin".
- **[libukai/awesome-agent-skills](https://github.com/libukai/awesome-agent-skills)** — Categorized skill collections with analysis of the Agent Skills standard itself. The [DeepWiki analysis](https://deepwiki.com/libukai/awesome-agent-skills/1.1-the-agent-skills-standard) is particularly useful for understanding adoption patterns and cross-tool compatibility.

### Books

- ***AI Agents and Applications: With LangChain, LangGraph, and MCP*** (2026) — Roberto Infante, Manning. The most directly relevant book: covers LangChain/LangGraph tool orchestration and MCP integration — the same stack Headlamp uses. Chapters on tool design patterns, agent evaluation, and production deployment are directly applicable.
- ***AI Agents in Action*** (2025) — Michael Lanham, Manning. Broader coverage of agent architecture: Ch. 5 "Empowering agents with actions" covers tool design, Ch. 8 covers memory systems, Ch. 10–11 cover evaluation and feedback loops. Useful for understanding the full agent lifecycle that skills plug into.
- ***Learning LangChain*** (2025) — Mayo Oshin & Nuno Campos, O'Reilly. Written by early LangChain contributors. Covers tool integrations and RAG end-to-end. Useful as a reference for contributors who need to understand the LangChain internals that Headlamp builds on.

### Conference talks and videos

- **[Beyond ChatOps: Agentic AI in Kubernetes — What Works, What Breaks, and What's Next](https://kccncna2025.sched.com/event/27Ff5/)** — KubeCon NA 2025 panel with Microsoft, Solo.io, and Robusta. Important because it covers real-world failures of K8s AI agents (hallucinations, tool misuse, evaluation gaps) — lessons that directly inform how skills should be designed and what guardrails are needed.
- **[Agent-Driven MCP for AI Workloads on Kubernetes](https://www.youtube.com/watch?v=KiFnN4h2zKE)** — KubeCon NA 2025, Microsoft. Live demo of agents automating K8s operations via MCP. Shows what MCP skills should enable in practice: GPU topology calculation, scaling, deployment — without hand-editing YAML.
- **[Agentic DevOps: Running AI MCP Tools on Kubernetes with kagent](https://agenticdevops.fm/episodes/running-ai-mcp-tools-on-kubernetes-with-kagent)** — Bret Fisher podcast. Hands-on discussion of kagent's approach to agent skills as Kubernetes CRDs, security model, and MCP integration. Useful for comparing kagent's operator-based approach with Headlamp's plugin-based approach.

### Blog posts

- **[Agent Skills, Plugins and Marketplace: The Complete Guide](https://chris-ayers.com/posts/agent-skills-plugins-marketplace/)** — Best single-article overview of the entire skills ecosystem: `SKILL.md` format, MCP servers, custom agents, hooks, marketplace. Important for understanding how all the pieces fit together and where Headlamp's skills system sits in the landscape.
- **[AI-Assisted GitOps with Flux Operator MCP Server](https://fluxcd.io/blog/2025/05/ai-assisted-gitops/)** — Official Flux blog post. Shows how MCP enables troubleshooting, config comparison, and dependency visualization in a GitOps workflow. Important because Flux is a CNCF project — their approach validates the MCP skills pattern.
- **[Kubernetes MCP Server: AI-Powered Cluster Management](https://developers.redhat.com/articles/2025/09/25/kubernetes-mcp-server-ai-powered-cluster-management)** — Red Hat's guide. Covers architecture, security, and production deployment patterns for K8s MCP servers. Important for understanding how enterprise users expect MCP skills to be deployed and secured.

---

## Skill search, selection, and routing

### The problem: skill count vs. context window

When the number of installed skills grows beyond a handful, injecting all of them into every LLM prompt becomes impractical:

- **Context window waste.** Each skill is 1–20 KB of Markdown. Ten skills can consume 50–100 KB — a significant fraction of the context window, leaving less room for conversation history, tool results, and the user's actual question.
- **Relevance dilution.** LLMs perform worse when the system prompt contains large blocks of irrelevant instructions. A user asking about pod CrashLoopBackOff doesn't need the Helmfile deployment guide or the Kubeshark installation instructions competing for attention.
- **Cost and latency.** More input tokens = higher API cost and slower time-to-first-token.

The solution is to **route** — select only the skills relevant to the current query before injecting them into the prompt.

### Industry approaches

The industry has converged on three patterns for skill/tool selection, each with different tradeoffs:

| Approach | How it works | Pros | Cons | Used by |
|----------|-------------|------|------|---------|
| **Keyword/TF matching** | Tokenize query and skill metadata, score by term overlap | Zero dependencies, fast, deterministic, works offline | Misses synonyms and semantic relationships ("pod crash" won't match "CrashLoopBackOff" unless the skill description contains both) | Current `SkillRouter` implementation |
| **Embedding similarity** | Embed skill descriptions and query into vectors, rank by cosine similarity | Handles synonyms, paraphrasing, and multilingual queries; scales to thousands of skills | Requires an embedding model (API call or local model); adds latency; needs a vector store | [LangChain tool retriever](https://python.langchain.com/docs/modules/agents/tools/dynamic_selection/), [LangGraph dynamic tool calling](https://changelog.langchain.com/announcements/dynamic-tool-calling-in-langgraph-agents) |
| **LLM-based routing** | Ask the LLM itself which skills are relevant before the main call | Highest accuracy; understands nuance and context | Adds an extra LLM call (cost + latency); recursive — the router needs its own prompt | [OpenAI function calling routing](https://platform.openai.com/docs/guides/function-calling), LangGraph router nodes |

**Hybrid** approaches combine these: keyword pre-filter → embedding re-rank → LLM final selection. This is the recommended path as the skill count grows.

### Best practices

These best practices are drawn from LangChain documentation, the agentskills.io specification, and production agent systems:

1. **Progressive loading (agentskills.io pattern).** The [agentskills.io specification](https://agentskills.io/specification) recommends that agents read only the skill `name` and `description` fields until a skill is triggered. Full content is loaded on demand. This is the most important pattern — it means routing can operate on metadata alone without reading multi-KB skill bodies.

2. **Limit injected skills to 3–5 per query.** Research and production experience consistently show that LLMs perform best with a focused set of instructions. The [LangChain agents guide](https://docs.langchain.com/oss/python/langchain/agents) recommends limiting tools to the most relevant subset. Our `SkillRouterConfig.maxSkills` defaults to 5.

3. **Write skill descriptions for routing, not for humans.** The `description` field in `SKILL.md` is the primary input to the router. It should contain the keywords and phrases a user would type — not marketing copy. Include trigger phrases, error messages, and tool names. The [GitHub Copilot skills guide](https://docs.github.com/en/copilot/how-tos/use-copilot-agents/cloud-agent/add-skills) explicitly states: "The description is used to determine when to apply the skill."

4. **Enforce a byte budget, not just a count limit.** Skills vary wildly in size (the kubeshark `network-rca` skill is 22 KB; the helmfile skill is 20 KB; a simple troubleshooting guide might be 2 KB). Counting skills alone can still blow the context window. Always enforce `maxTotalBytes` alongside `maxSkills`.

5. **Fall back to "include all" for small skill sets.** When the total number of skills is ≤ `maxSkills`, skip routing entirely and include everything. Routing adds complexity and can miss relevant skills — it's only worth the tradeoff at scale.

6. **Score on metadata, not content.** Tokenizing and matching against the full 20 KB skill body is expensive and noisy. Route on `name` + `description` + `tags` only. The content body is for the LLM, not the router.

7. **Partial/substring matching helps for Kubernetes.** Kubernetes has many compound terms (`CrashLoopBackOff`, `ImagePullBackOff`, `NotReady`, `OOMKilled`). Users often type fragments ("crashloop", "oom"). The router should match substrings, not just exact tokens.

### Current implementation: `SkillRouter`

The current implementation (`ai-common/src/skills/SkillRouter.ts`) uses **keyword/TF matching** — the simplest approach that requires zero external dependencies:

```
User query → tokenize → score against each skill's (name + description + tags) → rank → take top N within byte budget
```

**What it does well:**
- Zero dependencies — no embedding model, no vector store, no API calls.
- Deterministic — same query always routes to the same skills.
- Fast — sub-millisecond for typical skill counts (< 100).
- Respects both count (`maxSkills`) and size (`maxTotalBytes`) budgets.
- Handles compound terms via substring matching.

**What it doesn't do well:**
- No synonym understanding — "pod crash" won't match a skill that only says "CrashLoopBackOff" (unless the description contains both terms).
- No semantic understanding — "my app keeps restarting" won't match "pod failure diagnosis" without overlapping keywords.
- The O(n·m) partial matching loop in `computeRelevanceScore` is adequate for < 100 skills but would need optimization for thousands.
- Partial matching is aggressive — short tokens like "install" substring-match many unrelated terms, inflating scores for irrelevant skills.

### Integration (completed)

The skills system is fully wired into the LLM pipeline:

1. **`SkillManager.getRoutedSkillsPromptText(query, config, routerConfig?)`** — Async method that loads enabled skills, routes them for the query using the configured strategy (embedding or keyword), and returns formatted prompt text.
2. **`LangChainManager.setSkillManager(skillManager, skillsConfig)`** — Configures skills on the LLM manager. Once set, both `userSend()` and `userSendStream()` automatically compute routed skills per-message and inject them into the system prompt.
3. **`EmbeddingRouter`** — Embedding-based router using LangChain's `Embeddings` abstraction. Uses cosine similarity on skill metadata vectors. Falls back to keyword routing (`SkillRouter`) on failure.
4. **`SkillManager.setEmbeddingRouter(router)`** — Strategy pattern: pass an `EmbeddingRouter` for semantic routing, or `null` to use keyword-only routing.

Skills are routed **per-message** (not globally) so each query gets the most relevant skills injected. Errors in skill loading or routing never block the main LLM call.

### Embedding-based routing with LangChain (implemented)

The embedding-based router is implemented in `EmbeddingRouter.ts` using LangChain's `Embeddings` abstraction:

**Required packages:** The `EmbeddingRouter` uses `@langchain/core`'s `Embeddings` abstraction, which is already a dependency of `ai-common`. No additional packages are needed for the core embedding routing. The optional `@langchain/community` package would only be needed for advanced vector store integrations (e.g., HNSWLib, FAISS) if the in-memory approach becomes insufficient at scale.

**Architecture:**

```
                    ┌──────────────────────┐
                    │   Skill descriptions │
                    │   (name + desc + tags)│
                    └──────────┬───────────┘
                               │ embed once at load time
                               ▼
                    ┌──────────────────────┐
                    │   In-memory vector   │
                    │   store (MemoryVector │
                    │   Store or HNSWLib)  │
                    └──────────┬───────────┘
                               │
    User query ───embed───────►│ similarity search (top K)
                               │
                               ▼
                    ┌──────────────────────┐
                    │   Top K skills       │
                    │   (sorted by cosine  │
                    │   similarity)        │
                    └──────────┬───────────┘
                               │ format
                               ▼
                    ┌──────────────────────┐
                    │   System prompt with │
                    │   only relevant      │
                    │   skills injected    │
                    └──────────────────────┘
```

**Key design decisions for embedding routing:**

- **Embed descriptions, not full content.** Same principle as keyword routing — the description is the routing signal. Embedding 20 KB of Markdown adds noise.
- **Use the same model the user configured.** If they're using OpenAI, use `text-embedding-3-small`; if Ollama, use `nomic-embed-text`. Don't force a specific provider.
- **Re-embed on skill reload, not on every query.** Skill descriptions change rarely (hourly cache TTL). Embed at load time, store in memory, query at runtime.
- **Keep keyword routing as fallback.** If the embedding model is unavailable (offline, rate-limited, Ollama not running), fall back to `SkillRouter` keyword matching. Never fail to route.

**References:**

- [LangChain.js: Custom tools](https://js.langchain.com/docs/how_to/custom_tools/) — The tool abstraction Headlamp's `ToolBase` builds on.
- [LangChain: Dynamic tool selection (Python)](https://python.langchain.com/docs/modules/agents/tools/dynamic_selection/) — The canonical pattern for embedding-based tool retrieval. The JS equivalent uses the same vector store + retriever pattern.
- [LangGraph: Dynamic tool calling](https://changelog.langchain.com/announcements/dynamic-tool-calling-in-langgraph-agents) — LangGraph's approach to exposing different tools at each agent step. Relevant for Phase 2 (MCP skills) where different skills may expose different tool sets.
- [agentskills.io specification](https://agentskills.io/specification) — Defines the progressive loading pattern where agents read only `name`/`description` until triggered. Our routing implementation follows this pattern.
- [Agent Skills, Plugins and Marketplace: The Complete Guide](https://chris-ayers.com/posts/agent-skills-plugins-marketplace/) — Comprehensive overview of the skills ecosystem, including discovery and selection patterns.

---

## Open questions

1. **Should skills support private Git repos?** If yes, how are credentials managed? (Git credential helpers, K8s Secrets, OAuth tokens)
2. **Skill versioning conflicts** — what happens if two skill sources define the same skill name? (Namespace by source: `azure-skills/azure-kubernetes`)
3. **Skill dependencies** — can one skill depend on another? (Keep it simple: no dependencies for now)
4. **Rate limiting on Git fetches** — how to avoid hitting GitHub API rate limits? (Cache aggressively, use conditional requests with ETags)
5. **Skill-specific tool approval** — should skills be able to declare "this skill's tools are safe for auto-approval"? (No — approval is always user/admin controlled)
6. **Embedding model for skill routing** — when upgrading from keyword to embedding-based routing, should we use the same model the user configured for chat, or a dedicated lightweight embedding model? (Use the same provider but a small embedding model — e.g., `text-embedding-3-small` for OpenAI, `nomic-embed-text` for Ollama)
7. **Routing transparency** — should the UI show which skills were selected for a query and their scores? (Yes — useful for debugging and for skill authors to improve descriptions)
