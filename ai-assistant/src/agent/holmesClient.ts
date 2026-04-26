import { HttpAgent } from '@ag-ui/client';
import { clusterRequest } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import type { PluginConfig } from '../utils';

/**
 * Default base URL for the Holmes ag-ui server (direct / port-forward fallback).
 */
export const DEFAULT_AGUI_URL = 'http://localhost:5050';

/**
 * Holmes Kubernetes Service details.
 * Must match the Service resource deployed by the Holmes Helm chart.
 */
export const HOLMES_SERVICE_NAME = 'holmesgpt-holmes';
export const HOLMES_SERVICE_PORT = 80;
export const HOLMES_SERVICE_NAMESPACE = 'default';

function normalizeConfigString(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized || fallback;
}

function normalizeConfigPort(value: number | undefined, fallback: number): number {
  return Number.isInteger(value) && value >= 1 && value <= 65535 ? value : fallback;
}

function getHolmesServiceConfig(config?: PluginConfig): {
  namespace: string;
  serviceName: string;
  servicePort: number;
} {
  return {
    namespace: normalizeConfigString(config?.holmesNamespace, HOLMES_SERVICE_NAMESPACE),
    serviceName: normalizeConfigString(config?.holmesServiceName, HOLMES_SERVICE_NAME),
    servicePort: normalizeConfigPort(config?.holmesPort, HOLMES_SERVICE_PORT),
  };
}

/**
 * Build the K8s API path that proxies to the Holmes service.
 *
 * Path pattern:
 *   /api/v1/namespaces/{ns}/services/{svc}:{port}/proxy[/{subPath}]
 *
 * This path can be used with Headlamp's `clusterRequest()` directly.
 */
export function getHolmesServiceProxyPath(config?: PluginConfig, subPath = ''): string {
  const { namespace, serviceName, servicePort } = getHolmesServiceConfig(config);
  const base = `/api/v1/namespaces/${namespace}/services/${serviceName}:${servicePort}/proxy`;
  return subPath ? `${base}/${subPath.replace(/^\//, '')}` : base;
}

/**
 * Check if the Holmes agent is reachable via the K8s service proxy.
 * Uses the service proxy base path — the K8s API server returns 503 if
 * there are no ready endpoints, so a non-503 response means the pod is up.
 *
 * We probe the root path (/) which uvicorn will respond to (even with 404/405)
 * rather than /healthz which the experimental server may not implement.
 */
export async function checkHolmesAgentHealth(
  cluster: string,
  config?: PluginConfig
): Promise<boolean> {
  try {
    await clusterRequest(getHolmesServiceProxyPath(config, ''), {
      cluster,
      isJSON: false,
      timeout: 5000,
    });
    return true;
  } catch (err: any) {
    // A 404/405 from the Holmes server itself means the pod IS reachable
    // (the K8s service proxy forwarded the request successfully).
    // Only 503 "no endpoints" or network errors mean it's truly unavailable.
    const status = err?.status;
    if (status === 404 || status === 405 || status === 422) {
      return true;
    }
    return false;
  }
}

/**
 * Resolve the Headlamp backend origin.
 *
 * Replicates the logic from Headlamp's internal `getAppUrl()` so that we can
 * build absolute URLs for `HttpAgent` (which calls raw `fetch`).
 *
 * In dev mode the Vite dev-server runs on :3000 but the Headlamp backend
 * that proxies to the K8s API server runs on :4466, so we must target :4466.
 */
function getHeadlampBackendOrigin(): string {
  // Electron environment
  if (
    typeof window !== 'undefined' &&
    ((typeof window.process === 'object' && (window.process as any).type === 'renderer') ||
      (typeof navigator === 'object' && navigator.userAgent.indexOf('Electron') >= 0))
  ) {
    const port = (window as any).headlampBackendPort || 4466;
    return `http://localhost:${port}`;
  }

  // Docker Desktop
  if (typeof window !== 'undefined' && (window as any).ddClient !== undefined) {
    return 'http://localhost:64446';
  }

  // Dev mode (vite dev server on :3000, backend on :4466)
  try {
    if ((import.meta as any).env?.DEV) {
      return 'http://localhost:4466';
    }
  } catch {
    // import.meta may not be available in all contexts
  }

  // Production — backend is at the same origin
  return window.location.origin;
}

