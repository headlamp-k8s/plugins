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

import type { ToolCall } from '../types';
import { EventEmitter } from './events';

/** Represents a pending approval request shared with UI listeners. */
export interface ToolApprovalRequest {
  /** Unique identifier for the approval request. */
  requestId: string;
  /** Tool calls that still need approval. */
  toolCalls: ToolCall[];
  /**
   * Resolves the request with approved tool IDs.
   *
   * @param approvedToolIds - IDs selected by the approval UI.
   * @returns No value.
   */
  resolve: (approvedToolIds: string[]) => void;
  /**
   * Rejects the request with an error.
   *
   * @param error - Reason the approval request cannot continue.
   * @returns No value.
   */
  reject: (error: Error) => void;
}

/** Lets non-UI consumers decide which tool calls should be approved. */
export interface ToolApprovalHandler {
  /**
   * Selects approved tool calls for the current request.
   *
   * @param toolCalls - Calls that are not covered by auto-approval rules.
   * @returns IDs approved by the handler.
   */
  handleApproval(toolCalls: ToolCall[]): Promise<string[]>;
}

/**
 * Creates a handler that approves every requested tool call.
 *
 * @returns Handler that maps each call to its ID.
 */
export function autoApproveAll(): ToolApprovalHandler {
  return {
    /**
     * Approves every provided tool call.
     *
     * @param toolCalls - Tool calls awaiting a decision.
     * @returns Every provided tool-call ID.
     */
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

  /**
   * Returns the shared approval manager instance.
   *
   * @returns Process-local singleton approval manager.
   */
  public static getInstance(): ToolApprovalManager {
    if (!ToolApprovalManager.instance) {
      ToolApprovalManager.instance = new ToolApprovalManager();
    }
    return ToolApprovalManager.instance;
  }

  /**
   * Sets a custom handler used instead of the default event-based approval flow.
   *
   * @param handler - Replacement handler, or `null` to restore event-based approval.
   * @returns No value.
   */
  public setApprovalHandler(handler: ToolApprovalHandler | null): void {
    this.approvalHandler = handler;
  }

  /**
   * Requests approval for tool calls after applying session and per-tool rules.
   *
   * A new event-based request rejects any request that is still pending.
   *
   * @param toolCalls - Tool calls to evaluate for approval.
   * @returns IDs approved automatically and by the configured handler or UI.
   */
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
        /**
         * Completes the pending request with UI-approved IDs.
         *
         * @param approvedToolIds - IDs selected by the UI.
         * @returns No value.
         */
        resolve: (approvedToolIds: string[]) => {
          // Combine auto-approved and manually approved tools
          const allApprovedIds = [...autoApprovedTools, ...approvedToolIds];
          this.pendingRequest = null;
          resolve(allApprovedIds);
        },
        /**
         * Fails the pending request and clears it.
         *
         * @param error - Failure reported to the requester.
         * @returns No value.
         */
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
   * Approves selected tools for the matching request and optionally remembers the choice.
   *
   * Remembering all pending IDs enables session-wide approval. Remembering a
   * subset enables per-tool-name approval for selected pending calls.
   *
   * @param requestId - Pending request identifier to resolve.
   * @param approvedToolIds - IDs selected for approval.
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
   * Denies the matching pending tool request.
   *
   * @param requestId - Pending request identifier to reject.
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
   * Returns the current pending approval request, if one exists.
   *
   * @returns Pending event-based request, or `null` when idle.
   */
  public getPendingRequest(): ToolApprovalRequest | null {
    return this.pendingRequest;
  }

  /**
   * Clears all session-scoped auto-approval settings.
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
   * @param enabled - Whether all subsequent calls should be auto-approved.
   * @returns No value.
   */
  public setSessionAutoApproval(enabled: boolean): void {
    this.sessionAutoApproval = enabled;
  }

  /**
   * Returns whether session-wide auto-approval is currently enabled.
   *
   * @returns Current session-wide auto-approval state.
   */
  public isSessionAutoApprovalEnabled(): boolean {
    return this.sessionAutoApproval;
  }

  /**
   * Returns session and per-tool auto-approval settings for inspection.
   *
   * @returns Snapshot of session-wide and tool-name-specific settings.
   */
  public getAutoApprovalSettings(): {
    /** Whether session-wide auto-approval is enabled. */
    sessionAutoApproval: boolean;
    /** Per-tool-name auto-approval settings. */
    toolSettings: Array<{
      /** Tool name covered by the setting. */
      toolName: string;
      /** Whether calls with this tool name are auto-approved. */
      autoApprove: boolean;
    }>;
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
