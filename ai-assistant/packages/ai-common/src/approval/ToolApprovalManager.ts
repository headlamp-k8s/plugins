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

import { EventEmitter } from 'events';

/** Describes a tool call that may require approval before execution. */
export interface ToolCall {
  /** Unique identifier for the tool call. */
  id: string;
  /** Tool name used for approval rules and execution. */
  name: string;
  /** Optional description shown in approval UI. */
  description?: string;
  /** Arguments that will be passed to the tool. */
  arguments: Record<string, any>;
  /** Origin of the tool implementation. */
  type: 'mcp' | 'regular';
}

/** Represents a pending approval request shared with UI listeners. */
export interface ToolApprovalRequest {
  /** Unique identifier for the approval request. */
  requestId: string;
  /** Tool calls that still need approval. */
  toolCalls: ToolCall[];
  /** Resolves the request with approved tool IDs. */
  resolve: (approvedToolIds: string[]) => void;
  /** Rejects the request with an error. */
  reject: (error: Error) => void;
}

/** Lets non-UI consumers decide which tool calls should be approved. */
export interface ToolApprovalHandler {
  /** Returns the IDs of approved tool calls for the current request. */
  handleApproval(toolCalls: ToolCall[]): Promise<string[]>;
}

/** Returns a handler that approves every requested tool call. */
export function autoApproveAll(): ToolApprovalHandler {
  return {
    async handleApproval(toolCalls: ToolCall[]) {
      return toolCalls.map(t => t.id);
    },
  };
}

/** Manages tool execution approvals using handlers, events, and session rules. */
export class ToolApprovalManager extends EventEmitter {
  private static instance: ToolApprovalManager | null = null;
  private pendingRequest: ToolApprovalRequest | null = null;
  private autoApproveSettings: Map<string, boolean> = new Map();
  private sessionAutoApproval: boolean = false;
  private approvalHandler: ToolApprovalHandler | null = null;

  /** Creates the singleton approval manager. */
  private constructor() {
    super();
  }

  /** Returns the shared approval manager instance. */
  public static getInstance(): ToolApprovalManager {
    if (!ToolApprovalManager.instance) {
      ToolApprovalManager.instance = new ToolApprovalManager();
    }
    return ToolApprovalManager.instance;
  }

  /** Sets a custom handler used instead of the default event-based approval flow. */
  public setApprovalHandler(handler: ToolApprovalHandler | null): void {
    this.approvalHandler = handler;
  }

  /** Requests approval for the given tool calls and resolves with approved IDs. */
  public async requestApproval(toolCalls: ToolCall[]): Promise<string[]> {
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

  /** Approves selected tools for the matching request and optionally remembers the choice. */
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

  /** Denies the matching pending tool request. */
  public denyTools(requestId: string): void {
    if (!this.pendingRequest || this.pendingRequest.requestId !== requestId) {
      console.warn('No matching pending request for denial:', requestId);
      return;
    }

    this.pendingRequest.reject(new Error('User denied tool execution'));
  }

  /** Returns the current pending approval request, if one exists. */
  public getPendingRequest(): ToolApprovalRequest | null {
    return this.pendingRequest;
  }

  /** Clears all session-scoped auto-approval settings. */
  public clearSession(): void {
    this.sessionAutoApproval = false;
    this.autoApproveSettings.clear();
  }

  /** Enables or disables session-wide auto-approval. */
  public setSessionAutoApproval(enabled: boolean): void {
    this.sessionAutoApproval = enabled;
  }

  /** Returns whether session-wide auto-approval is currently enabled. */
  public isSessionAutoApprovalEnabled(): boolean {
    return this.sessionAutoApproval;
  }

  /** Returns session and per-tool auto-approval settings for inspection. */
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

/** Shared tool approval manager instance. */
export const toolApprovalManager = ToolApprovalManager.getInstance();
