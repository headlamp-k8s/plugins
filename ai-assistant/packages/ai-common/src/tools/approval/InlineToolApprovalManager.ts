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

import type { ConversationMessage } from '../../conversation/types';
import type { KubernetesAssistantContext } from '../../kubernetes/types';
import type { UserContext } from '../../mcp/tools/types';
import type { MCPServer } from '../../mcp/types';
import type { ToolCall } from '../types';
import { EventEmitter } from './events';
import { ToolApprovalHandler } from './ToolApprovalManager';

/** Tracks a pending inline approval request for tool execution. */
export interface InlineToolApprovalRequest {
  /** Unique identifier for the approval request. */
  requestId: string;
  /** Tool calls awaiting approval. */
  toolCalls: ToolCall[];
  /**
   * Resolves the request with the approved tool IDs.
   *
   * @param approvedToolIds - IDs selected for execution.
   * @returns No value.
   */
  resolve: (approvedToolIds: string[]) => void;
  /**
   * Rejects the request with the provided error.
   *
   * @param error - Reason approval cannot continue.
   * @returns No value.
   */
  reject: (error: Error) => void;
  /** AI manager that originated the request. */
  aiManager?: ApprovalManagerContext;
  /**
   * Updates the corresponding UI message loading state.
   *
   * @param loading - Whether the confirmation should display a loading state.
   * @returns No value.
   */
  updateMessage?: (loading: boolean) => void;
}

/** Minimal AI manager state required to construct an approval request. */
export interface ApprovalManagerContext {
  /** Conversation history used to derive approval context. */
  history: ConversationMessage[];
  /**
   * Returns the Kubernetes context currently associated with the request.
   *
   * @returns Active Kubernetes context, or `undefined` when unavailable.
   */
  getKubernetesContext?(): KubernetesAssistantContext | undefined;
}

/** Event payload emitted when a tool confirmation is created or updated. */
export interface ToolConfirmationEvent {
  /** Approval request that owns the confirmation. */
  requestId: string;
  /** Confirmation controls and tool calls shown by the UI. */
  toolConfirmation: NonNullable<ConversationMessage['toolConfirmation']>;
  /** Manager that originated the request, included on creation events. */
  aiManager?: ApprovalManagerContext;
}

/** Coordinates inline tool approvals for chat-based assistant interactions. */
export class InlineToolApprovalManager extends EventEmitter {
  private static instance: InlineToolApprovalManager | null = null;
  private pendingRequest: InlineToolApprovalRequest | null = null;
  private autoApproveSettings: Map<string, boolean> = new Map();
  private sessionAutoApproval: boolean = false;
  private approvalHandler: ToolApprovalHandler | null = null;
  private autoApprovedServers: Set<string> = new Set();

  /** Creates the singleton approval manager. */
  private constructor() {
    super();
  }

  /**
   * Returns the shared inline approval manager instance.
   *
   * @returns Process-local singleton inline approval manager.
   */
  public static getInstance(): InlineToolApprovalManager {
    if (!InlineToolApprovalManager.instance) {
      InlineToolApprovalManager.instance = new InlineToolApprovalManager();
    }
    return InlineToolApprovalManager.instance;
  }

  /**
   * Sets a custom handler used instead of the default event-based approval flow.
   *
   * @param handler - Replacement handler, or `null` to restore inline events.
   * @returns No value.
   */
  public setApprovalHandler(handler: ToolApprovalHandler | null): void {
    this.approvalHandler = handler;
  }

  /**
   * Extracts recent user, Kubernetes, and tool context from an approval manager.
   *
   * History is limited to five messages and three tool results. Extraction
   * failures return the context accumulated so far.
   *
   * @param aiManager - Conversation and Kubernetes state provider.
   * @returns Context snapshot for argument processing and confirmation display.
   */
  private extractUserContext(aiManager: ApprovalManagerContext): UserContext {
    const userContext: UserContext = {
      timeContext: new Date(),
    };

    try {
      // Extract user message from history
      const history = aiManager.history || [];
      const lastUserMessage = history.filter(msg => msg.role === 'user').pop();

      if (lastUserMessage) {
        userContext.userMessage = lastUserMessage.content;
      }

      // Extract conversation history (last 5 messages for context)
      userContext.conversationHistory = history.slice(-5).map(msg => ({
        role: msg.role,
        content: msg.content,
      }));

      // Extract kubernetes context if available
      const kubernetesContext = aiManager.getKubernetesContext?.();
      if (kubernetesContext) {
        userContext.kubernetesContext = {
          selectedClusters: kubernetesContext.selectedClusters,
          namespace: kubernetesContext.namespace,
          currentResource: kubernetesContext.currentResource,
        };
      }

      // Extract last tool results
      const lastToolResults = history.filter(msg => msg.role === 'tool').slice(-3);

      if (lastToolResults.length > 0) {
        userContext.lastToolResults = {};
        lastToolResults.forEach((toolMsg, index) => {
          try {
            const parsed = JSON.parse(toolMsg.content);
            userContext.lastToolResults![`tool_${index}`] = parsed;
          } catch {
            userContext.lastToolResults![`tool_${index}`] = toolMsg.content;
          }
        });
      }
    } catch (error) {
      console.warn('Failed to extract user context:', error);
    }

    return userContext;
  }

