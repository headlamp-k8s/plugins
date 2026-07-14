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

import { describe, expect, it, vi } from 'vitest';
import { createMockApprovalManager } from './MockApprovalManager';

const regularTool = { id: 'c1', name: 'k8s', arguments: {}, type: 'regular' as const };
const mcpTool = { id: 'c2', name: 'mcp_tool', arguments: {}, type: 'mcp' as const };

describe('MockApprovalManager', () => {
  it('loads auto-approve settings without throwing', async () => {
    await expect(
      createMockApprovalManager().loadAndApplyAutoApproveSettings()
    ).resolves.toBeUndefined();
  });

  it('approves all submitted calls by default', async () => {
    expect(await createMockApprovalManager().requestApproval([regularTool, mcpTool])).toEqual([
      'c1',
      'c2',
    ]);
  });

  it('approves an empty submission', async () => {
    expect(await createMockApprovalManager().requestApproval([])).toEqual([]);
  });

  it('rejects calls in deny-all mode', async () => {
    await expect(
      createMockApprovalManager({ mode: 'deny-all' }).requestApproval([regularTool])
    ).rejects.toThrow();
  });

  it('rejects MCP-only calls in approve-builtin-only mode', async () => {
    await expect(
      createMockApprovalManager({ mode: 'approve-builtin-only' }).requestApproval([mcpTool])
    ).rejects.toThrow();
  });

  it('approves only regular calls in approve-builtin-only mode', async () => {
    expect(
      await createMockApprovalManager({ mode: 'approve-builtin-only' }).requestApproval([
        regularTool,
        mcpTool,
      ])
    ).toEqual(['c1']);
  });

  it('notifies the request callback', async () => {
    const onRequestApproval = vi.fn();
    const manager = createMockApprovalManager({ onRequestApproval });
    await manager.requestApproval([regularTool]);
    expect(onRequestApproval).toHaveBeenCalledOnce();
    expect(onRequestApproval).toHaveBeenCalledWith([regularTool]);
  });

  it('supports the event emitter surface', () => {
    const manager = createMockApprovalManager();
    expect(() => {
      manager.on('request-confirmation', () => {});
      manager.off('request-confirmation', () => {});
      manager.emit('request-confirmation', { id: '1' });
    }).not.toThrow();
  });

  it('has no pending request', () => {
    expect(createMockApprovalManager().getPendingRequest()).toBeNull();
  });

  it('reports session auto-approval in approve-all mode', () => {
    expect(createMockApprovalManager({ mode: 'approve-all' }).isSessionAutoApprovalEnabled()).toBe(
      true
    );
  });

  it('does not report session auto-approval in deny-all mode', () => {
    expect(createMockApprovalManager({ mode: 'deny-all' }).isSessionAutoApprovalEnabled()).toBe(
      false
    );
  });

  it('handleApproval approves calls in approve-all mode', async () => {
    expect(
      await createMockApprovalManager({ mode: 'approve-all' }).handleApproval([
        regularTool,
        mcpTool,
      ])
    ).toEqual(['c1', 'c2']);
  });

  it('handleApproval rejects calls in deny-all mode', async () => {
    await expect(
      createMockApprovalManager({ mode: 'deny-all' }).handleApproval([regularTool])
    ).rejects.toThrow();
  });

  it('satisfies the approval handler contract', () => {
    expect(typeof createMockApprovalManager().handleApproval).toBe('function');
  });
});
