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

import { z } from 'zod';
import type { ToolConfig, ToolHandler } from '../../langchain/LangChainTool';
import { LangChainTool } from '../../langchain/LangChainTool';
import type { ToolExecutionResult } from '../../ToolRuntime';
import type { KubernetesToolContext } from '../context';

/** Tool implementation that routes requests through the Kubernetes API UI workflow. */
export class KubernetesTool extends LangChainTool {
  /** Configuration used to expose the Kubernetes API tool to LangChain. */
  readonly config: ToolConfig = {
    name: 'kubernetes_api_request',
    shortDescription: 'Make requests to the Kubernetes API',
    description: `Make requests to the Kubernetes API server to fetch, create, update or delete resources.

RESOURCE UPDATE GUIDELINES:
- For UPDATE/MODIFY/CHANGE operations: Use PUT method with ONLY the specific fields to change
- Provide patch objects that will be merged with existing resources
- Use null values to remove fields (e.g., {"spec": {"livenessProbe": null}})
- The system automatically merges patches with current resources before making PUT requests

LOG HANDLING FOR MULTI-CONTAINER PODS:
- When a user asks for logs from a pod, ALWAYS first check the pod specification to determine the number of containers
- If the pod has only one container, directly fetch logs: kubernetes_api_request(url="/api/v1/namespaces/default/pods/pod-name/log", method="GET")
- If the pod has multiple containers, you MUST ask the user which container they want logs from
- List the available container names and ask the user to specify
- Once the user specifies a container, fetch logs with the container parameter: kubernetes_api_request(url="/api/v1/namespaces/default/pods/pod-name/log?container=container-name", method="GET")
- NEVER attempt to fetch logs from a multi-container pod without specifying the container name
- Examples of user requests that specify containers:
  - "get logs from pod-name container nginx" → kubernetes_api_request(url="/api/v1/namespaces/default/pods/pod-name/log?container=nginx", method="GET")
  - "show logs for container sidecar in pod-name" → kubernetes_api_request(url="/api/v1/namespaces/default/pods/pod-name/log?container=sidecar", method="GET")
- If you encounter an error about "container name must be specified", the error handler will automatically provide guidance to the user
- IMPORTANT: Parse user requests carefully to detect if they're specifying a container name in their request:
  - Look for patterns like "container [name]", "from container [name]", "[pod-name] [container-name]"
  - If user specifies a container name, use it directly in the log URL
  - If user doesn't specify a container and the pod has multiple containers, fetch pod details first to list available containers`,
    schema: z.object({
      url: z
        .string()
        .describe('URL to request, e.g., /api/v1/pods or /api/v1/namespaces/default/pods/pod-name'),
      method: z
        .string()
        .describe(
          'HTTP method: GET, POST, PUT, PATCH, DELETE. Use PUT for updating specific fields of existing resources.'
        ),
      body: z
        .string()
        .optional()
        .describe(
          `Optional HTTP Request body:
- For PUT: Provide ONLY the fields to change as a JSON patch (e.g., {"spec": {"replicas": 3}})
- Use null to remove fields (e.g., {"spec": {"livenessProbe": null}})
- For POST: Provide the complete resource definition
- The system will automatically merge PUT patches with existing resources`
        ),
    }),
  };

  private context: KubernetesToolContext | null = null;

  /** Creates a Kubernetes tool instance with no bound UI context. */
  constructor() {
    super();
  }

  /**
   * Sets the UI context that allows the tool to interact with modal state.
   *
   * @param context - UI state, callbacks, clusters, and optional assistant history.
   * @returns No value.
   */
  setContext(context: KubernetesToolContext): void {
    this.context = context;
  }

  /**
   * Checks whether UI context has been configured.
   *
   * @returns Whether the tool can access the Kubernetes UI workflow.
   */
  hasContext(): boolean {
    return this.context !== null;
  }

  /**
   * Checks whether a context selects a different set of clusters.
   *
   * Cluster order is ignored, and UI object identity does not trigger
   * reconfiguration.
   *
   * @param newContext - Candidate context to compare with the configured context.
   * @returns Whether no context exists or the selected cluster set changed.
   */
  isContextDifferent(newContext: KubernetesToolContext): boolean {
    if (!this.context) {
      return true; // No context set yet, so it's different
    }

    // Sort both arrays before comparing so that identical cluster sets in
    // different order do not trigger unnecessary reconfiguration.
    const sortedCurrent = [...(this.context.selectedClusters ?? [])].sort();
    const sortedNew = [...(newContext.selectedClusters ?? [])].sort();
    const clustersChanged = JSON.stringify(sortedCurrent) !== JSON.stringify(sortedNew);

    // For UI and callbacks, we only care if they're significantly different
    // Since these objects are recreated on each render, we'll be less strict
    // and only reconfigure if clusters changed or if context was null before
    return clustersChanged;
  }

