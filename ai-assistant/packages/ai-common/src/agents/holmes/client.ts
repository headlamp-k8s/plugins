/*
 * Copyright 2025 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { AgentSubscriber, HttpAgent, RunAgentParameters } from '@ag-ui/client';

/** Host globals injected by Headlamp, Electron, or Docker Desktop. */
interface HeadlampHostWindow {
  /** Electron renderer process marker. */
  process?: {
    /** Electron process type, such as `renderer`. */
    type?: string;
  };
  /** Port used by the Headlamp backend during local development. */
  headlampBackendPort?: number;
  /** Docker Desktop host marker. */
  ddClient?: unknown;
  /** Deployment base path for Headlamp. */
  headlampBaseUrl?: string;
}

/**
 * Returns the browser window viewed through Headlamp's injected host fields.
 *
 * @returns Current window with optional Headlamp host globals.
 */
function getHostWindow(): Window & HeadlampHostWindow {
  return window as unknown as Window & HeadlampHostWindow;
}

/** Plugin configuration type for Holmes service settings. */
export interface HolmesPluginConfig {
  /** Override for the Holmes service namespace. */
  holmesNamespace?: string;
  /** Override for the Holmes Kubernetes Service name. */
  holmesServiceName?: string;
  /** Override for the Holmes service port. */
  holmesPort?: number;
}

/**
 * Injectable cluster request function.
 *
 * Platform-specific implementations (e.g. Headlamp's `clusterRequest` from
 * `@kinvolk/headlamp-plugin/lib/ApiProxy`) are injected by the host
 * application, keeping `ai-common` free of headlamp-plugin dependencies.
 *
 * @param path - Kubernetes API path to request.
 * @param options - Cluster routing, response parsing, and timeout settings.
 * @returns Host-specific response value.
 */
export type ClusterRequestFn = (
  path: string,
  options: {
    /** Cluster name used to route the request. */
    cluster: string;
    /** Whether the host should parse the response as JSON. */
    isJSON: boolean;
    /** Request timeout in milliseconds. */
    timeout: number;
  }
) => Promise<unknown>;

/**
 * Default base URL for the Holmes ag-ui server (direct / port-forward fallback).
 */
export const DEFAULT_AGUI_URL = 'http://localhost:5050';

/** Default Holmes Kubernetes Service name. */
export const HOLMES_SERVICE_NAME = 'holmesgpt-holmes';
/** Default port exposed by the Holmes Kubernetes Service. */
export const HOLMES_SERVICE_PORT = 80;
/** Default namespace that contains the Holmes Kubernetes Service. */
export const HOLMES_SERVICE_NAMESPACE = 'default';

/**
 * Normalizes an optional string config value and falls back when it is blank.
 *
 * @param value - Optional value to trim.
 * @param fallback - Value used for missing or whitespace-only input.
 * @returns Trimmed value or the fallback.
 */
function normalizeConfigString(value: string | undefined, fallback: string): string {
  const normalized = value?.trim();
  return normalized || fallback;
}

/**
 * Normalizes an optional port config value and falls back when it is invalid.
 *
 * @param value - Candidate integer port in the inclusive range 1 through 65,535.
 * @param fallback - Port used when the candidate is absent or invalid.
 * @returns Valid candidate port or the fallback.
 */
function normalizeConfigPort(value: number | undefined, fallback: number): number {
  return value !== undefined && Number.isInteger(value) && value >= 1 && value <= 65535
    ? value
    : fallback;
}

/**
 * Resolves Holmes service settings by applying defaults to optional plugin config.
 *
 * @param config - Optional namespace, service-name, and port overrides.
 * @returns Normalized service settings.
 */
