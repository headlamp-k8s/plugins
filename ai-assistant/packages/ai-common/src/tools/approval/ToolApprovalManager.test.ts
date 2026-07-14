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

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ToolCall } from '../types';
import { autoApproveAll, ToolApprovalManager, toolApprovalManager } from './ToolApprovalManager';

function makeToolCall(id: string, name: string): ToolCall {
  return {
    id,
    name,
    arguments: {},
    type: 'regular',
  };
}

describe('ToolApprovalManager', () => {
  it('keeps MCP argument processing independent of UI component modules', () => {
    const source = readFileSync(resolve(__dirname, '../../mcp/tools/ArgumentProcessor.ts'), 'utf8');
    expect(source).not.toContain('/components/');
  });
  beforeEach(() => {
    toolApprovalManager.clearSession();
    toolApprovalManager.setApprovalHandler(null);

    const pendingRequest = toolApprovalManager.getPendingRequest();
    if (pendingRequest) {
      toolApprovalManager.denyTools(pendingRequest.requestId);
    }
  });

  it('autoApproveAll returns a handler that approves all tools', async () => {
    const toolCalls = [makeToolCall('1', 'tool-a'), makeToolCall('2', 'tool-b')];

    await expect(autoApproveAll().handleApproval(toolCalls)).resolves.toEqual(['1', '2']);
  });

  it('getInstance returns the singleton instance', () => {
    expect(ToolApprovalManager.getInstance()).toBe(toolApprovalManager);
    expect(ToolApprovalManager.getInstance()).toBe(ToolApprovalManager.getInstance());
  });

  it('requestApproval returns all IDs when session auto-approval is enabled', async () => {
    toolApprovalManager.setSessionAutoApproval(true);

    const toolCalls = [makeToolCall('1', 'tool-a'), makeToolCall('2', 'tool-b')];

    await expect(toolApprovalManager.requestApproval(toolCalls)).resolves.toEqual(['1', '2']);
  });

  it('requestApproval returns auto-approved IDs alongside handler-approved IDs', async () => {
    const initialRequest = toolApprovalManager.requestApproval([
      makeToolCall('1', 'tool-a'),
      makeToolCall('2', 'tool-b'),
    ]);
    const initialPending = toolApprovalManager.getPendingRequest();

    expect(initialPending).not.toBeNull();
    toolApprovalManager.approveTools(initialPending!.requestId, ['1'], true);
    await expect(initialRequest).resolves.toEqual(['1']);

    const handler = {
      handleApproval: vi.fn(async (toolCalls: ToolCall[]) => toolCalls.map(tool => tool.id)),
    };
    toolApprovalManager.setApprovalHandler(handler);

    const toolCalls = [makeToolCall('3', 'tool-a'), makeToolCall('4', 'tool-b')];

    await expect(toolApprovalManager.requestApproval(toolCalls)).resolves.toEqual(['3', '4']);
    expect(handler.handleApproval).toHaveBeenCalledWith([toolCalls[1]]);
  });

  it('requestApproval delegates to a custom handler', async () => {
    const toolCalls = [makeToolCall('1', 'tool-a'), makeToolCall('2', 'tool-b')];
    const handler = {
      handleApproval: vi.fn(async (pendingToolCalls: ToolCall[]) => [pendingToolCalls[1].id]),
    };
    toolApprovalManager.setApprovalHandler(handler);

    await expect(toolApprovalManager.requestApproval(toolCalls)).resolves.toEqual(['2']);
    expect(handler.handleApproval).toHaveBeenCalledWith(toolCalls);
  });

  it('approveTools resolves the pending request', async () => {
    const approvalPromise = toolApprovalManager.requestApproval([
      makeToolCall('1', 'tool-a'),
      makeToolCall('2', 'tool-b'),
    ]);
    const pendingRequest = toolApprovalManager.getPendingRequest();

    expect(pendingRequest).not.toBeNull();

    toolApprovalManager.approveTools(pendingRequest!.requestId, ['2']);

    await expect(approvalPromise).resolves.toEqual(['2']);
    expect(toolApprovalManager.getPendingRequest()).toBeNull();
  });

  it('approveTools with rememberChoice enables session auto-approval when all tools are approved', async () => {
    const approvalPromise = toolApprovalManager.requestApproval([
      makeToolCall('1', 'tool-a'),
      makeToolCall('2', 'tool-b'),
    ]);
    const pendingRequest = toolApprovalManager.getPendingRequest();

    toolApprovalManager.approveTools(pendingRequest!.requestId, ['1', '2'], true);

    await expect(approvalPromise).resolves.toEqual(['1', '2']);
    expect(toolApprovalManager.isSessionAutoApprovalEnabled()).toBe(true);
    await expect(
      toolApprovalManager.requestApproval([makeToolCall('3', 'tool-c')])
    ).resolves.toEqual(['3']);
  });

  it('approveTools with rememberChoice does not enable session auto-approval when approvedToolIds has duplicates but not all tools', async () => {
    // Regression: length comparison ('2 === 2') would fire even though only
    // tool-a was approved (duplicated). Set-membership check must require every
    // pending tool ID to be present.
    const approvalPromise = toolApprovalManager.requestApproval([
      makeToolCall('1', 'tool-a'),
      makeToolCall('2', 'tool-b'),
    ]);
    const pendingRequest = toolApprovalManager.getPendingRequest();

    // Pass tool-a twice — same length as allToolIds but tool-b not approved
    toolApprovalManager.approveTools(pendingRequest!.requestId, ['1', '1'], true);

    await approvalPromise;
    expect(toolApprovalManager.isSessionAutoApprovalEnabled()).toBe(false);
  });

  it('denyTools rejects the pending request', async () => {
    const approvalPromise = toolApprovalManager.requestApproval([makeToolCall('1', 'tool-a')]);
    const pendingRequest = toolApprovalManager.getPendingRequest();

    toolApprovalManager.denyTools(pendingRequest!.requestId);

    await expect(approvalPromise).rejects.toThrow('User denied tool execution');
    expect(toolApprovalManager.getPendingRequest()).toBeNull();
  });

  it('clearSession resets auto-approve settings', async () => {
    const approvalPromise = toolApprovalManager.requestApproval([
      makeToolCall('1', 'tool-a'),
      makeToolCall('2', 'tool-b'),
    ]);
    const pendingRequest = toolApprovalManager.getPendingRequest();

    toolApprovalManager.approveTools(pendingRequest!.requestId, ['1'], true);
    await approvalPromise;
    toolApprovalManager.setSessionAutoApproval(true);

    toolApprovalManager.clearSession();

    expect(toolApprovalManager.isSessionAutoApprovalEnabled()).toBe(false);
    expect(toolApprovalManager.getAutoApprovalSettings()).toEqual({
      sessionAutoApproval: false,
      toolSettings: [],
    });
  });

  it('setSessionAutoApproval and isSessionAutoApprovalEnabled update session approval state', () => {
    expect(toolApprovalManager.isSessionAutoApprovalEnabled()).toBe(false);

    toolApprovalManager.setSessionAutoApproval(true);
    expect(toolApprovalManager.isSessionAutoApprovalEnabled()).toBe(true);

    toolApprovalManager.setSessionAutoApproval(false);
    expect(toolApprovalManager.isSessionAutoApprovalEnabled()).toBe(false);
  });

  it('getAutoApprovalSettings returns the current settings', async () => {
    const approvalPromise = toolApprovalManager.requestApproval([
      makeToolCall('1', 'tool-a'),
      makeToolCall('2', 'tool-b'),
    ]);
    const pendingRequest = toolApprovalManager.getPendingRequest();

    toolApprovalManager.approveTools(pendingRequest!.requestId, ['1'], true);
    await approvalPromise;

    expect(toolApprovalManager.getAutoApprovalSettings()).toEqual({
      sessionAutoApproval: false,
      toolSettings: [{ toolName: 'tool-a', autoApprove: true }],
    });
  });
});
