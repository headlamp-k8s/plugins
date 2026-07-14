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
 * MockToolManager — a lightweight stand-in for `ToolManager` for use in
 * tests, the CLI, and demos.
 *
 * It satisfies the surface of `ToolManager` that `LangChainManager` uses:
 * - `executeTool` — returns a configurable canned `ToolResponse`
 * - `getToolNames` / `getMCPTools` / `getLangChainTools` — return empty lists
 *   (or whatever is configured)
 * - `bindToModelAsync` / `waitForMCPToolsInitialization` — resolve immediately
 *
 * ### Usage
 *
 * ```ts
 * // Inject the mock manager through LangChainManager's constructor options:
 * const mockTM = createMockToolManager();
 * const manager = new LangChainManager('mock-testing-model', {}, [], { toolManager: mockTM });
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
   * - When the value is an `Error`, `executeTool` **throws** it so
   *   `LangChainManager.processToolCalls` hits its catch branch.
   * - When the value is anything else, it is JSON-serialised and returned as
   *   a successful `ToolResponse`.
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
   */
  onExecuteTool?: (toolName: string, args: Record<string, unknown>) => void;
}

// ---------------------------------------------------------------------------
// MockToolManager
// ---------------------------------------------------------------------------

/**
 * Minimal mock that satisfies the `IToolManager` interface used by
 * `LangChainManager`.  Construct with `createMockToolManager()`.
 */
export class MockToolManager implements LangChainToolRuntime {
  private readonly toolResults: Record<string, MockToolResult>;
  private readonly enabledNames: string[];
  private readonly onExecute?: (name: string, args: Record<string, unknown>) => void;

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
   *   `ToolResponse` with `shouldAddToHistory: true`.
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

  getToolNames(): string[] {
    return this.enabledNames;
  }

  getMCPTools(): Array<{ name: string; description?: string }> {
    return [];
  }

  getLangChainTools(): StructuredToolInterface[] {
    return [];
  }

  hasTool(toolName: string): boolean {
    return this.enabledNames.includes(toolName);
  }

  // ── Lifecycle / binding ────────────────────────────────────────────────────

  /** Resolves immediately — no real model binding happens. */
  async bindToModelAsync(model: BaseChatModel, _providerId: string): Promise<BaseChatModel> {
    return model;
  }

  /** Resolves immediately — no MCP initialisation needed. */
  async waitForMCPToolsInitialization(): Promise<void> {
    return;
  }

  configureKubernetesContext(_ctx: unknown): void {}

  async refreshMCPTools(): Promise<void> {}

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
 */
export function createMockToolManager(options: MockToolManagerOptions = {}): MockToolManager {
  return new MockToolManager(options);
}

// ---------------------------------------------------------------------------
// createMockKubernetesToolManager
// ---------------------------------------------------------------------------

/** Minimal fake Kubernetes resource shape used in mock fixtures. */
interface K8sResource {
  apiVersion: string;
  kind: string;
  metadata: { name: string; namespace?: string; labels?: Record<string, string> };
  status?: Record<string, unknown>;
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
 * plugin injects this manager into `LangChainManager` so the assistant can
 * answer Kubernetes questions without a real cluster connection.
 *
 * ### Usage in tests / CLI
 *
 * ```ts
 * const manager = new LangChainManager('mock-testing-model', {}, [], {
 *   toolManager: createMockKubernetesToolManager(),
 * });
 * const response = await manager.userSend('how many pods are running?');
 * ```
 */
export function createMockKubernetesToolManager(): MockToolManager {
  return new MockToolManager({
    enabledToolNames: ['kubernetes_api_request'],
    toolResults: {
      kubernetes_api_request: (args: Record<string, unknown>) => {
        const url = (args.url as string | undefined) ?? '';
        const key = urlToFixtureKey(url);
        const items = key ? MOCK_K8S_FIXTURES[key] ?? [] : [];
        return { apiVersion: 'v1', kind: 'List', items };
      },
    },
  });
}
