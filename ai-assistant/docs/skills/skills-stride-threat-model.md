# STRIDE Threat Model: Headlamp AI Skills System

## 1. System Overview

The skills system loads Markdown documents ("skills") and injects them into the AI assistant's system prompt. Skills come from:

1. **Local directories** — files on disk (configured paths or well-known project directories)
2. **Auto-discovered project directories** — `.github/skills/`, `.github/instructions/`, `.claude/skills/`, `skills/` scanned automatically when a project is opened
3. **Remote Git repositories** — GitHub zip archives downloaded over HTTPS

### Components

| Component | File | Role |
|-----------|------|------|
| **SkillManager** | `SkillManager.ts` | Loading, caching (1h TTL), filtering, prompt injection |
| **SkillLoader** | `SkillLoader.ts` | Reads local files or downloads GitHub zip archives |
| **skillParser** | `skillParser.ts` | Parses YAML front-matter + Markdown; size limits |
| **SkillConfigManager** | `SkillConfigManager.ts` | Persists sources, enabled/disabled skills, size budgets |

### Data Flow

```
User Config (sources, enabled skills)
        │
        ▼
  SkillManager.loadAllSkills(config)
        │
        ├── Local source ──► SkillLoader.loadFromDirectory()
        │                        ▼
        │                   fs.readFile() → parseSkillFile()
        │
        ├── Auto-discovery ► SkillLoader.loadFromWellKnownDirs(projectRoot)
        │                        ▼
        │                   scans .github/skills/, .github/instructions/,
        │                   .claude/skills/, skills/ → parseSkillFile()
        │
        └── Git source ───► SkillLoader.loadFromGitRepo()
                                 ├─ isValidGitUrl() — host allowlist
                                 ├─ buildGitHubZipUrl() — API URL (GitHub only)
                                 ├─ httpClient.fetchZip() — download
                                 ├─ zipExtractor.extractTextFiles() — decompress
                                 └─ parseSkillFile() — parse each file
        │
        ▼
  In-memory cache (Map<sourceKey, ParsedSkill[]>)
        │
        ▼
  formatSkillsForPrompt()
        │
        ▼
  Injected into LLM system prompt (includes skill name, source path/URL, version)
        │
        ▼
  Sent to LLM provider
```

### Trust Boundaries

1. **User ↔ Config** — user-provided source URLs and settings
2. **App ↔ Filesystem** — reading local skill files
3. **App ↔ Workspace** — auto-discovered skill dirs in opened projects
4. **App ↔ Network** — downloading zip archives from GitHub API
5. **App ↔ LLM Provider** — prompt content (including skill text and source paths) sent to external model

---

## 2. STRIDE Analysis

### S — Spoofing

#### S1: Typosquatted Git Repository

| | |
|---|---|
| **Threat** | A source could point to a lookalike repo (e.g., `github.com/micros0ft/azure-skills`). |
| **Mitigation** | `isValidGitUrl()` restricts to HTTPS on `github.com`, `gitlab.com`, `bitbucket.org`. But any user/org on those hosts can publish a repo. **Note:** `isValidGitUrl()` accepts GitLab/Bitbucket URLs, but `buildGitHubZipUrl()` only works with GitHub — downloading from GitLab/Bitbucket will fail at runtime. |
| **Risk** | **Medium** |
| **Fix** | Show full repo URL and owner prominently in UI when adding sources. Warn on first use of a new source. |

#### S2: Skill Name Collision

| | |
|---|---|
| **Threat** | Enable/disable is keyed only on `skill.metadata.name`. A malicious source can reuse a trusted skill's name, causing the wrong skill to be active or making disable ineffective. |
| **Mitigation** | None. |
| **Risk** | **Medium** |
| **Fix** | Use `source + name` as the skill identity for enable/disable and display. |

#### S3: Writable Local Skill Directory