/**
 * Build the full Holmes ag-ui base URL that routes through Headlamp's backend
 * proxy → Kubernetes API server → Holmes Service.
 *
 * The returned URL is absolute (includes the Headlamp backend origin) so that
 * it can be passed directly to `HttpAgent` / `fetch`.
 */
export function getHolmesProxyBaseUrl(cluster: string, config?: PluginConfig): string {
  const origin = getHeadlampBackendOrigin();
  // Respect any base URL prefix (e.g. /headlamp)
  let baseUrlPrefix = '';
  if (typeof window !== 'undefined' && (window as any).headlampBaseUrl) {
    const raw = (window as any).headlampBaseUrl as string;
    if (raw !== '/' && raw !== './' && raw !== '.') {
      baseUrlPrefix = raw;
    }
  }
  return `${origin}${baseUrlPrefix}/clusters/${cluster}${getHolmesServiceProxyPath(config, '')}`;
}

/**
 * HolmesAgent wraps @ag-ui/client's HttpAgent to communicate with the
 * Holmes ag-ui server via SSE.
 *
 * Usage:
 *   const agent = new HolmesAgent(getHolmesProxyBaseUrl(cluster, pluginSettings));
 *   agent.subscribe({ onTextMessageContentEvent: ... });
 *   agent.addMessage({ id: '1', role: 'user', content: 'What pods are failing?' });
 *   await agent.runAgent({ runId: 'run-1' });
 */
export class HolmesAgent {
  private agent: HttpAgent;
  private baseUrl: string;
  private threadId: string;
  private subscriberList: any[] = [];

  // Buffers for accumulating streamed content (since the library's buffers
  // can be unreliable depending on version)
  private toolArgsBuffers: Map<string, string> = new Map();
  private toolNames: Map<string, string> = new Map();

  constructor(baseUrl: string = DEFAULT_AGUI_URL) {
    this.baseUrl = baseUrl;
    this.threadId = `thread-${Date.now()}`;
    this.agent = this.createAgent();
  }

  private createAgent(): HttpAgent {
    const url = `${this.baseUrl}/api/agui/chat`;
    console.log('[HolmesAgent] Creating HttpAgent with URL:', url);
    return new HttpAgent({
      url,
      threadId: this.threadId,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * A human-readable label for the current connection.
   */
  get connectionLabel(): string {
    return this.baseUrl;
  }

  /**
   * Subscribe to agent events.
   *
   * Callbacks:
   * - onRunStartedEvent / onRunFinishedEvent / onRunErrorEvent
   * - onTextMessageStartEvent / onTextMessageContentEvent / onTextMessageEndEvent
   * - onToolCallStartEvent / onToolCallArgsEvent / onToolCallEndEvent
   */
  subscribe(subscriber: any): { unsubscribe: () => void } {
    this.subscriberList.push(subscriber);
    const sub = this.agent.subscribe(subscriber);
    return {
      unsubscribe: () => {
        sub.unsubscribe();
        this.subscriberList = this.subscriberList.filter(s => s !== subscriber);
      },
    };
  }

  /**
   * Add a message to the agent's conversation history.
   */
  addMessage(message: { id: string; role: string; content: string }): void {
    this.agent.addMessage(message as any);
  }

  /**
   * Run the agent — sends accumulated messages to Holmes and streams back
   * ag-ui events to all registered subscribers.
   */
  async runAgent(params?: {
    runId?: string;
    tools?: any[];
    context?: any[];
    forwardedProps?: Record<string, any>;
  }): Promise<void> {
    await this.agent.runAgent({
      runId: params?.runId || `run-${Date.now()}`,
      tools: params?.tools,
      context: params?.context,
      forwardedProps: params?.forwardedProps,
    });
  }

  /**
   * Abort the currently running agent request.
   */
  abortRun(): void {
    this.agent.abortRun();
  }

  /**
   * Reset the conversation by creating a new agent instance with a fresh thread.
   * All existing subscribers are automatically re-attached.
   */
  resetThread(): void {
    this.threadId = `thread-${Date.now()}`;
    this.agent = this.createAgent();
    for (const sub of this.subscriberList) {
      this.agent.subscribe(sub);
    }
    this.toolArgsBuffers.clear();
    this.toolNames.clear();
  }

  /**
   * Get the current thread ID.
   */
  getThreadId(): string {
    return this.threadId;
  }
}
