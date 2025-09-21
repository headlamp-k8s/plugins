import { EventEmitter } from 'events';

export interface ToolCall {
  id: string;
  name: string;
  description?: string;
  arguments: Record<string, any>;
  type: 'mcp' | 'regular';
}

export interface ToolApprovalRequest {
  requestId: string;
  toolCalls: ToolCall[];
  resolve: (approvedToolIds: string[]) => void;
  reject: (error: Error) => void;
}

export class ToolApprovalManager extends EventEmitter {
  private static instance: ToolApprovalManager | null = null;
  private pendingRequest: ToolApprovalRequest | null = null;
  private autoApproveSettings: Map<string, boolean> = new Map();
  private sessionAutoApproval: boolean = false;

  private constructor() {
    super();
  }

  public static getInstance(): ToolApprovalManager {
    if (!ToolApprovalManager.instance) {
      ToolApprovalManager.instance = new ToolApprovalManager();
    }
    return ToolApprovalManager.instance;
  }

  /**
   * Request approval for tool execution
   */
  public async requestApproval(toolCalls: ToolCall[]): Promise<string[]> {
    // Check if session auto-approval is enabled
    if (this.sessionAutoApproval) {
      console.log('Auto-approving tools due to session setting');
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
      console.log('All tools auto-approved:', autoApprovedTools);
      return autoApprovedTools;
    }

    // If there's already a pending request, reject the previous one
    if (this.pendingRequest) {
      this.pendingRequest.reject(new Error('Request superseded by new tool approval request'));
    }

    return new Promise<string[]>((resolve, reject) => {
      const requestId = `tool-approval-${Date.now()}-${Math.random()}`;

      this.pendingRequest = {
        requestId,
        toolCalls: needsApprovalTools,
        resolve: (approvedToolIds: string[]) => {
          // Combine auto-approved and manually approved tools
          const allApprovedIds = [...autoApprovedTools, ...approvedToolIds];
          this.pendingRequest = null;
          resolve(allApprovedIds);
        },
        reject: (error: Error) => {
          this.pendingRequest = null;
          reject(error);
        },
      };

      // Emit event for UI components to listen to
      this.emit('approval-requested', this.pendingRequest);
    });
  }

  /**
   * Approve tools from the UI
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
        console.log('Session auto-approval enabled');
      } else {
        // Remember individual tool approvals
        for (const toolCall of this.pendingRequest.toolCalls) {
          if (approvedToolIds.includes(toolCall.id)) {
            this.autoApproveSettings.set(toolCall.name, true);
          }
        }
        console.log('Individual tool approvals saved');
      }
    }

    this.pendingRequest.resolve(approvedToolIds);
  }

  /**
   * Deny all tools from the UI
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
  public getPendingRequest(): ToolApprovalRequest | null {
    return this.pendingRequest;
  }

  /**
   * Clear session settings (called when user explicitly clears or starts new session)
   */
  public clearSession(): void {
    this.sessionAutoApproval = false;
    this.autoApproveSettings.clear();
    console.log('Tool approval session settings cleared');
  }

  /**
   * Set session auto-approval
   */
  public setSessionAutoApproval(enabled: boolean): void {
    this.sessionAutoApproval = enabled;
  }

  /**
   * Check if session auto-approval is enabled
   */
  public isSessionAutoApprovalEnabled(): boolean {
    return this.sessionAutoApproval;
  }

  /**
   * Get auto-approval settings for debugging
   */
  public getAutoApprovalSettings(): {
    sessionAutoApproval: boolean;
    toolSettings: Array<{ toolName: string; autoApprove: boolean }>;
  } {
    return {
      sessionAutoApproval: this.sessionAutoApproval,
      toolSettings: Array.from(this.autoApproveSettings.entries()).map(
        ([toolName, autoApprove]) => ({
          toolName,
          autoApprove,
        })
      ),
    };
  }
}

// Export singleton instance
export const toolApprovalManager = ToolApprovalManager.getInstance();