| | |
|---|---|
| **Threat** | If the skill directory is writable by other users, they can plant malicious skills. |
| **Mitigation** | None. |
| **Risk** | **Low** (single-user desktop), **Medium** (shared systems). |
| **Fix** | Warn if directory has overly permissive permissions. |

---

### T — Tampering

#### T1: No Integrity Verification for Downloaded Skills

| | |
|---|---|
| **Threat** | Downloaded content has no hash verification. The `ref` defaults to `"main"`, which can be force-pushed — content is silently mutable. |
| **Mitigation** | HTTPS only. **No SHA verification. No version pinning enforced.** |
| **Risk** | **High** |
| **Fix** | **(1)** Require commit SHA or tag as `ref`; warn on branch names. **(2)** Hash individual extracted skill files (not the zip archive, which GitHub generates non-deterministically). **(3)** Add `sha256` field to `SkillSource` for pinning. **(4)** On reload, compare hashes and alert on change. |

#### T2: Stale Cache After Source Removal

| | |
|---|---|
| **Threat** | Skills are cached for 1 hour. If a malicious source is removed, its skills stay injected until cache expires. `getEnabledSkills()` filters by skill name, not source. |
| **Mitigation** | None. |
| **Risk** | **Medium** |
| **Fix** | Invalidate cache when sources change. Filter cached skills by active sources. |

#### T3: Local File or Config Tampering

| | |
|---|---|
| **Threat** | Malware could modify skill files on disk or the config store between loads. |
| **Mitigation** | None. |
| **Risk** | **Low** — if the filesystem is compromised, the attacker has broader access. |
| **Fix** | Log when skill content changes between loads. |

---

### R — Repudiation

#### R1: No Audit Log

| | |
|---|---|
| **Threat** | Source add/remove, skill loads, and prompt injections are not logged. A compromised process could add a source, use it, and remove it with no trace. |
| **Mitigation** | Only load errors are logged (`console.warn`). |
| **Risk** | **Medium** |
| **Fix** | Log source config changes, skill load events (source, ref, count, hashes), and which skills were injected into each prompt. |

---

### I — Information Disclosure

#### I1: Prompt Injection via Skill Content

| | |
|---|---|
| **Threat** | A malicious skill can contain prompt injection ("Ignore previous instructions...") to make the LLM exfiltrate sensitive data from the conversation (Kubernetes secrets, credentials). |
| **Mitigation** | Skills are wrapped in `<skill>` tags — but **metadata and content are not escaped**, so a skill can break the tag structure and inject arbitrary prompt text. Size limits exist (50KB/skill, 200KB total) but don't prevent injection. **No content sanitization.** |
| **Risk** | **High** |
| **Fix** | (1) Escape `<` and `>` in skill content and metadata before prompt injection. (2) Add a post-skills system instruction that reasserts base policy and tool approval rules. (3) Attribute tool calls to originating skills in the approval UI. Pattern scanning alone is insufficient — it's trivially bypassed. |

#### I2: Source Paths Sent to LLM Provider

| | |
|---|---|
| **Threat** | `formatSkillsForPrompt()` embeds `skill.source` (full filesystem path or URL) into the prompt, which is sent to the LLM provider. Local paths can disclose usernames, repo structure, or internal mount points. |
| **Mitigation** | None. |
| **Risk** | **Medium** |
| **Fix** | Use relative paths or anonymized identifiers in prompt-injected metadata. Keep full paths for local logs only. |

#### I3: MCP URLs in Metadata (Future)

| | |
|---|---|
| **Threat** | `SkillMetadata.mcp` can contain server URLs and commands. If exposed in UI, logs, or prompt, internal service URLs leak. |
| **Mitigation** | Not yet consumed (Phase 2/3). |
| **Risk** | **Low** now, **Medium** when activated. |
| **Fix** | Mask MCP URLs/args in logs and UI. |

---

### D — Denial of Service

#### D1: ZIP Bomb

