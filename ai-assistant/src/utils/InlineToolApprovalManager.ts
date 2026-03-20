import { EventEmitter } from 'events';
import { ToolCall } from '../ai/manager';
import { UserContext } from '../components/mcpOutput/MCPArgumentProcessor';

export interface InlineToolApprovalRequest {
  requestId: string;
  toolCalls: ToolCall[];
  resolve: (approvedToolIds: string[]) => void;
  reject: (error: Error) => void;
  // Reference to the AI manager for adding messages to history
  aiManager?: any;
  // Callback to update the specific message with loading state
  updateMessage?: (loading: boolean) => void;
}

export class InlineToolApprovalManager extends EventEmitter {
  private static instance: InlineToolApprovalManager | null = null;
  private pendingRequest: InlineToolApprovalRequest | null = null;
  private autoApproveSettings: Map<string, boolean> = new Map();
  private sessionAutoApproval: boolean = false;

  private constructor() {
    super();
  }

  public static getInstance(): InlineToolApprovalManager {
    if (!InlineToolApprovalManager.instance) {
      InlineToolApprovalManager.instance = new InlineToolApprovalManager();
    }
    return InlineToolApprovalManager.instance;
  }

  /**
   * Extract user context from AI manager
   */
  private extractUserContext(aiManager: any): UserContext {
    const userContext: UserContext = {
      timeContext: new Date(),
    };

    try {
      // Extract user message from history
      const history = aiManager.history || [];
      const lastUserMessage = history.filter((msg: any) => msg.role === 'user').pop();

      if (lastUserMessage) {
        userContext.userMessage = lastUserMessage.content;
      }

      // Extract conversation history (last 5 messages for context)
      userContext.conversationHistory = history.slice(-5).map((msg: any) => ({
        role: msg.role,
        content: msg.content,
      }));

      // Extract kubernetes context if available
      if (aiManager.toolManager?.kubernetesContext) {
        userContext.kubernetesContext = {
          selectedClusters: aiManager.toolManager.kubernetesContext.selectedClusters,
          namespace: aiManager.toolManager.kubernetesContext.namespace,
          currentResource: aiManager.toolManager.kubernetesContext.currentResource,
        };
      }

      // Extract last tool results
      const lastToolResults = history.filter((msg: any) => msg.role === 'tool').slice(-3);

      if (lastToolResults.length > 0) {
        userContext.lastToolResults = {};
        lastToolResults.forEach((toolMsg: any, index: number) => {
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
   * Request approval for tool execution via inline chat message
   */
  async requestApproval(toolCalls: any[], aiManager: any): Promise<string[]> {
    // Check if session auto-approval is enabled
    if (this.sessionAutoApproval) {
      return toolCalls.map(tool => tool.id);
    }

    // Check for individual tool auto-approvals
    const autoApprovedTools: string[] = [];
    const needsApprovalTools: ToolCall[] = [];

    for (const tool of toolCalls) {
      if (this.autoApproveSettings.get(tool.name)) {
        autoApprovedTools.push(tool.id);
      } else {
        needsApprovalTools.push(tool);
      }
    }

    // If all tools are auto-approved, return them
    if (needsApprovalTools.length === 0) {
      return autoApprovedTools;
    }

    // If there's already a pending request, reject the previous one
    if (this.pendingRequest) {
      this.pendingRequest.reject(new Error('Request superseded by new tool approval request'));
    }

    // Extract user context for intelligent argument processing
    const userContext = this.extractUserContext(aiManager);

    return new Promise<string[]>((resolve, reject) => {
      const requestId = `tool-approval-${Date.now()}-${Math.random()}`;

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

      const handleDeny = () => {
        this.pendingRequest = null;
        reject(new Error('User denied tool execution'));
      };

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
   * Approve tools (called from inline confirmation component)
   */
  public approveTools(requestId: string, approvedToolIds: string[], rememberChoice = false): void {
    if (!this.pendingRequest || this.pendingRequest.requestId !== requestId) {
      console.warn('No matching pending request for approval:', requestId);
      return;
    }

    // Handle remember choice
    if (rememberChoice) {
      // If all tools were approved, enable session auto-approval
      const allToolIds = this.pendingRequest.toolCalls.map(tool => tool.id);
      if (approvedToolIds.length === allToolIds.length) {
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
   * Deny all tools (called from inline confirmation component)
   */
  public denyTools(requestId: string): void {
    if (!this.pendingRequest || this.pendingRequest.requestId !== requestId) {
      console.warn('No matching pending request for denial:', requestId);
      return;
    }

    this.pendingRequest.reject(new Error('User denied tool execution'));
  }

  /**
   * Get current pending request
   */
  public getPendingRequest(): InlineToolApprovalRequest | null {
    return this.pendingRequest;
  }

  /**
   * Clear session settings (called when user explicitly clears or starts new session)
   */
  public clearSession(): void {
    this.sessionAutoApproval = false;
    this.autoApproveSettings.clear();
  }

  /**
   * Set session auto-approval
   */
  public setSessionAutoApproval(enabled: boolean): void {
    this.sessionAutoApproval = enabled;
  }

  /**
   * Get session auto-approval status
   */
  public isSessionAutoApprovalEnabled(): boolean {
    return this.sessionAutoApproval;
  }

  /**
   * Set auto-approval for a specific tool
   */
  public setToolAutoApproval(toolName: string, enabled: boolean): void {
    if (enabled) {
      this.autoApproveSettings.set(toolName, true);
    } else {
      this.autoApproveSettings.delete(toolName);
    }
  }

  /**
   * Check if a tool has auto-approval enabled
   */
  public isToolAutoApprovalEnabled(toolName: string): boolean {
    return this.autoApproveSettings.get(toolName) === true;
  }
}

// Export singleton instance
export const inlineToolApprovalManager = InlineToolApprovalManager.getInstance();