function getHolmesServiceConfig(config?: HolmesPluginConfig): {
  /** Kubernetes namespace containing the Holmes service. */
  namespace: string;
  /** Holmes Kubernetes Service name. */
  serviceName: string;
  /** Port exposed by the Holmes Kubernetes Service. */
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
 *
 * @param config - Optional Holmes service overrides.
 * @param subPath - Optional path appended after `proxy`, with one leading slash removed.
 * @returns Kubernetes service-proxy API path.
 */
export function getHolmesServiceProxyPath(config?: HolmesPluginConfig, subPath = ''): string {
  const { namespace, serviceName, servicePort } = getHolmesServiceConfig(config);
  const base = `/api/v1/namespaces/${namespace}/services/${serviceName}:${servicePort}/proxy`;
  return subPath ? `${base}/${subPath.replace(/^\//, '')}` : base;
}

/**
 * Extracts a searchable text representation from an unknown thrown value.
 *
 * @param err - The caught error/rejection value.
 * @returns Concatenated message/body text, or an empty string.
 */
function errorText(err: unknown): string {
  if (typeof err === 'string') return err;
  if (err && typeof err === 'object') {
    const rec = err as Record<string, unknown>;
    const parts: string[] = [];
    for (const key of ['message', 'error', 'responseText', 'body'] as const) {
      if (typeof rec[key] === 'string') parts.push(rec[key] as string);
    }
    try {
      parts.push(JSON.stringify(err));
    } catch {
      /* ignore non-serializable errors */
    }
    return parts.join(' ');
  }
  return '';
}

/**
 * Detects the Kubernetes API "service not found" error, which the API server
 * returns (as a 404) when the Holmes Service does not exist in the cluster —
 * i.e. Holmes is not installed. This must be distinguished from a 404 returned
 * by the Holmes app itself (which means the pod is up and reachable).
 *
 * @param err - The caught error/rejection value.
 * @returns Whether the error indicates the Kubernetes namespace or Service is missing.
 */
function isKubernetesTargetNotFoundError(err: unknown): boolean {
  const text = errorText(err);
  if (!text) return false;
  return (
    /services?\s+"[^"]*"\s+not\s+found/i.test(text) ||
    /namespaces?\s+"[^"]*"\s+not\s+found/i.test(text) ||
    (/"kind"\s*:\s*"(?:services|namespaces)"/i.test(text) && /not\s*found/i.test(text))
  );
}

/**
 * Check if the Holmes agent is reachable via the K8s service proxy.
 * Uses the service proxy base path — the K8s API server returns 503 if
 * there are no ready endpoints, so a non-503 response means the pod is up.
 *
 * We probe the root path (/) which uvicorn will respond to (even with 404/405)
 * rather than /healthz which the experimental server may not implement.
 *
 * @param clusterRequestFn - Injectable cluster request function (e.g. headlamp-plugin's `clusterRequest`)
 * @param cluster - The cluster name to check
 * @param config - Optional Holmes plugin configuration
 * @returns Whether the proxy succeeded or reported a reachable-route status of 404, 405, or 422.
 */