| | |
|---|---|
| **Threat** | A malicious repo could contain a zip bomb — small archive that expands to gigabytes, exhausting memory during extraction. |
| **Mitigation** | **None.** The `SkillZipExtractor` interface has no size limits. Skills are size-checked only after extraction completes. |
| **Risk** | **High** |
| **Fix** | **(1)** Enforce max extracted size (e.g., 10MB). **(2)** Limit file count (e.g., 500). **(3)** Stream-extract with size accounting. |

#### D2: `.instructions.md` Bypasses Size Limit

| | |
|---|---|
| **Threat** | `parseCopilotInstructionsFile()` computes `contentSizeBytes` but never enforces `maxSkillSizeBytes`, unlike `parseSkillFile()`. An arbitrarily large `.instructions.md` file is accepted. |
| **Mitigation** | None. |
| **Risk** | **Medium** |
| **Fix** | Enforce the same size limit in `parseCopilotInstructionsFile()`. |

#### D3: Config Size Limit Not Wired Through

| | |
|---|---|
| **Threat** | `SkillsConfig.maxSkillSizeBytes` is stored in config but never passed to `SkillLoader`. The loader always uses the hardcoded default (50KB). User-configured limits are ignored. |
| **Mitigation** | None — this is a bug. |
| **Risk** | **Low** |
| **Fix** | Pass `config.maxSkillSizeBytes` to `SkillLoader` during construction or per-load. |

#### D4: Hanging HTTP Requests

| | |
|---|---|
| **Threat** | A slow or unresponsive Git source could block skill loading indefinitely. |
| **Mitigation** | No timeout specified in `SkillHttpClient.fetchZip()`. |
| **Risk** | **Medium** |
| **Fix** | Enforce request timeout (e.g., 30s). Add max response size limit. |

#### D5: Excessive Sources

| | |
|---|---|
| **Threat** | Hundreds of configured sources or skills per source causing excessive network and memory use. |
| **Mitigation** | None. |
| **Risk** | **Low** |
| **Fix** | Cap sources (e.g., 20) and skills per source (e.g., 100). |

---

### E — Elevation of Privilege

#### E1: Auto-Discovery of Untrusted Project Skills

| | |
|---|---|
| **Threat** | `loadFromWellKnownDirs()` auto-loads skills from `.github/skills/`, `.github/instructions/`, `.claude/skills/`, and `skills/` in the opened project. Cloning or opening an untrusted repo injects attacker-controlled content into the system prompt — no user approval needed. |
| **Mitigation** | None. |
| **Risk** | **High** |
| **Fix** | **(1)** Require user opt-in before loading workspace skills from a new project. **(2)** Show a confirmation dialog listing discovered skills. **(3)** Allow users to trust/distrust projects. |

#### E2: MCP Command Injection (Future)

| | |
|---|---|
| **Threat** | `SkillMetadata.mcp` supports `command` and `args` for stdio transport. When wired up, a malicious skill could execute arbitrary commands. |
| **Mitigation** | Not yet executed (Phase 2/3). Existing MCP infra has approval/proxy mechanisms. |
| **Risk** | **Critical** when implemented. |
| **Fix** | Require explicit user approval per MCP skill. Validate commands against an allowlist. Sandbox stdio execution. |

#### E3: Prompt Injection → Unauthorized Tool Calls

| | |
|---|---|
| **Threat** | A skill could instruct the LLM to call destructive tools (e.g., "always run `kubectl delete`"). |
| **Mitigation** | Tool execution goes through approval flow. Skills cannot directly execute code. |
| **Risk** | **Medium** — depends on user vigilance in approval dialogs. |
| **Fix** | Show skill attribution in tool approval dialog. Flag tool calls influenced by skill content. |

#### E4: Path Traversal in Local Loading