  /**
   * Executes read-only Kubernetes requests or queues mutations for confirmation.
   *
   * @param args - Tool arguments containing string `url`, `method`, and optional `body`.
   * @param toolCallId - Optional call identifier used to tag generated history entries.
   * @param pendingPrompt - Optional conversation message retained with confirmation state.
   * @returns Execution content and history/follow-up policy for the request.
   */
  handler: ToolHandler = async (args, toolCallId, pendingPrompt): Promise<ToolExecutionResult> => {
    if (!this.context) {
      throw new Error('Kubernetes tool context not configured');
    }
    const { url, method, body } = args;
    if (typeof url !== 'string' || typeof method !== 'string') {
      throw new Error('Kubernetes tool requires string url and method arguments');
    }
    if (body !== undefined && typeof body !== 'string') {
      throw new Error('Kubernetes tool body must be a string when provided');
    }
    const requestBody = typeof body === 'string' ? body : undefined;

    // Normalize once; all downstream branching, callbacks, and metadata use
    // the canonical upper-case form so a model-supplied lowercase verb never
    // causes a mismatch in the UI callback or switch/if chains.
    const METHOD = method.toUpperCase();

    // For GET requests, we can execute them immediately using the API helper
    if (METHOD === 'GET') {
      try {
        const apiResponse = await this.context.callbacks.handleActualApiRequest(
          url,
          METHOD,
          '', // GET requests must not carry a body; ignore any body the LLM provided
          () => {}, // No-op onClose for GET requests
          this.context.aiManager, // Use aiManager from context
          '', // No resource info needed for GET requests
          undefined, // No target cluster specified
          undefined // No failure callback for GET requests (they're read-only)
        );

        // Tag the history entry pushed by handleActualApiRequest with the toolCallId
        // so processToolResponses can pick it up and send it to the LLM for analysis.
        // Guard on toolCallId being defined so we never corrupt unrelated entries.
        if (toolCallId && this.context.aiManager?.history) {
          const history = this.context.aiManager.history;
          for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].role === 'tool' && !history[i].toolCallId) {
              history[i].toolCallId = toolCallId;
              history[i].name = 'kubernetes_api_request';
              break;
            }
          }
        }

        // The handleActualApiRequest already adds to history (now tagged with toolCallId)
        return {
          content: typeof apiResponse === 'string' ? apiResponse : JSON.stringify(apiResponse),
          shouldAddToHistory: false, // Already added by handleActualApiRequest
          shouldProcessFollowUp: true,
          metadata: {
            method: METHOD,
            url,
            body: requestBody,
            success: true,
          },
        };
      } catch (error) {
        const msg = error instanceof Error ? error.message : String(error);
        const errorContent = JSON.stringify({
          error: true,
          message: `Error executing GET request: ${msg}`,
          request: {
            method: METHOD,
            url: url,
            body: requestBody || null,
          },
        });

        return {
          content: errorContent,
          shouldAddToHistory: true,
          shouldProcessFollowUp: true, // Let the LLM explain the error to the user
          metadata: {
            method: METHOD,
            url,
            body: requestBody,
            error: msg,
          },
        };
      }
    }

    // For non-GET requests, trigger the confirmation dialog
    this.context.callbacks.setApiRequest({
      url,
      method: METHOD,
      body: requestBody,
      toolCallId,
      pendingPrompt,
    });
    this.context.callbacks.setShowApiConfirmation(true);

    const content = JSON.stringify({
      status: 'pending_confirmation',
      message: `This ${METHOD} request requires confirmation before proceeding.`,
      request: {
        method: METHOD,
        url: url,
        body: requestBody || null,
      },
      // Include full resource info for PATCH requests only; omit the field
      // entirely for other methods so callers don't see fullResource: false.
      ...(METHOD === 'PATCH' && requestBody ? { fullResource: requestBody } : {}),
    });

    return {
      content,
      shouldAddToHistory: false, // Don't add confirmation requests to history
      shouldProcessFollowUp: false, // Don't process follow-up for confirmation requests
      metadata: {
        requiresConfirmation: true,
        method: METHOD,
        url,
        body: requestBody,
      },
    };
  };

  /**
   * Executes a Kubernetes mutation accepted by the confirmation dialog.
   *
   * @param body - Confirmed request body.
   * @param resourceInfo - Resource metadata forwarded to the API request callback.
   * @returns A promise that resolves after execution and history tagging complete.
   */
  async handleApiConfirmation(body: string, resourceInfo: unknown): Promise<void> {
    if (!this.context || !this.context.ui.apiRequest) return;

    const { url, method, toolCallId } = this.context.ui.apiRequest;
    // Normalize for consistency; the stored value is already upper-case but
    // ui.apiRequest.method is typed as string so defensive normalization is cheap.
    const METHOD = method.toUpperCase();

    // Clear the request state
    this.context.callbacks.setApiRequest(null);

    // Use the existing API request handler
    await this.context.callbacks.handleActualApiRequest(
      url,
      METHOD,
      body,
      this.handleApiDialogClose.bind(this),
      this.context.aiManager, // Use aiManager from context
      resourceInfo,
      undefined, // No target cluster specified
      undefined // No failure callback needed here as it's handled by the main flow
    );

    // Tag the history entry pushed by handleActualApiRequest with the originating
    // toolCallId so processToolResponses / validateToolCallAlignment can match it,
    // mirroring the same pattern used for GET requests in the handler above.
    if (toolCallId && this.context.aiManager?.history) {
      const history = this.context.aiManager.history;
      for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].role === 'tool' && !history[i].toolCallId) {
          history[i].toolCallId = toolCallId;
          history[i].name = 'kubernetes_api_request';
          break;
        }
      }
    }
  }

  /**
   * Clears confirmation-dialog request, response, error, and loading state.
   *
   * @returns No value.
   */
  handleApiDialogClose(): void {
    if (!this.context) return;

    this.context.callbacks.setShowApiConfirmation(false);
    this.context.callbacks.setApiRequest(null);
    this.context.callbacks.setApiResponse(null);
    this.context.callbacks.setApiRequestError(null);
    this.context.callbacks.setApiLoading(false);
  }
}
