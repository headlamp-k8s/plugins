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

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ToolCall } from '../ai/manager';
import { InlineToolApprovalManager, inlineToolApprovalManager } from './InlineToolApprovalManager';

function makeToolCall(id: string, name: string): ToolCall {
  return {
    id,
    name,
    arguments: {},
    type: 'regular',
  };
}

function makeAiManager(overrides: Record<string, any> = {}) {
  return {
    history: [],
    ...overrides,
  };
}

describe('InlineToolApprovalManager', () => {
  beforeEach(() => {
    inlineToolApprovalManager.clearSession();
    inlineToolApprovalManager.setApprovalHandler(null);
    inlineToolApprovalManager.setAutoApprovedServers([]);

    const pendingRequest = inlineToolApprovalManager.getPendingRequest();
    if (pendingRequest) {
      inlineToolApprovalManager.denyTools(pendingRequest.requestId);
    }
  });

  it('getInstance returns the singleton instance', () => {
    expect(InlineToolApprovalManager.getInstance()).toBe(inlineToolApprovalManager);
    expect(InlineToolApprovalManager.getInstance()).toBe(InlineToolApprovalManager.getInstance());
  });

  it('requestApproval returns all IDs when session auto-approval is enabled', async () => {
    inlineToolApprovalManager.setSessionAutoApproval(true);

    await expect(
      inlineToolApprovalManager.requestApproval(
        [makeToolCall('1', 'tool-a'), makeToolCall('2', 'tool-b')],
        makeAiManager()
      )
    ).resolves.toEqual(['1', '2']);
  });

  it('requestApproval returns individually auto-approved IDs alongside handler-approved IDs', async () => {
    inlineToolApprovalManager.setToolAutoApproval('tool-a', true);
    const handler = {
      handleApproval: vi.fn(async (toolCalls: ToolCall[]) => toolCalls.map(tool => tool.id)),
    };
    inlineToolApprovalManager.setApprovalHandler(handler);

    const toolCalls = [makeToolCall('1', 'tool-a'), makeToolCall('2', 'tool-b')];

    await expect(
      inlineToolApprovalManager.requestApproval(toolCalls, makeAiManager())
    ).resolves.toEqual(['1', '2']);
    expect(handler.handleApproval).toHaveBeenCalledWith([toolCalls[1]]);
  });

  it('requestApproval auto-approves tools from configured servers', async () => {
    inlineToolApprovalManager.setAutoApprovedServers(['github']);
    const handler = {
      handleApproval: vi.fn(async (toolCalls: ToolCall[]) => toolCalls.map(tool => tool.id)),
    };
    inlineToolApprovalManager.setApprovalHandler(handler);

    const toolCalls = [makeToolCall('1', 'github__search'), makeToolCall('2', 'tool-b')];

    await expect(
      inlineToolApprovalManager.requestApproval(toolCalls, makeAiManager())
    ).resolves.toEqual(['1', '2']);
    expect(inlineToolApprovalManager.isToolAutoApproved('github__search')).toBe(true);
    expect(inlineToolApprovalManager.isToolAutoApproved('gitlab__search')).toBe(false);
    expect(handler.handleApproval).toHaveBeenCalledWith([toolCalls[1]]);
  });

  it('approveTools resolves the pending request', async () => {
    const approvalPromise = inlineToolApprovalManager.requestApproval(
      [makeToolCall('1', 'tool-a'), makeToolCall('2', 'tool-b')],
      makeAiManager()
    );
    const pendingRequest = inlineToolApprovalManager.getPendingRequest();

    expect(pendingRequest).not.toBeNull();

    inlineToolApprovalManager.approveTools(pendingRequest!.requestId, ['2']);

    await expect(approvalPromise).resolves.toEqual(['2']);
    expect(inlineToolApprovalManager.getPendingRequest()).toBeNull();
  });

  it('denyTools rejects the pending request', async () => {
    const approvalPromise = inlineToolApprovalManager.requestApproval(
      [makeToolCall('1', 'tool-a')],
      makeAiManager()
    );
    const pendingRequest = inlineToolApprovalManager.getPendingRequest();

    inlineToolApprovalManager.denyTools(pendingRequest!.requestId);

    await expect(approvalPromise).rejects.toThrow('User denied tool execution');
    expect(inlineToolApprovalManager.getPendingRequest()).toBeNull();
  });

  it('setToolAutoApproval and isToolAutoApprovalEnabled update per-tool approval state', () => {
    expect(inlineToolApprovalManager.isToolAutoApprovalEnabled('tool-a')).toBe(false);

    inlineToolApprovalManager.setToolAutoApproval('tool-a', true);
    expect(inlineToolApprovalManager.isToolAutoApprovalEnabled('tool-a')).toBe(true);

    inlineToolApprovalManager.setToolAutoApproval('tool-a', false);
    expect(inlineToolApprovalManager.isToolAutoApprovalEnabled('tool-a')).toBe(false);
  });

  it('setAutoApprovedServers enables server-based auto-approval', () => {
    inlineToolApprovalManager.setAutoApprovedServers(['github', 'filesystem']);

    expect(inlineToolApprovalManager.isToolAutoApproved('github__search')).toBe(true);
    expect(inlineToolApprovalManager.isToolAutoApproved('filesystem__read_file')).toBe(true);
    expect(inlineToolApprovalManager.isToolAutoApproved('default_tool')).toBe(false);
  });

  it('clearSession resets session and per-tool auto-approval state', () => {
    inlineToolApprovalManager.setSessionAutoApproval(true);
    inlineToolApprovalManager.setToolAutoApproval('tool-a', true);

    inlineToolApprovalManager.clearSession();

    expect(inlineToolApprovalManager.isSessionAutoApprovalEnabled()).toBe(false);
    expect(inlineToolApprovalManager.isToolAutoApprovalEnabled('tool-a')).toBe(false);
  });
});