| | |
|---|---|
| **Threat** | `subPath` in `loadFromDirectory()` is joined without validation. A path like `../../etc/passwd` could read files outside the skill directory. For remote zips, entry paths are in-memory map keys (not written to disk), so the risk is limited to reading content into the skill cache. |
| **Mitigation** | None. |
| **Risk** | **Medium** for local sources (user-controlled path), **Low** for zip entries (in-memory only). |
| **Fix** | Resolve paths with `path.resolve()` and verify they stay within the base directory. |

---

## 3. Summary

| ID | Category | Threat | Severity | Status |
|----|----------|--------|----------|--------|
| **T1** | Tampering | No integrity verification for downloads | **High** | ❌ Not mitigated |
| **D1** | DoS | ZIP bomb | **High** | ❌ Not mitigated |
| **I1** | Info Disclosure | Prompt injection via skill content | **High** | ❌ Not mitigated |
| **E1** | EoP | Auto-discovery of untrusted project skills | **High** | ❌ Not mitigated |
| **E2** | EoP | MCP command injection (future) | **Critical** (future) | ⚠️ Not yet exploitable |
| **S2** | Spoofing | Skill name collision | **Medium** | ❌ Not mitigated |
| **T2** | Tampering | Stale cache after source removal | **Medium** | ❌ Not mitigated |
| **R1** | Repudiation | No audit log | **Medium** | ❌ Not mitigated |
| **I2** | Info Disclosure | Source paths sent to LLM provider | **Medium** | ❌ Not mitigated |
| **D2** | DoS | `.instructions.md` bypasses size limit | **Medium** | ❌ Not mitigated |
| **D4** | DoS | Hanging HTTP requests | **Medium** | ❌ Not mitigated |
| **E3** | EoP | Prompt injection → tool calls | **Medium** | ⚠️ Partial (approval flow) |
| **E4** | EoP | Path traversal | **Medium** | ❌ Not mitigated |
| **S1** | Spoofing | Typosquatted repos | **Medium** | ⚠️ Partial (host allowlist) |
| **S3** | Spoofing | Writable skill directory | **Low** | ❌ Not mitigated |
| **T3** | Tampering | Local file/config tampering | **Low** | ❌ Not mitigated |
| **D3** | DoS | Config size limit not wired | **Low** | ❌ Bug |
| **D5** | DoS | Excessive sources | **Low** | ❌ Not mitigated |
| **I3** | Info Disclosure | MCP URLs in metadata | **Low** | ❌ Not mitigated |

## 4. Recommended Actions (Priority Order)

### 1. Add integrity verification for downloads (T1) — HIGH
- Require commit SHA or tag as `ref`; warn on branch names
- Hash extracted skill files and store hashes in config
- Add `sha256` field to `SkillSource` for pinning
- Alert on hash mismatch on reload

### 2. Add ZIP extraction safeguards (D1) — HIGH
- Max extracted size (10MB), max file count (500)
- Validate entry paths (no `../` sequences)

### 3. Require opt-in for workspace skill auto-discovery (E1) — HIGH
- Prompt user before loading skills from a new project
- Allow trust/distrust per project

### 4. Fix prompt injection surface (I1, I2) — HIGH
- Escape metadata in prompt-injected `<skill>` tags
- Use relative/anonymized paths in prompt (not full filesystem paths)
- Add post-skills system instruction reinforcing base policy

### 5. Fix `.instructions.md` size limit bypass (D2) — MEDIUM
- Enforce `maxSkillSizeBytes` in `parseCopilotInstructionsFile()`

### 6. Fix skill identity and cache (S2, T2) — MEDIUM
- Use `source + name` for skill identity
- Invalidate cache on source config changes

### 7. Wire through config size limit (D3) — LOW
- Pass `config.maxSkillSizeBytes` to `SkillLoader`

### 8. Add audit logging (R1) — MEDIUM
- Log source changes, load events, and prompt injection

### 9. Add HTTP safeguards (D4) — MEDIUM
- Timeout on fetch requests (30s)
- Max response size

### 10. Prepare MCP skill security (E2) — FUTURE
- Require user approval, command allowlist, sandbox execution

