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
/* eslint-disable no-unused-vars */

/**
 * MockToolManager — a lightweight `LangChainToolRuntime` for tests, the CLI,
 * and demos.
 *
 * It provides the runtime surface used by `LangChainAssistantSession`:
 * - `executeTool` — returns a configurable canned `ToolExecutionResult`
 * - `getToolNames` — returns configured names
 * - `getMCPTools` / `getLangChainTools` — return empty lists
 * - `bindToModelAsync` / `waitForMCPToolsInitialization` — resolve immediately
 *
 * ### Usage
 *
 * ```ts
 * // Inject the mock runtime through LangChainAssistantSession options:
 * const mockTM = createMockToolManager();
 * const sessionOptions = { toolManager: mockTM };
 *
 * // Configure specific tool results:
 * const mockTM = createMockToolManager({
 *   toolResults: {
 *     kubernetes_api_request: { pods: ['nginx', 'redis'] },
 *   },
 * });
 *
 * // Simulate a tool failure:
 * const mockTM = createMockToolManager({
 *   toolResults: {
 *     my_tool: new Error('connection refused'),
 *   },
 * });
 * ```
 */

import type { BaseChatModel } from '@langchain/core/language_models/chat_models';
import type { StructuredToolInterface } from '@langchain/core/tools';
import type { LangChainToolRuntime } from '../../assistant/langchain/LangChainToolBinding';
import type { ConversationMessage as Prompt } from '../../conversation/types';
import type { ToolExecutionResult } from '../ToolRuntime';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * A tool result entry:
 * - **Data object / primitive** → JSON-serialised as a successful response.
 * - **`Error`** → thrown, so the caller's catch branch runs.
 * - **Function** → called with `(args, toolCallId)` and must return data or throw.
 *   Use this when the response should vary based on the tool arguments (e.g. a
 *   `kubernetes_api_request` that inspects the `url` field to return different
 *   resources for `/api/v1/pods` vs `/apis/apps/v1/deployments`).
 */
export type MockToolResult =
  | unknown
  | Error
  | ((args: Record<string, unknown>, toolCallId?: string) => unknown | Promise<unknown>);

/** Options for `createMockToolManager`. */
export interface MockToolManagerOptions {
  /**
   * Map from tool name → result.
   *
   * - When the value is an `Error`, `executeTool` **throws** it so the
   *   assistant session's tool-call handling reaches its failure path.
   * - When the value is anything else, it is JSON-serialised and returned as
   *   a successful `ToolExecutionResult`.
   * - Tools not listed here return a generic `{ result: 'ok' }` response.
   */
  toolResults?: Record<string, MockToolResult>;

  /**
   * List of tool names reported as "enabled" by `getToolNames()`.
   * Defaults to the keys of `toolResults`, or `[]` when neither is provided.
   */
  enabledToolNames?: string[];

  /**
   * Optional spy called every time `executeTool` is invoked.
   * Useful for asserting which tools were called and with what args.
   *
   * @param toolName - Name passed to `executeTool`.
   * @param args - Arguments passed to `executeTool`.
   * @returns No value.
   */
  onExecuteTool?: (toolName: string, args: Record<string, unknown>) => void;
}

// ---------------------------------------------------------------------------
// MockToolManager
// ---------------------------------------------------------------------------

/**
 * Minimal configurable implementation of `LangChainToolRuntime`.
 * Construct with `createMockToolManager()`.
 */
export class MockToolManager implements LangChainToolRuntime {
  private readonly toolResults: Record<string, MockToolResult>;
  private readonly enabledNames: string[];
  private readonly onExecute?: (name: string, args: Record<string, unknown>) => void;

  /**
   * Creates a mock tool runtime with configurable names, results, and a spy.
   *
   * @param options - Tool results, enabled names, and execution observer.
   */
  constructor(options: MockToolManagerOptions = {}) {
    this.toolResults = options.toolResults ?? {};
    this.enabledNames = options.enabledToolNames ?? Object.keys(options.toolResults ?? {});
    this.onExecute = options.onExecuteTool;
  }

  // ── Core execution ────────────────────────────────────────────────────────

