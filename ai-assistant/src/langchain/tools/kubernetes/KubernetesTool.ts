import { z } from 'zod';
import { ToolBase, ToolConfig, ToolHandler, ToolResponse } from '../ToolBase';
import { KubernetesToolContext } from './types';

export class KubernetesTool extends ToolBase {
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
          'HTTP method: GET, POST, PUT, DELETE. Use PUT for updating specific fields of existing resources.'
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

  constructor() {
    super();
  }

  /**
   * Set the UI context that allows the tool to interact with the modal's state
   */
  setContext(context: KubernetesToolContext): void {
    this.context = context;
  }

  /**
   * Check if the tool has a context configured
   */
  hasContext(): boolean {
    return this.context !== null;
  }

  /**
   * Check if the provided context is different from the current one
   * We do a shallow comparison of key properties to avoid unnecessary reconfigurations
   */
  isContextDifferent(newContext: KubernetesToolContext): boolean {
    if (!this.context) {
      return true; // No context set yet, so it's different
    }

    const clustersChanged =
      JSON.stringify(this.context.selectedClusters) !== JSON.stringify(newContext.selectedClusters);

    // For UI and callbacks, we only care if they're significantly different
    // Since these objects are recreated on each render, we'll be less strict
    // and only reconfigure if clusters changed or if context was null before
    return clustersChanged;
  }

  handler: ToolHandler = async (
    { url, method, body },
    toolCallId,
    pendingPrompt
  ): Promise<ToolResponse> => {
    if (!this.context) {
      console.error('Kubernetes tool context not configured');
      throw new Error('Kubernetes tool context not configured');
    }

    console.log(`Processing kubernetes_api_request tool: ${method} ${url}`, {
      hasContext: !!this.context,
      toolCallId,
      selectedClusters: this.context?.selectedClusters,
    });

    // For GET requests, we can execute them immediately using the API helper
    if (method.toUpperCase() === 'GET') {
      try {
        const apiResponse = await this.context.callbacks.handleActualApiRequest(
          url,
          method,
          body || '',
          () => {}, // No-op onClose for GET requests
          this.context.aiManager, // Use aiManager from context
          '', // No resource info needed for GET requests
          undefined, // No target cluster specified
          undefined // No failure callback for GET requests (they're read-only)
        );

        // The handleActualApiRequest already adds to history, so we return a simple response
        return {
          content: typeof apiResponse === 'string' ? apiResponse : JSON.stringify(apiResponse),
          shouldAddToHistory: false, // Already added by handleActualApiRequest
          shouldProcessFollowUp: true,
          metadata: {
            method: method.toUpperCase(),
            url,
            body,
            success: true,
          },
        };
      } catch (error) {
        const errorContent = JSON.stringify({
          error: true,
          message: `Error executing GET request: ${error.message}`,
          request: {
            method: method.toUpperCase(),
            url: url,
            body: body || null,
          },
        });

        return {
          content: errorContent,
          shouldAddToHistory: true,
          shouldProcessFollowUp: false,
          metadata: {
            method: method.toUpperCase(),
            url,
            body,
            error: error.message,
          },
        };
      }
    }

    // For non-GET requests, trigger the confirmation dialog
    this.context.callbacks.setApiRequest({
      url,
      method,
      body,
      toolCallId,
      pendingPrompt,
    });
    this.context.callbacks.setShowApiConfirmation(true);

    const content = JSON.stringify({
      status: 'pending_confirmation',
      message: `This ${method.toUpperCase()} request requires confirmation before proceeding.`,
      request: {
        method: method.toUpperCase(),
        url: url,
        body: body || null,
      },
      // Include full resource info for PATCH requests
      fullResource: method.toUpperCase() === 'PATCH' && body,
    });

    return {
      content,
      shouldAddToHistory: false, // Don't add confirmation requests to history
      shouldProcessFollowUp: false, // Don't process follow-up for confirmation requests
      metadata: {
        requiresConfirmation: true,
        method: method.toUpperCase(),
        url,
        body,
      },
    };
  };

  /**
   * Handle the API confirmation - this would be called by the confirmation dialog
   */
  async handleApiConfirmation(body: string, resourceInfo: any): Promise<void> {
    if (!this.context || !this.context.ui.apiRequest) return;

    const { url, method } = this.context.ui.apiRequest;

    // Clear the request state
    this.context.callbacks.setApiRequest(null);

    // Use the existing API request handler
    await this.context.callbacks.handleActualApiRequest(
      url,
      method,
      body,
      this.handleApiDialogClose.bind(this),
      this.context.aiManager, // Use aiManager from context
      resourceInfo,
      undefined, // No target cluster specified
      undefined // No failure callback needed here as it's handled by the main flow
    );
  }

  /**
   * Handle closing the API dialog
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
