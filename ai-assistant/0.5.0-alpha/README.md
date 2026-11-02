# Headlamp AI Assistant

The Headlamp AI Assistant is a plugin that integrates AI capabilities directly into Headlamp. It provides a conversational interface to interact with your Kubernetes clusters, helping you manage resources, troubleshoot issues, and understand complex configurations through natural language.

The assistant is context-aware, meaning it uses information about your cluster to provide more relevant and accurate responses.

**IMPORTANT:** This plugin is in alpha state!

## End-to-end tests

`npm run e2e` runs the complete cross-platform harness in `e2e/run-ai-assistant-e2e.ts`. It builds the plugin and Headlamp image, creates two isolated KWOK clusters and the test fixtures, and runs the Playwright scenarios.

`npm run e2e:playwright` runs only the Playwright scenarios against an already running Headlamp instance. It does not build Headlamp or create the KWOK cluster. See [e2e/README.md](e2e/README.md) for setup and configuration.

## Key Features

- **Conversational Kubernetes Management**: Interact with your cluster using natural language. Ask questions, get explanations, and issue commands.
- **Context-Aware Assistance**: The AI has access to cluster information, making its responses relevant to your current setup.
- **Multi-Provider Support**: Choose from a wide range of AI providers.
- **Configurable Tools**: Fine-tune the AI's capabilities by enabling or disabling specific tools, like direct Kubernetes API access.
- **Resource Generation**: Ask the AI to generate Kubernetes YAML manifests for deployments, services, and more.
- **Review and Apply**: Open suggested YAML in the editor and apply it to the chosen
  cluster, including from global pages such as settings. The editor shows the target
  cluster before you apply and names it on the Apply button. A response's Kubernetes
  requests supply its target, so older manifests retain their own cluster context.
  Failed mutations retain their requested target too, so mixed-cluster recovery
  suggestions still require an explicit choice.
  Their redacted error summaries remain available to follow-up chat even after
  unmatched tool messages are removed.
  If several clusters were involved, or no request context is available with several
  configured clusters, choose one explicitly in the editor. Applying never fans out
  to multiple clusters. Navigation or later chat responses cannot change an open
  editor's target; only an explicit selection can. Standalone editors capture their
  route cluster on opening too; reopening refreshes it. Missing or unavailable targets
  disable Apply.
  Standalone editors validate availability against Headlamp's current configuration;
  a removed cluster disables Apply without selecting a replacement.
  Background diagnosis YAML always requires an explicit target: an event's source
  cluster does not prove which cluster the diagnosis agent actually queried.
- **In-depth Analysis**: Get help diagnosing issues, understanding resource configurations, and interpreting logs.

## Supported Providers

The plugin supports multiple AI providers, allowing you to choose the one that best fits your needs:

- **OpenAI** (GPT models)
- **Azure OpenAI Service**
- **Anthropic** (Claude models)
- **Mistral AI**
- **Google** (Gemini models)
- **DeepSeek** (deepseek-v4-flash, deepseek-v4-pro)
- **OpenAI-Compatible** (vLLM, llama.cpp, and other OpenAI-compatible servers)
- **Local Models** (via Ollama)

You will need to provide your own API keys and endpoint information for the provider you choose to use. Please note that using AI providers may incur costs, so check the pricing details of your chosen provider.

### Model catalog lifecycle

The model catalog contains suggestions, not an exhaustive allowlist. You can
enter an unlisted model name in settings. Removing a suggestion or changing a
default does not rewrite saved configurations; configured models remain
selectable in chat. Provider retirement can still make an existing configuration
stop working, so migrate it before the provider's deadline.

The catalog was reviewed against first-party documentation on **November 4, 2026**:

| Provider             | Lifecycle guidance                                                                                                                                                                                                                   |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GitHub-hosted models | Settings prefer live discovery when available. Static suggestions and the detection fallback use current models, with `gpt-5.6-sol` as the fallback default. Availability depends on your plan and organization policy.              |
| OpenAI               | GPT-4.1/4o variants retire January 14, 2027; GPT-5.1 retires April 1, 2027. GPT-6 models use the Responses API to support tool calling with their default reasoning settings.                                                        |
| Azure OpenAI         | `o3`, `o3-mini`, and `o4-mini` retire November 19, 2026. New configurations default to `gpt-5.4`; set the model to match your actual deployment. A catalog change does not create, upgrade, or migrate an Azure deployment.          |
| Anthropic            | Claude Opus, Sonnet, and Haiku 5.5 are available as suggestions. The existing Sonnet 5 default is unchanged.                                                                                                                         |
| Mistral              | Medium 3.5 and Large 3, including their documented aliases, are deprecated and retire April 30, 2027. New configurations default to the GA `mistral-small-2603`. `mistral-large-4` is an opt-in **public preview**, not the default. |
| Gemini               | Deprecated 3.7/3.5 Flash aliases already redirect. Gemini 2.5 Pro/Flash requests switch models and billing December 1, 2026; migrate explicitly rather than relying on automatic routing. The default remains `gemini-3.8-flash`.    |

