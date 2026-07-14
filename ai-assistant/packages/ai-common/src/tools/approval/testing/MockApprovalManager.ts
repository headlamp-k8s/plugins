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
 * | `requestApproval(toolCalls)` | approves all or none depending on `mode` |
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
 * langChainManager.setApprovalManager(mgr); // if injection is wired
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
  /** Approve built-in tools, deny MCP tools — mirrors the real auto-approve default. */
  | 'approve-builtin-only';

/** Optional tool-result override keyed by tool name. */
export interface MockApprovalOptions {
  /**
   * Determines which tool calls get approved.  Defaults to `'approve-all'`.
   */
  mode?: MockApprovalMode;

  /**
   * Optional spy / callback invoked every time `requestApproval` is called.
   * Useful for asserting the set of tools that were submitted for approval.
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
   */
  async handleApproval(toolCalls: ToolCall[]): Promise<string[]> {
    return this.requestApproval(toolCalls);
  }

  // ── Core methods used by LangChainManager ─────────────────────────────────

  /** Resolves immediately — no settings to load in tests or CLI. */
  async loadAndApplyAutoApproveSettings(): Promise<void> {
    return;
  }

  /**
   * Returns the IDs of approved tool calls according to `mode`.
   *
   * - `approve-all`: returns every ID.
   * - `deny-all`: throws (simulates user denial) so the caller's catch block runs.
   * - `approve-builtin-only`: returns IDs of tools whose `type` is not `'mcp'`.
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

  /** No-op — mock does not emit events. */
  on(_event: string, _listener: unknown): this {
    return this;
  }

  /** No-op. */
  off(_event: string, _listener: unknown): this {
    return this;
  }

  /** No-op. */
  emit(_event: string, ..._args: unknown[]): boolean {
    return false;
  }

  // ── Additional public API used elsewhere ──────────────────────────────────

  setApprovalHandler(_handler: unknown): void {}
  setSessionAutoApproval(_enabled: boolean): void {}
  isSessionAutoApprovalEnabled(): boolean {
    return this.mode === 'approve-all';
  }
  setToolAutoApproval(_toolName: string, _enabled: boolean): void {}
  isToolAutoApprovalEnabled(_toolName: string): boolean {
    return this.mode === 'approve-all';
  }
  setAutoApprovedServers(_servers: string[]): void {}
  isToolAutoApproved(_toolName: string): boolean {
    return this.mode === 'approve-all';
  }
  getPendingRequest(): null {
    return null;
  }
  clearSession(): void {}
  approveTools(_requestId: string, _ids: string[]): void {}
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
 */
export function createMockApprovalManager(options: MockApprovalOptions = {}): MockApprovalManager {
  return new MockApprovalManager(options);
}
