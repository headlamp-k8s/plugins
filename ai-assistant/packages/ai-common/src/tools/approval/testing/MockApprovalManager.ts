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
 * MockApprovalManager — a drop-in replacement for `InlineToolApprovalManager`
 * for use in tests, the CLI, and demo/development UIs.
 *
 * ### Behaviour
 *
 * | Method | Action |
 * |---|---|
 * | `loadAndApplyAutoApproveSettings()` | resolves immediately (no-op) |
 * | `requestApproval(toolCalls)` | approves all, denies all, or approves only non-MCP calls |
 * | `setApprovalHandler` / `on` / `emit` / `off` | silently no-op |
 * | all other public methods | silently no-op or return safe defaults |
 *
 * ### Usage
 *
 * ```ts
 * // In a vitest test:
 * vi.mock('../approval/InlineToolApprovalManager', () => ({
 *   inlineToolApprovalManager: createMockApprovalManager(),
 * }));
 *
 * // In a CLI session (auto-approve everything):
 * const mgr = createMockApprovalManager({ mode: 'approve-all' });
 * inlineToolApprovalManager.setApprovalHandler(mgr);
 * ```
 */

import type { ToolCall } from '../../types';
import type { ToolApprovalHandler } from '../ToolApprovalManager';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Controls how the mock approval manager handles tool-call approval requests. */
export type MockApprovalMode =
  /** Approve every tool call in every request (default). */
  | 'approve-all'
  /** Deny every tool call — simulates the user always clicking "Deny". */
  | 'deny-all'
  /** Approve non-MCP tools and deny MCP tools. */
  | 'approve-builtin-only';

/** Options controlling mock approval decisions and observation. */
export interface MockApprovalOptions {
  /**
   * Determines which tool calls get approved.  Defaults to `'approve-all'`.
   */
  mode?: MockApprovalMode;

  /**
   * Optional spy / callback invoked every time `requestApproval` is called.
   * Useful for asserting the set of tools that were submitted for approval.
   *
   * @param toolCalls - Original tool-call array submitted to the mock.
   * @returns No value.
   */
  onRequestApproval?: (toolCalls: ToolCall[]) => void;
}

// ---------------------------------------------------------------------------
// MockApprovalManager
// ---------------------------------------------------------------------------

/**
 * A lightweight, synchronous stand-in for `InlineToolApprovalManager` with no
 * external dependencies.  All event-listener and UI-update APIs are silently
 * ignored.
 *
 * Implements `ToolApprovalHandler` so it can be plugged directly into the
 * existing `inlineToolApprovalManager.setApprovalHandler(...)` hook:
 *
 * ```ts
 * // CLI: auto-approve everything
 * inlineToolApprovalManager.setApprovalHandler(
 *   createMockApprovalManager({ mode: 'approve-all' })
 * );
 * ```
 *
 * Construct via `createMockApprovalManager()`.
 */
export class MockApprovalManager implements ToolApprovalHandler {
  private readonly mode: MockApprovalMode;
  private readonly onRequestApproval?: (toolCalls: ToolCall[]) => void;

  /**
   * Creates a mock approval handler with fixed mode behavior.
   *
   * @param options - Approval mode and optional request observer.
   */
  constructor(options: MockApprovalOptions = {}) {
    this.mode = options.mode ?? 'approve-all';
    this.onRequestApproval = options.onRequestApproval;
  }

  /**
   * Implements `ToolApprovalHandler.handleApproval` so this class can be
   * passed directly to `inlineToolApprovalManager.setApprovalHandler(...)`.
   *
   * The CLI uses this to auto-approve all tools without a UI prompt:
   * ```ts
   * inlineToolApprovalManager.setApprovalHandler(
   *   createMockApprovalManager({ mode: 'approve-all' })
   * );
   * ```
   *
   * @param toolCalls - Tool calls to evaluate.
   * @returns IDs approved by the configured mode.
   * @throws When the configured mode denies the complete request.
   */
  async handleApproval(toolCalls: ToolCall[]): Promise<string[]> {
    return this.requestApproval(toolCalls);
  }

  // ── Core approval methods ──────────────────────────────────────────────────

  /**
   * Resolves immediately without loading settings.
   *
   * @returns No value.
   */
  async loadAndApplyAutoApproveSettings(): Promise<void> {
    return;
  }