  /**
   * Requests approval for tool calls and resolves with the IDs that may run.
   *
   * Session, tool-name, and server rules are applied before a custom handler
   * or inline confirmation is used. A new inline request rejects an existing one.
   *
   * @param toolCalls - Tool calls to evaluate for execution.
   * @param aiManager - Conversation and Kubernetes state for inline context.
   * @returns IDs approved by rules and the configured handler or inline UI.
   */
  async requestApproval(
    toolCalls: ToolCall[],
    aiManager: ApprovalManagerContext
  ): Promise<string[]> {
    // Check if session auto-approval is enabled
    if (this.sessionAutoApproval) {
      return toolCalls.map(tool => tool.id);
    }

    // Check for individual tool auto-approvals
    const autoApprovedTools: string[] = [];
    const needsApprovalTools: ToolCall[] = [];

    for (const tool of toolCalls) {
      if (this.autoApproveSettings.get(tool.name) || this.isToolAutoApproved(tool.name)) {
        autoApprovedTools.push(tool.id);
      } else {
        needsApprovalTools.push(tool);
      }
    }

    // If all tools are auto-approved, return them
    if (needsApprovalTools.length === 0) {
      return autoApprovedTools;
    }

    // If a custom approval handler is set, delegate to it
    if (this.approvalHandler) {
      const approvedIds = await this.approvalHandler.handleApproval(needsApprovalTools);
      return [...autoApprovedTools, ...approvedIds];
    }

    // Default: event-based flow for UI components
    // If there's already a pending request, reject the previous one
    if (this.pendingRequest) {
      this.pendingRequest.reject(new Error('Request superseded by new tool approval request'));
    }

    // Extract user context for intelligent argument processing
    const userContext = this.extractUserContext(aiManager);

    return new Promise<string[]>((resolve, reject) => {
      const requestId = `tool-approval-${Date.now()}-${Math.random()}`;

      /**
       * Resolves the inline request and enables its loading indicator.
       *
       * @param approvedToolIds - IDs selected by the confirmation UI.
       * @returns No value.
       */
      const handleApprove = (approvedToolIds: string[]) => {
        // Combine auto-approved and manually approved tools
        const allApprovedIds = [...autoApprovedTools, ...approvedToolIds];

        // Update the message to show loading state
        if (this.pendingRequest?.updateMessage) {
          this.pendingRequest.updateMessage(true);
        }

        this.pendingRequest = null;
        resolve(allApprovedIds);
      };

      /**
       * Rejects the inline request as denied.
       *
       * @returns No value.
       */
      const handleDeny = () => {
        this.pendingRequest = null;
        reject(new Error('User denied tool execution'));
      };

      /**
       * Emits an updated confirmation payload for the active request.
       *
       * @param loading - Whether the confirmation should display a loading state.
       * @returns No value.
       */
      const updateMessage = (loading: boolean) => {
        // Emit an event to update the UI
        if (this.pendingRequest) {
          this.emit('update-confirmation', {
            requestId: this.pendingRequest.requestId,
            toolConfirmation: {
              tools: this.pendingRequest.toolCalls,
              onApprove: handleApprove,
              onDeny: handleDeny,
              loading: loading,
              requestId: this.pendingRequest.requestId, // Include requestId
              userContext: userContext, // Include user context
            },
          });
        }
      };

      this.pendingRequest = {
        requestId,
        toolCalls: needsApprovalTools,
        resolve: handleApprove,
        reject: handleDeny,
        aiManager,
        updateMessage,
      };

      // Emit event to add the tool confirmation message to chat history
      this.emit('request-confirmation', {
        requestId,
        toolConfirmation: {
          tools: needsApprovalTools,
          onApprove: handleApprove,
          onDeny: handleDeny,
          loading: false,
          requestId: requestId, // Include requestId in the tool confirmation
          userContext: userContext, // Pass user context for intelligent argument processing
        },
        aiManager,
      });
    });
  }