export async function checkHolmesAgentHealth(
  clusterRequestFn: ClusterRequestFn,
  cluster: string,
  config?: HolmesPluginConfig
): Promise<boolean> {
  try {
    await clusterRequestFn(getHolmesServiceProxyPath(config, ''), {
      cluster,
      isJSON: false,
      timeout: 5000,
    });
    return true;
  } catch (err: unknown) {
    // A 404 from the Holmes server itself means the pod IS reachable
    // (the K8s service proxy forwarded the request successfully). But the K8s
    // API server ALSO returns 404 when the Service does not exist (Holmes not
    // installed) — that case must be treated as unavailable. Only 503
    // "no endpoints" or network errors otherwise mean it's truly unavailable.
    const status =
      typeof err === 'object' && err !== null && 'status' in err ? err.status : undefined;
    if (status === 404 && isKubernetesTargetNotFoundError(err)) {
      return false;
    }
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
 *
 * @returns Backend origin selected for server, Electron, Docker Desktop, development, or production.
 */
function getHeadlampBackendOrigin(): string {
  if (typeof window === 'undefined') {
    return 'http://localhost:4466';
  }

  // Electron environment
  const hostWindow = getHostWindow();
  if (
    (typeof hostWindow.process === 'object' && hostWindow.process.type === 'renderer') ||
    (typeof navigator === 'object' && navigator.userAgent.indexOf('Electron') >= 0)
  ) {
    const port = hostWindow.headlampBackendPort || 4466;
    return `http://localhost:${port}`;
  }

  // Docker Desktop
  if (hostWindow.ddClient !== undefined) {
    return 'http://localhost:64446';
  }

  // Dev mode (vite dev server on :3000, backend on :4466)
  try {
    if (import.meta.env?.DEV) {
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
 *
 * @param cluster - Cluster name inserted into the proxy path without encoding.
 * @param config - Optional Holmes service overrides.
 * @returns Absolute Headlamp backend URL for the Holmes service proxy.
 */
export function getHolmesProxyBaseUrl(cluster: string, config?: HolmesPluginConfig): string {
  const origin = getHeadlampBackendOrigin();
  const hostWindow = typeof window !== 'undefined' ? getHostWindow() : undefined;
  // Respect any base URL prefix (e.g. /headlamp)
  let baseUrlPrefix = '';
  if (hostWindow?.headlampBaseUrl) {
    const raw = hostWindow.headlampBaseUrl;
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
 *   const agent = new HolmesAgent(getHolmesProxyBaseUrl(cluster));
 *   agent.subscribe({ onTextMessageContentEvent: ... });
 *   agent.addMessage({ id: '1', role: 'user', content: 'What pods are failing?' });
 *   await agent.runAgent({ runId: 'run-1' });
 */
export class HolmesAgent {
  private agent: HttpAgent;
  private baseUrl: string;
  private threadId: string;
  private subscriberList: Array<{
    subscriber: AgentSubscriber;
    unsubscribe: () => void;
  }> = [];

  // Buffers for accumulating streamed content (since the library's buffers
  // can be unreliable depending on version)
  private toolArgsBuffers: Map<string, string> = new Map();
  private toolNames: Map<string, string> = new Map();

  /**
   * Creates a Holmes agent client for the provided ag-ui base URL.
   *
   * @param baseUrl - Holmes service or proxy base URL.
   */
  constructor(baseUrl: string = DEFAULT_AGUI_URL) {
    this.baseUrl = baseUrl;
    this.threadId = `thread-${Date.now()}`;
    this.agent = this.createAgent();
  }

  /**
   * Creates an HTTP agent for the current base URL and thread ID.
   *
   * @returns Configured ag-ui HTTP agent.
   */
  private createAgent(): HttpAgent {
    const url = `${this.baseUrl}/api/agui/chat`;
    console.debug('[HolmesAgent] Creating HttpAgent with URL:', url);
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
   *
   * @returns Configured Holmes base URL.
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
   *
   * @param subscriber - ag-ui callbacks to register with the current and future inner agents.
   * @returns Handle that unsubscribes the original inner-agent registration and prevents future reattachment.
   */
  subscribe(subscriber: AgentSubscriber): {
    /**
     * Removes the original inner-agent subscription and prevents future thread reattachment.
     * Subscriptions already reattached by a prior reset are not tracked by this handle.
     *
     * @returns No value.
     */
    unsubscribe: () => void;
  } {
    const sub = this.agent.subscribe(subscriber);
    const registration = { subscriber, unsubscribe: () => sub.unsubscribe() };
    this.subscriberList.push(registration);
    return {
      /**
       * Removes the original inner-agent subscription and wrapper-list entry.
       *
       * @returns No value.
       */
      unsubscribe: () => {
        registration.unsubscribe();
        this.subscriberList = this.subscriberList.filter(item => item !== registration);
      },
    };
  }

  /**
   * Add a message to the agent's conversation history.
   *
   * @param message - Message identifier, role, and text content.
   * @returns No value.
   */
  addMessage(message: {
    /** Message identifier. */
    id: string;
    /** Message role accepted by the inner agent. */
    role: string;
    /** Message text content. */
    content: string;
  }): void {
    this.agent.addMessage(message as Parameters<HttpAgent['addMessage']>[0]);
  }

  /**
   * Run the agent — sends accumulated messages to Holmes and streams back
   * ag-ui events to all registered subscribers.
   *
   * @param params - Optional run ID, tools, context, and forwarded properties.
   * @returns No value after the inner agent run completes.
   */
  async runAgent(params?: RunAgentParameters): Promise<void> {
    await this.agent.runAgent({
      runId: params?.runId || `run-${Date.now()}`,
      tools: params?.tools,
      context: params?.context,
      forwardedProps: params?.forwardedProps,
    });
  }

  /**
   * Abort the currently running agent request.
   *
   * @returns No value.
   */
  abortRun(): void {
    this.agent.abortRun();
  }

  /**
   * Reset the conversation by creating a new agent instance with a fresh thread.
   * All existing subscribers are automatically re-attached.
   * Buffered tool-call state and inner-agent message state are discarded.
   *
   * @returns No value.
   */
  resetThread(): void {
    this.threadId = `thread-${Date.now()}`;
    this.agent = this.createAgent();
    for (const registration of this.subscriberList) {
      const innerSubscription = this.agent.subscribe(registration.subscriber);
      registration.unsubscribe = () => innerSubscription.unsubscribe();
    }
    this.toolArgsBuffers.clear();
    this.toolNames.clear();
  }

  /**
   * Get the current thread ID.
   *
   * @returns Timestamp-based thread identifier.
   */
  getThreadId(): string {
    return this.threadId;
  }
}