Sources:
[GitHub supported models](https://docs.github.com/en/copilot/reference/ai-models/supported-models),
[OpenAI deprecations](https://developers.openai.com/api/docs/deprecations),
[OpenAI model reference](https://developers.openai.com/api/docs/models),
[Azure retirement schedule](https://learn.microsoft.com/en-us/azure/foundry/openai/concepts/model-retirement-schedule),
[Anthropic model reference](https://platform.claude.com/docs/en/models/overview),
[Mistral model reference](https://docs.mistral.ai/models.md), and
[Gemini deprecations](https://aistudio.google.com/docs/deprecations).

When refreshing the catalog, verify exact API identifiers, tool calling, endpoint
compatibility, and lifecycle status separately for each provider. Do not infer
Azure or GitHub availability from the direct OpenAI API. Keep settings options,
chat suggestions, defaults, and lifecycle tests consistent. Compatibility tests
exercise the installed SDKs with mocked HTTP responses; they do not prove account
access or replace live inference checks. Local model names must match installed
Ollama models or the model name served by the configured compatible endpoint.

### Settings layout

Configure providers first, then features and tool permissions.
Configured providers appear as compact rows with their model, default indicator,
and management menu. MCP servers, skills, and supported agent integrations use
the same section layout. Test mode, onboarding resets, and developer overrides
are grouped under **Advanced**, collapsed by default; active test mode and
developer overrides remain indicated in its summary.
**Add Repository** is a filled primary action until changes are pending, when
it becomes outlined so **Save Changes** has the strongest emphasis.
Section-level actions share one header row, with the primary action on the
right. MCP and Skills summaries and staged **Discard / Save Changes** actions
use matching footers below their content; immediate-save toggles remain immediate.

Headlamp supplies native section headings through layout slots, using level-two
headings above level-three subsections. Descriptive settings use flexible label
columns and trailing controls rather than the native
fixed name/value split, so helper text can use the available width.
Standalone UI consumers retain MUI fallbacks. This presentation
change does not alter saved configurations, approval behavior, or platform
availability.

The global MCP enable switch applies immediately; server edits require **Save
Changes**. Configuration controls and Discard are locked during persistence to
prevent edits from being overwritten by an in-flight save. Failed saves retain
staged changes and re-enable the controls for correction or retry.

## Skills and Documentation

In the AI Assistant settings, enable **Kubernetes Docs** under **Suggested Skill
Repositories** to load the pinned English **Concepts** section of the official
Kubernetes documentation. This subset stays below the 10 MiB download/extraction
limit; the full documentation tree exceeds it. Previously saved, unmodified
Kubernetes Docs suggestions are upgraded to the Concepts path while preserving
their enabled state. Custom refs, paths, and content hashes are left unchanged.
If a Concepts source is already configured, it takes precedence over the old
suggestion, retaining its ref, content hash, and enabled state.

Generic Markdown pages with a nonempty `title` in YAML front matter and a
nonempty body can be loaded as documentation skills. Their title supplies the
display name and description. `SKILL.md` files still require `name` and
`description`, and the existing per-skill and total prompt size limits still apply.

### Inspektor Gadget

**Inspektor Gadget** is available under **Suggested Skill Repositories**. Its
Kubernetes and Linux troubleshooting skills are opt-in on every host, including
AKS Desktop. Enable the source manually to load them; existing AKS skill defaults
are unchanged.

The source is pinned to commit `47d8e5176a46fd906bc3585bbf9f4786cc440576` and
verified against a SHA-256 content hash. Disabling, removing, or customizing it
is respected on subsequent starts. Enabling the skills does not install or run
Inspektor Gadget: Kubernetes tracing requires the `kubectl gadget` plugin and
an in-cluster Gadget deployment, while standalone Linux tracing requires `ig`
and the appropriate host privileges.

The Gadget source includes its verified `references/*.md` companions and resolves
explicit relative Markdown references from the same verified download. The Linux
skill includes the five shared Kubernetes domain playbooks even when the
Kubernetes skill is disabled or not selected by routing. References are shown with
the owning skill and included when that skill is selected for the assistant's
prompt, so installation instructions and domain playbooks remain available.
Each source document retains the per-file byte limit, and the complete
skill plus references counts against the total prompt budget.
Other Git sources can opt into this behavior with `includeReferences: true`;
sources without that option keep their existing loading behavior.

## Adding Holmes Agent to Your Cluster

The AI Assistant can connect to a [HolmesGPT](https://holmesgpt.dev) agent running in your cluster for enhanced Kubernetes diagnostics and troubleshooting. Follow the steps below to deploy Holmes.

### 1. Add the Robusta Helm Repository

```bash
helm repo add robusta https://robusta-charts.storage.googleapis.com
helm repo update
```

### 2. Create a `values.yaml`

Below is an example using Azure OpenAI. For other providers (OpenAI, AWS Bedrock, etc.), see the [HolmesGPT installation docs](https://holmesgpt.dev/latest/installation/kubernetes-installation/#installation).

```yaml
# values.yaml
image: robustadev/holmes:0.19.1

additionalEnvVars:
  - name: AZURE_API_KEY
    value: ''
  - name: AZURE_API_BASE
    value: 'https://<your-azure-endpoint>.openai.azure.com'
  - name: AZURE_API_VERSION
    value: '2024-02-15-preview'
# Or load from secret:
# - name: AZURE_API_KEY
#   valueFrom:
#     secretKeyRef:
#       name: holmes-secrets
#       key: azure-api-key
# - name: AZURE_API_BASE
#   valueFrom:
#     secretKeyRef:
#       name: holmes-secrets
#       key: azure-api-base

modelList:
  azure-gpt4:
    api_key: '{{ env.AZURE_API_KEY }}'
    model: azure/gpt-5
    api_base: '{{ env.AZURE_API_BASE }}'
    api_version: '{{ env.AZURE_API_VERSION }}'
```

### 3. Render and Patch the Helm Template

Holmes requires enabling the AG-UI server for the AI Assistant to communicate with it. Render the template and update the container command:

```bash
helm template holmesgpt robusta/holmes -f values.yaml > rendered.yaml
```

In `rendered.yaml`, find the container command and change it to:

```yaml
command: ['python3', '-u', '/app/experimental/ag-ui/server-agui.py']
```

### 4. Deploy to Your Cluster

```bash
kubectl apply -f rendered.yaml
```

## Background AI diagnoses

Enable proactive diagnosis in the plugin settings to analyze recent warning events.
Diagnoses and the conversation share one scroll area; result cards start compact
and expand to show the analysis, investigation activity, and reviewable YAML.

- The overview shows cluster scope, event-check time, and separate ready/failed counts.
- Failed event reads remain errors during retry backoff, rather than appearing
  as successful checks with no warning events.
- Pause defers queued analyses after the current item finishes; it does not abort
  a provider stream. Resume continues the remaining queue. A new explicit
  single-event analysis can still run while background work is paused.
- You can draft while analysis runs. Sending pauses background work and queues the
  message behind the current item. Cancelling restores the queued message if the
  draft is empty; an existing draft is preserved. Resume background analysis explicitly when ready.
  Changing provider, model, or cluster cancels a queued send so the message can be reviewed.
- Closing the panel detaches its diagnosis provider without aborting an active
  analysis. New requests wait for the current provider setup when the panel reopens.
- Retry failed analyses, analyze an individual result again, or dismiss it.
  Dismissing hides that event from automatic checks; it does not fix the resource.
- Opening a diagnosis from Events expands and focuses its header, including cached
  results when the panel reopens. This pauses automatic chat following so it does
  not scroll past the result. Keyboard-focused headers have a visible outline.
- Check again explicitly refreshes analyses in the current scope and can incur AI
  provider usage. Open resource to inspect current health after a change:
  "Analysis ready" and a successful API write do not mean an incident is resolved.

Generic AI entry points and attribution use the same offline sparkle mark.
Provider logos and operation/status icons retain their distinct meanings.

## MCP (Model Context Protocol) Server Support

The AI Assistant supports [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) servers, allowing you to extend the assistant's capabilities by connecting it to external tools and data sources.

> **Note:** MCP server support is currently available only in the **Headlamp desktop application**.

### What is MCP?

MCP is an open protocol that enables AI assistants to interact with external tools and services. By configuring MCP servers, you can give the AI Assistant access to specialized tools — for example, connecting it to [Flux](https://fluxcd.io/) for GitOps management or any other MCP-compatible tool.

### Configuring MCP Servers

Navigate to the AI Assistant settings to add and manage MCP servers. Each server is configured with:

- **Name** — A unique identifier for the server.
- **Command** — The executable to run (e.g., `flux-operator-mcp`).
- **Args** — Command-line arguments (e.g., `serve --kube-context HEADLAMP_CURRENT_CLUSTER`).
- **Environment Variables** — Optional env vars required by the server (e.g., `KUBECONFIG`).

You can configure servers using the form-based UI or by editing the JSON configuration directly.

![MCP Servers List](mcp-servers-list.png)

![MCP Config Editor](mcp-config.png)

### Managing MCP Tools

Once servers are configured, the assistant automatically discovers the tools they expose. You can:

- Enable or disable individual tools per server.
- View tool descriptions and input schemas.
- Track tool usage statistics.
- Use bulk operations to enable or disable all tools at once.