  /**
   * Approves selected tools for the matching request and optionally remembers the choice.
   *
   * Remembering all pending IDs enables session-wide approval. Remembering a
   * subset enables tool-name approval for selected pending calls.
   *
   * @param requestId - Pending inline request identifier to resolve.
   * @param approvedToolIds - IDs selected for execution.
   * @param rememberChoice - Whether to persist the decision for this session.
   * @returns No value.
   */
  public approveTools(requestId: string, approvedToolIds: string[], rememberChoice = false): void {
    if (!this.pendingRequest || this.pendingRequest.requestId !== requestId) {
      console.warn('No matching pending request for approval:', requestId);
      return;
    }

    // Handle remember choice
    if (rememberChoice) {
      // If every pending tool was approved, enable session auto-approval.
      // Use set membership rather than length comparison to be robust against
      // duplicates or extra IDs in approvedToolIds.
      const allToolIds = this.pendingRequest.toolCalls.map(tool => tool.id);
      const approvedSet = new Set(approvedToolIds);
      if (allToolIds.every(id => approvedSet.has(id))) {
        this.sessionAutoApproval = true;
      } else {
        // Remember individual tool approvals
        for (const toolCall of this.pendingRequest.toolCalls) {
          if (approvedToolIds.includes(toolCall.id)) {
            this.autoApproveSettings.set(toolCall.name, true);
          }
        }
      }
    }

    this.pendingRequest.resolve(approvedToolIds);
  }

  /**
   * Denies all tools for the matching pending request.
   *
   * @param requestId - Pending inline request identifier to reject.
   * @returns No value.
   */
  public denyTools(requestId: string): void {
    if (!this.pendingRequest || this.pendingRequest.requestId !== requestId) {
      console.warn('No matching pending request for denial:', requestId);
      return;
    }

    this.pendingRequest.reject(new Error('User denied tool execution'));
  }

  /**
   * Returns the currently pending inline approval request, if any.
   *
   * @returns Active request, or `null` when no confirmation is pending.
   */
  public getPendingRequest(): InlineToolApprovalRequest | null {
    return this.pendingRequest;
  }

  /**
   * Clears session-wide and per-tool approval state.
   *
   * @returns No value.
   */
  public clearSession(): void {
    this.sessionAutoApproval = false;
    this.autoApproveSettings.clear();
  }

  /**
   * Enables or disables session-wide auto-approval.
   *
   * @param enabled - Whether every subsequent tool call should be approved.
   * @returns No value.
   */
  public setSessionAutoApproval(enabled: boolean): void {
    this.sessionAutoApproval = enabled;
  }

  /**
   * Returns whether session-wide auto-approval is enabled.
   *
   * @returns Current session-wide auto-approval state.
   */
  public isSessionAutoApprovalEnabled(): boolean {
    return this.sessionAutoApproval;
  }

  /**
   * Enables or disables auto-approval for one named tool.
   *
   * @param toolName - Exact tool name to configure.
   * @param enabled - Whether the named tool should be auto-approved.
   * @returns No value.
   */
  public setToolAutoApproval(toolName: string, enabled: boolean): void {
    if (enabled) {
      this.autoApproveSettings.set(toolName, true);
    } else {
      this.autoApproveSettings.delete(toolName);
    }
  }

  /**
   * Returns whether a named tool has explicit auto-approval enabled.
   *
   * Server-prefix approval is not included in this result.
   *
   * @param toolName - Exact tool name to inspect.
   * @returns Whether an explicit per-tool rule is enabled.
   */
  public isToolAutoApprovalEnabled(toolName: string): boolean {
    return this.autoApproveSettings.get(toolName) === true;
  }

  /**
   * Replaces the list of MCP servers whose tools should auto-approve.
   *
   * @param serverNames - Server names matched against `<server>__` tool prefixes.
   * @returns No value.
   */
  public setAutoApprovedServers(serverNames: string[]): void {
    this.autoApprovedServers = new Set(serverNames);
  }

  /**
   * Returns whether a tool name matches one of the auto-approved MCP servers.
   *
   * @param toolName - Tool name expected to use a `<server>__<tool>` form.
   * @returns Whether the tool starts with an auto-approved server prefix.
   */
  public isToolAutoApproved(toolName: string): boolean {
    for (const server of this.autoApprovedServers) {
      if (toolName.startsWith(server + '__')) return true;
    }
    return false;
  }

  /**
   * Loads auto-approved server names from desktop MCP configuration when available.
   *
   * Missing or unsuccessful config responses leave the current set unchanged;
   * thrown errors clear it as a safe default.
   *
   * @returns No value after applying, retaining, or clearing the server set.
   */
  public async loadAndApplyAutoApproveSettings(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.desktopApi?.mcp) {
        const response = await window.desktopApi.mcp.getConfig();
        if (response.success && response.config) {
          const autoApprovedNames = response.config.servers
            .filter((server: MCPServer) => server.enabled && server.autoApprove)
            .map((server: MCPServer) => server.name);
          this.setAutoApprovedServers(autoApprovedNames);
        }
      }
    } catch (e) {
      // safe default: no auto-approvals
      this.setAutoApprovedServers([]);
    }
  }
}

/** Shared inline tool approval manager instance. */
export const inlineToolApprovalManager = InlineToolApprovalManager.getInstance();