  /**
   * Returns the IDs of approved tool calls according to `mode`.
   *
   * - `approve-all`: returns every ID.
   * - `deny-all`: throws (simulates user denial) so the caller's catch block runs.
   * - `approve-builtin-only`: returns non-MCP IDs, or throws when none exist.
   *
   * The optional observer receives the original array before the decision.
   *
   * @param toolCalls - Tool calls to evaluate without mutation.
   * @param _aiManager - Unused context accepted for compatibility with inline approval.
   * @returns IDs approved by the configured mode.
   * @throws When mode is `deny-all`, or `approve-builtin-only` finds no non-MCP calls.
   */
  async requestApproval(toolCalls: ToolCall[], _aiManager?: unknown): Promise<string[]> {
    this.onRequestApproval?.(toolCalls);

    switch (this.mode) {
      case 'deny-all':
        throw new Error('MockApprovalManager: all tools denied');

      case 'approve-builtin-only': {
        const approved = toolCalls.filter(tc => tc.type !== 'mcp').map(tc => tc.id);
        if (approved.length === 0) throw new Error('MockApprovalManager: MCP tools denied');
        return approved;
      }

      case 'approve-all':
      default:
        return toolCalls.map(tc => tc.id);
    }
  }

  // ── Event emitter surface (no-ops) ────────────────────────────────────────

  /**
   * Ignores an event-listener registration.
   *
   * @param _event - Ignored event name.
   * @param _listener - Ignored listener.
   * @returns This mock for chaining.
   */
  on(_event: string, _listener: unknown): this {
    return this;
  }

  /**
   * Ignores an event-listener removal.
   *
   * @param _event - Ignored event name.
   * @param _listener - Ignored listener.
   * @returns This mock for chaining.
   */
  off(_event: string, _listener: unknown): this {
    return this;
  }

  /**
   * Ignores an event emission.
   *
   * @param _event - Ignored event name.
   * @param _args - Ignored event arguments.
   * @returns Always `false` because no listeners are tracked.
   */
  emit(_event: string, ..._args: unknown[]): boolean {
    return false;
  }

  // ── Additional public API used elsewhere ──────────────────────────────────

  /**
   * Ignores replacement approval handlers.
   *
   * @param _handler - Ignored handler value.
   * @returns No value.
   */
  setApprovalHandler(_handler: unknown): void {}
  /**
   * Ignores attempts to change the constructor-selected mode.
   *
   * @param _enabled - Ignored session setting.
   * @returns No value.
   */
  setSessionAutoApproval(_enabled: boolean): void {}
  /**
   * Reports whether the fixed mode approves all calls.
   *
   * @returns Whether mode is `approve-all`.
   */
  isSessionAutoApprovalEnabled(): boolean {
    return this.mode === 'approve-all';
  }
  /**
   * Ignores attempts to configure one tool.
   *
   * @param _toolName - Ignored tool name.
   * @param _enabled - Ignored approval state.
   * @returns No value.
   */
  setToolAutoApproval(_toolName: string, _enabled: boolean): void {}
  /**
   * Reports fixed all-call approval without inspecting the tool name.
   *
   * @param _toolName - Ignored tool name.
   * @returns Whether mode is `approve-all`.
   */
  isToolAutoApprovalEnabled(_toolName: string): boolean {
    return this.mode === 'approve-all';
  }
  /**
   * Ignores attempts to configure approved MCP servers.
   *
   * @param _servers - Ignored server names.
   * @returns No value.
   */
  setAutoApprovedServers(_servers: string[]): void {}
  /**
   * Reports fixed all-call approval without inspecting server prefixes.
   *
   * @param _toolName - Ignored tool name.
   * @returns Whether mode is `approve-all`.
   */
  isToolAutoApproved(_toolName: string): boolean {
    return this.mode === 'approve-all';
  }
  /**
   * Returns no pending request because decisions complete immediately.
   *
   * @returns Always `null`.
   */
  getPendingRequest(): null {
    return null;
  }
  /**
   * Leaves the immutable constructor-selected mode unchanged.
   *
   * @returns No value.
   */
  clearSession(): void {}
  /**
   * Ignores an external approval decision because no request is queued.
   *
   * @param _requestId - Ignored request identifier.
   * @param _ids - Ignored approved IDs.
   * @returns No value.
   */
  approveTools(_requestId: string, _ids: string[]): void {}
  /**
   * Ignores an external denial because no request is queued.
   *
   * @param _requestId - Ignored request identifier.
   * @returns No value.
   */
  denyTools(_requestId: string): void {}
}

// ---------------------------------------------------------------------------
// Factory
// ---------------------------------------------------------------------------

/**
 * Creates a `MockApprovalManager` configured with the given options.
 *
 * @example
 * ```ts
 * // Approve all tools (test default)
 * const mgr = createMockApprovalManager();
 *
 * // Deny all MCP tool calls
 * const mgr = createMockApprovalManager({ mode: 'deny-all' });
 *
 * // Track which tools were submitted
 * const submitted: ToolCall[] = [];
 * const mgr = createMockApprovalManager({
 *   onRequestApproval: calls => submitted.push(...calls),
 * });
 * ```
 *
 * @param options - Approval mode and optional request observer.
 * @returns Configured mock approval manager.
 */
export function createMockApprovalManager(options: MockApprovalOptions = {}): MockApprovalManager {
  return new MockApprovalManager(options);
}
