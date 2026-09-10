# Provider Auto-Detection

Automatically detects available AI providers on the user's machine — no manual API key entry required.

## Supported providers

| Provider | Detection method | Auth |
|----------|-----------------|------|
| **GitHub Copilot** | `gh auth token` → validate → model catalog | Sentinel `__GH_CLI_AUTH__` (token refreshed at runtime) |
| **Azure OpenAI** | `az` CLI → account enumeration → deployment filtering | Sentinel `__AZ_CLI_AUTH__` (key refreshed at runtime) |
| **Ollama** | HTTP probe to `localhost:11434` | None |

## Architecture

Detection logic is in `ai-common/src/providers/providerAutoDetect.ts` (platform-agnostic). It receives a `CommandRunner` from the host app for CLI execution.

UI is in `ai-ui/src/components/settings/`:
- `AutoDetectProvider.tsx` — Dialog + `useAutoDetect()` hook
- `ModelSelector` — Integrates the "Auto Detect" button

### Flow

```
User clicks "Auto Detect"
    → useAutoDetect() → detectProviders(existingConfigs, dismissedKeys, commandRunner)
        ├── detectCopilotProvider()   → gh auth token → validate → model catalog
        ├── collectAzureOpenAIProviders() → az account → list accounts → deployments
        └── detectOllamaProvider()    → HTTP GET localhost:11434/api/tags
    → DetectedProvidersDialog → User adds or dismisses
```

## Security

- **Command allowlist**: Only `gh` and `az` are permitted.
- **15 s timeout** on all CLI commands.
- **Sentinel values**: Real tokens are never stored in config. Sentinel strings are stored; actual tokens are fetched from CLI only at model-creation time via `refreshGitHubToken()` / `refreshAzureOpenAIKey()`.

## Dismissal & deduplication

Dismissed providers are tracked by key (`copilot`, `local`, `azure:<accountName>`) and excluded on subsequent detection runs. Providers already in the user's config are also excluded.

## Tests

- `ai-common/src/providers/providerAutoDetect.test.ts` — core detection logic
- `ai-ui/src/components/settings/AutoDetectProvider.test.ts` — UI orchestration

```bash
packages/ai-common
npx vitest run src/providers/providerAutoDetect.test.ts
```