  /**
   * Executes a mock tool call.
   *
   * - If the configured result is an `Error`, it is thrown.
   * - Otherwise the result is JSON-serialised and returned as a successful
   *   `ToolExecutionResult` with history and follow-up processing enabled.
   *
   * @param toolName - Tool result key to execute.
   * @param args - Arguments passed to functional results and the execution spy.
   * @param _toolCallId - Optional call ID passed to functional results.
   * @param _pendingPrompt - Pending prompt accepted for runtime compatibility and ignored.
   * @returns Serialized configured data or the default success object.
   */
  async executeTool(
    toolName: string,
    args: Record<string, unknown>,
    _toolCallId?: string,
    _pendingPrompt?: Prompt
  ): Promise<ToolExecutionResult> {
    this.onExecute?.(toolName, args);

    const result = this.toolResults[toolName];

    if (result instanceof Error) {
      throw result;
    }

    // Function-based result: call with args to get the data
    const data =
      typeof result === 'function'
        ? await (result as (args: Record<string, unknown>, id?: string) => unknown)(
            args,
            _toolCallId
          )
        : result !== undefined
        ? result
        : { result: 'ok', toolName };

    return {
      content: JSON.stringify(data),
      shouldAddToHistory: true,
      shouldProcessFollowUp: true,
    };
  }

  // ── Tool inventory ─────────────────────────────────────────────────────────

  /**
   * Returns configured enabled tool names.
   *
   * @returns Enabled names in configured or result-key order.
   */
  getToolNames(): string[] {
    return this.enabledNames;
  }

  /**
   * Returns no MCP tool metadata.
   *
   * @returns Always an empty array.
   */
  getMCPTools(): Array<{
    /** MCP tool name. */
    name: string;
    /** Optional MCP tool description. */
    description?: string;
  }> {
    return [];
  }

  /**
   * Returns no LangChain tool adapters.
   *
   * @returns Always an empty array.
   */
  getLangChainTools(): StructuredToolInterface[] {
    return [];
  }

  /**
   * Checks whether a tool name is configured as enabled.
   *
   * @param toolName - Exact tool name to find.
   * @returns Whether the enabled-name list contains the tool.
   */
  hasTool(toolName: string): boolean {
    return this.enabledNames.includes(toolName);
  }

  // ── Lifecycle / binding ────────────────────────────────────────────────────

  /**
   * Resolves immediately without binding tools.
   *
   * @param model - Chat model returned unchanged.
   * @param _providerId - Provider identifier accepted for compatibility and ignored.
   * @returns The original chat model.
   */
  async bindToModelAsync(model: BaseChatModel, _providerId: string): Promise<BaseChatModel> {
    return model;
  }

  /**
   * Resolves immediately because no MCP initialization is needed.
   *
   * @returns No value.
   */
  async waitForMCPToolsInitialization(): Promise<void> {
    return;
  }

  /**
   * Accepts and ignores Kubernetes context.
   *
   * @param _ctx - Context accepted for runtime compatibility.
   * @returns No value.
   */
  configureKubernetesContext(_ctx: unknown): void {}

  /**
   * Completes immediately without refreshing tools.
   *
   * @returns No value.
   */
  async refreshMCPTools(): Promise<void> {}

