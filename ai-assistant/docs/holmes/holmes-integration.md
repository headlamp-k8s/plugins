# HolmesGPT Integration

The HolmesGPT integration helps teams troubleshoot Kubernetes by turning cluster signals into clear explanations. It helps you understand what is happening and what to do next while you stay focused on the workload you are investigating.

This works well because the AI Assistant is context aware. It can use the cluster context you are already viewing to provide more relevant diagnostics.

HolmesGPT runs as an agent in your cluster. The AI Assistant connects to that agent to provide enhanced diagnostics and troubleshooting.

## Why Use HolmesGPT with the AI Assistant

Troubleshooting often requires pulling signals from many places. Logs show one symptom. Events show another. Resource state adds more detail, but it can still be hard to see the cause.

The AI Assistant already helps you inspect workloads and related resources. HolmesGPT adds reasoning on top of that context. It helps connect signals across resources and controller behavior so you can move from symptoms to likely causes faster.

This is most useful during active investigation. You can ask questions in plain language and get answers that match the workload and state you are looking at.

## Architecture

The AI Assistant communicates with HolmesGPT through the [AG-UI protocol](https://docs.ag-ui.com/). The integration is composed of three layers:

1. **`HolmesAgent`** (`@headlamp-k8s/ai-common/agent/holmesClient`) — wraps `@ag-ui/client`'s `HttpAgent` to communicate with the Holmes AG-UI server via SSE. Manages conversation threads, message history, and event subscriptions.

2. **Kubernetes Service proxy** — requests are routed through the Kubernetes API server's service proxy (`/api/v1/namespaces/{ns}/services/{svc}:{port}/proxy`). The `getHolmesServiceProxyPath()` function builds this path.

3. **Injectable `ClusterRequestFn`** — the cluster request function is injected by the host application (e.g. headlamp-plugin's `clusterRequest`), keeping `ai-common` free of platform-specific dependencies.

```
AI Assistant  →  ClusterRequestFn  →  K8s API Server  →  Service Proxy  →  Holmes Pod
                 (injected)            (proxy path)        (ag-ui/chat)
```

## Requirements

- The AI Assistant plugin installed and enabled.
- An AI provider configured for the AI Assistant. The plugin supports multiple providers and requires your provider credentials and endpoint information.
- Permission to deploy resources into the cluster where you want to run the HolmesGPT agent.

## Configure the AI Assistant

Before you install HolmesGPT, configure the AI Assistant so it can run and answer prompts.

### Step 1: Install and enable the AI Assistant plugin

The AI Assistant is available as a plugin. Once installed and enabled, it appears in the UI as a chat experience.

### Step 2: Configure an AI provider

The AI Assistant supports multiple AI providers. You must provide your own API keys and endpoint information for the provider you choose.

Once a provider is configured, the AI Assistant can respond to cluster questions and use cluster context to improve relevance.

### Step 3: Confirm the AI Assistant works before adding HolmesGPT

Before installing HolmesGPT, confirm the assistant is functioning with your provider. A quick check is to ask a simple cluster question such as "Is my application healthy" or "What is wrong here" while viewing a workload.

When this works, you are ready to add HolmesGPT for deeper diagnostics.

## Install the HolmesGPT Agent

The AI Assistant connects to a HolmesGPT agent that runs in your cluster. The steps below assume you have already configured the AI Assistant.

### Step 1: Add the Robusta Helm repository

```bash
helm repo add robusta https://robusta-charts.storage.googleapis.com
helm repo update
```

### Step 2: Create a values file

Create a file named `values.yaml`. The example below uses Azure OpenAI as the provider.

```yaml
image: robustadev/holmes:0.19.1
additionalEnvVars:
  - name: AZURE_API_KEY
    value: ''
  - name: AZURE_API_BASE
    value: 'https://<your-azure-endpoint>.openai.azure.com'
  - name: AZURE_API_VERSION
    value: '2024-02-15-preview'

modelList:
  azure-gpt4:
    api_key: '{{ env.AZURE_API_KEY }}'
    model: azure/gpt-5
    api_base: '{{ env.AZURE_API_BASE }}'
    api_version: '{{ env.AZURE_API_VERSION }}'
```

If you use a different provider, adjust the values for your provider accordingly.

### Step 3: Render the manifest and enable the AG-UI server

The AI Assistant requires the AG-UI server to be enabled so it can communicate with Holmes.

Render the chart to a file:

```bash
helm template holmesgpt robusta/holmes -f values.yaml > rendered.yaml
```

Open `rendered.yaml` and update the container command to enable the AG-UI server:

```yaml
command: ['python3', '-u', '/app/experimental/ag-ui/server-agui.py']
```

### Step 4: Apply the rendered manifest

```bash
kubectl apply -f rendered.yaml
```

## Using HolmesGPT

Once the agent is running, open the AI Assistant to troubleshoot.

A good first test is to open a workload that looks unhealthy and ask a direct question. For example, you can ask what is wrong or why a pod is restarting. The AI Assistant uses cluster context and provides troubleshooting help in natural language.

## Programmatic Usage

The `holmesClient` module in `@headlamp-k8s/ai-common` provides the building blocks for integrating with HolmesGPT programmatically.

### Health Check

Use `checkHolmesAgentHealth()` to verify the Holmes agent is reachable:

```typescript
import { checkHolmesAgentHealth } from '@headlamp-k8s/ai-common/agent/holmesClient';

// Inject your platform's cluster request function
const isHealthy = await checkHolmesAgentHealth(clusterRequestFn, clusterName, {
  holmesNamespace: 'default',
  holmesServiceName: 'holmesgpt-holmes',
  holmesPort: 80,
});
```

The health check probes the root path (`/`) of the Holmes service via the Kubernetes service proxy. A non-503 response means the pod is reachable (even 404/405 from the Holmes server itself indicates successful proxy forwarding).

### HolmesAgent

Use `HolmesAgent` to interact with the Holmes AG-UI server:

```typescript
import { HolmesAgent, getHolmesProxyBaseUrl } from '@headlamp-k8s/ai-common/agent/holmesClient';

const baseUrl = getHolmesProxyBaseUrl(clusterName);
const agent = new HolmesAgent(baseUrl);

// Subscribe to events
agent.subscribe({
  onTextMessageContentEvent: (event) => {
    console.log('Holmes says:', event.content);
  },
  onRunFinishedEvent: () => {
    console.log('Agent run complete');
  },
});

// Send a message and run the agent
agent.addMessage({ id: '1', role: 'user', content: 'What pods are failing?' });
await agent.runAgent({ runId: 'run-1' });
```

### Configuration

The Holmes service details can be customized via `HolmesPluginConfig`:

| Field | Default | Description |
|---|---|---|
| `holmesNamespace` | `default` | Kubernetes namespace where Holmes is deployed |
| `holmesServiceName` | `holmesgpt-holmes` | Name of the Holmes Kubernetes Service |
| `holmesPort` | `80` | Service port number |

### Settings UI Component

The `HolmesAgentSettings` component (`@headlamp-k8s/ai-ui/components/settings/HolmesAgentSettings`) provides a settings panel for configuring Holmes connection parameters. It exposes three text fields (namespace, service name, port) with validation and defaults.

| Prop | Type | Description |
|---|---|---|
| `config` | `any \| null` | Current plugin config object |
| `onConfigChange` | `(patch) => void` | Callback when a field changes |
| `SectionWrapper` | `React.ComponentType` | Optional layout wrapper (defaults to simple Box) |
| `defaultNamespace` | `string` | Override default namespace (`default`) |
| `defaultServiceName` | `string` | Override default service name (`holmesgpt-holmes`) |
| `defaultPort` | `number` | Override default port (`80`) |

Port values are validated to be integers in the range 1–65535. Empty or invalid inputs fall back to the default values.

### Injectable ClusterRequestFn

The `ClusterRequestFn` interface allows platform-specific cluster request implementations to be injected:

```typescript
type ClusterRequestFn = (
  path: string,
  options: { cluster: string; isJSON: boolean; timeout: number }
) => Promise<any>;
```

For example, in a headlamp-plugin context:

```typescript
import { clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { checkHolmesAgentHealth } from '@headlamp-k8s/ai-common/agent/holmesClient';

const isHealthy = await checkHolmesAgentHealth(clusterRequest, cluster);
```

## Troubleshooting

### Cannot reach the HolmesGPT agent

Start by confirming the agent pods are running and ready.

The integration checks reachability through the Kubernetes Service proxy path. If there are no ready endpoints, the API server returns a 503 and the integration treats the agent as unavailable.

Also confirm you updated the container command to enable the AG-UI server, since that is required for the integration.

### HolmesGPT is running but answers seem limited

Confirm your AI provider configuration. The AI Assistant requires provider credentials and settings, and provider issues can affect response quality.

Also confirm the Holmes `values.yaml` provider settings match your intended provider and model configuration.

## References

- [HolmesGPT GitHub repository](https://github.com/robusta-dev/holmesgpt)
- [AG-UI Protocol documentation](https://docs.ag-ui.com/)
- [Robusta Helm charts](https://github.com/robusta-dev/robusta-charts)