  /**
   * Returns no backing MCP client.
   *
   * @returns Always `null`.
   */
  getMCPClient(): unknown {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a `MockToolManager` configured with the given options.
 *
 * @example
 * ```ts
 * // All tools return { result: 'ok', toolName }
 * const mgr = createMockToolManager();
 *
 * // kubernetes_api_request returns pod list
 * const mgr = createMockToolManager({
 *   enabledToolNames: ['kubernetes_api_request'],
 *   toolResults: {
 *     kubernetes_api_request: {
 *       items: [{ metadata: { name: 'nginx' } }],
 *     },
 *   },
 * });
 *
 * // Simulate tool error
 * const mgr = createMockToolManager({
 *   toolResults: { my_tool: new Error('timeout') },
 * });
 * ```
 *
 * @param options - Tool results, enabled names, and execution observer.
 * @returns Configured mock tool runtime.
 */
export function createMockToolManager(options: MockToolManagerOptions = {}): MockToolManager {
  return new MockToolManager(options);
}

// ---------------------------------------------------------------------------
// createMockKubernetesToolManager
// ---------------------------------------------------------------------------

/** Minimal fake Kubernetes resource shape used in mock fixtures. */
interface K8sResource {
  /** Kubernetes API version. */
  apiVersion: string;
  /** Kubernetes resource kind. */
  kind: string;
  /** Resource identity and labels. */
  metadata: {
    /** Resource name. */
    name: string;
    /** Optional resource namespace. */
    namespace?: string;
    /** Optional resource labels. */
    labels?: Record<string, string>;
  };
  /** Simplified resource status. */
  status?: Record<string, unknown>;
  /** Simplified resource specification. */
  spec?: Record<string, unknown>;
}

/** Built-in fake cluster data returned by the mock Kubernetes tool. */
const MOCK_K8S_FIXTURES: Record<string, K8sResource[]> = {
  pods: [
    {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: { name: 'nginx-6d4cf56db6-abc12', namespace: 'default', labels: { app: 'nginx' } },
      status: { phase: 'Running', conditions: [{ type: 'Ready', status: 'True' }] },
      spec: { containers: [{ name: 'nginx', image: 'nginx:1.25' }] },
    },
    {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        name: 'coredns-5dd5756b68-xyzab',
        namespace: 'kube-system',
        labels: { 'k8s-app': 'kube-dns' },
      },
      status: { phase: 'Running', conditions: [{ type: 'Ready', status: 'True' }] },
      spec: { containers: [{ name: 'coredns', image: 'registry.k8s.io/coredns/coredns:v1.11.1' }] },
    },
    {
      apiVersion: 'v1',
      kind: 'Pod',
      metadata: {
        name: 'broken-app-7b9f8c-def34',
        namespace: 'default',
        labels: { app: 'broken-app' },
      },
      status: { phase: 'CrashLoopBackOff', conditions: [{ type: 'Ready', status: 'False' }] },
      spec: { containers: [{ name: 'broken-app', image: 'myapp:latest' }] },
    },
  ],
  deployments: [
    {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'nginx', namespace: 'default', labels: { app: 'nginx' } },
      spec: { replicas: 2 },
      status: { replicas: 2, readyReplicas: 2, availableReplicas: 2 },
    },
    {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      metadata: { name: 'broken-app', namespace: 'default', labels: { app: 'broken-app' } },
      spec: { replicas: 1 },
      status: { replicas: 1, readyReplicas: 0, unavailableReplicas: 1 },
    },
  ],
  services: [
    {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: 'nginx', namespace: 'default' },
      spec: { type: 'ClusterIP', ports: [{ port: 80, targetPort: 80 }] },
    },
    {
      apiVersion: 'v1',
      kind: 'Service',
      metadata: { name: 'kubernetes', namespace: 'default' },
      spec: { type: 'ClusterIP', ports: [{ port: 443 }] },
    },
  ],
  namespaces: [
    {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: { name: 'default' },
      status: { phase: 'Active' },
    },
    {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: { name: 'kube-system' },
      status: { phase: 'Active' },
    },
  ],
  nodes: [
    {
      apiVersion: 'v1',
      kind: 'Node',
      metadata: { name: 'mock-node-1', labels: { 'kubernetes.io/hostname': 'mock-node-1' } },
      status: {
        conditions: [{ type: 'Ready', status: 'True' }],
        capacity: { cpu: '4', memory: '16Gi' },
        allocatable: { cpu: '3800m', memory: '14Gi' },
      },
    },
  ],
};

/**
 * Maps a `kubernetes_api_request` URL to the matching fixture key.
 * Returns `null` when the URL doesn't match any known resource type.
 *
 * @param url - Kubernetes API request path to classify.
 * @returns Fixture collection key, or `null` for an unsupported resource path.
 */
function urlToFixtureKey(url: string): string | null {
  const normalised = url.toLowerCase();
  if (normalised.includes('/pods')) return 'pods';
  if (normalised.includes('/deployments')) return 'deployments';
  if (normalised.includes('/services')) return 'services';
  if (normalised.includes('/namespaces') && !normalised.match(/namespaces\/[^/]+\//)) {
    return 'namespaces';
  }
  if (normalised.includes('/nodes')) return 'nodes';
  return null;
}

/**
 * Creates a `MockToolManager` pre-configured with realistic fake Kubernetes
 * cluster data, suitable for demos and development without a real cluster.
 *
 * Supports the `kubernetes_api_request` tool — responses vary by the `url`
 * argument so `/api/v1/pods` returns pods, `/apis/apps/v1/deployments` returns
 * deployments, and so on.
 *
 * ### Usage in the plugin (via Developer Settings → Mock Tools)
 *
 * When "Mock Testing Tools" is enabled in the Headlamp Developer Settings, the
 * plugin injects this runtime into `LangChainAssistantSession` so the assistant can
 * answer Kubernetes questions without a real cluster connection.
 *
 * ### Usage in tests / CLI
 *
 * ```ts
 * const toolManager = createMockKubernetesToolManager();
 * const options = { toolManager };
 * ```
 *
 * @returns Mock runtime with one URL-sensitive `kubernetes_api_request` tool.
 */
export function createMockKubernetesToolManager(): MockToolManager {
  return new MockToolManager({
    enabledToolNames: ['kubernetes_api_request'],
    toolResults: {
      /**
       * Returns a Kubernetes list from the fixture matching the request URL.
       *
       * @param args - Tool arguments containing an optional string `url`.
       * @returns Kubernetes list object with matching fixture items.
       */
      kubernetes_api_request: (args: Record<string, unknown>) => {
        const url = (args.url as string | undefined) ?? '';
        const key = urlToFixtureKey(url);
        const items = key ? MOCK_K8S_FIXTURES[key] ?? [] : [];
        return { apiVersion: 'v1', kind: 'List', items };
      },
    },
  });
}
