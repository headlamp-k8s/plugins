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
import type { ConversationMessage as Prompt } from '../../conversation/types';
import type { UserContext } from '../../mcp/tools/types';
import type { ToolCall } from '../types';
import {
  type ApprovalManagerContext,
  InlineToolApprovalManager,
  inlineToolApprovalManager,
  type ToolConfirmationEvent,
} from './InlineToolApprovalManager';

/** Private approval surface exercised by context extraction tests. */
interface ApprovalManagerTestHarness {
  extractUserContext(manager: ApprovalManagerContext): UserContext;
}

const privateApprovalManager = inlineToolApprovalManager as unknown as ApprovalManagerTestHarness;

function makeToolCall(id: string, name: string): ToolCall {
  return {
    id,
    name,
    arguments: {},
    type: 'regular',
  };
}

function makeAiManager(overrides: Partial<ApprovalManagerContext> = {}): ApprovalManagerContext {
  return {
    history: [] as Prompt[],
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

  it('does not remember session approval when duplicate or extra IDs omit a pending tool', async () => {
    const approvalPromise = inlineToolApprovalManager.requestApproval(
      [makeToolCall('1', 'tool-a'), makeToolCall('2', 'tool-b')],
      makeAiManager()
    );
    const pendingRequest = inlineToolApprovalManager.getPendingRequest();

    inlineToolApprovalManager.approveTools(
      pendingRequest!.requestId,
      ['1', '1', 'unrelated-id'],
      true
    );

    await expect(approvalPromise).resolves.toEqual(['1', '1', 'unrelated-id']);
    expect(inlineToolApprovalManager.isSessionAutoApprovalEnabled()).toBe(false);
    expect(inlineToolApprovalManager.isToolAutoApprovalEnabled('tool-a')).toBe(true);
    expect(inlineToolApprovalManager.isToolAutoApprovalEnabled('tool-b')).toBe(false);
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

// ── extractUserContext (private) ──────────────────────────────────────────────

describe('InlineToolApprovalManager — extractUserContext (private)', () => {
  beforeEach(() => {
    inlineToolApprovalManager.clearSession();
    inlineToolApprovalManager.setApprovalHandler(null);
    inlineToolApprovalManager.setAutoApprovedServers([]);
  });

  const extract = (manager: ApprovalManagerContext) =>
    privateApprovalManager.extractUserContext(manager);

  it('returns timeContext as a Date', () => {
    const ctx = extract(makeAiManager());
    expect(ctx.timeContext).toBeInstanceOf(Date);
  });

  it('sets userMessage from the last user message in history', () => {
    const mgr = makeAiManager({
      history: [
        { role: 'user', content: 'first question' },
        { role: 'assistant', content: 'first answer' },
        { role: 'user', content: 'second question' },
      ],
    });
    const ctx = extract(mgr);
    expect(ctx.userMessage).toBe('second question');
  });

  it('builds conversationHistory from the last 5 messages', () => {
    const history = Array.from({ length: 8 }, (_, i) => ({
      role: i % 2 === 0 ? 'user' : 'assistant',
      content: `msg ${i}`,
    }));
    const ctx = extract(makeAiManager({ history }));
    expect(ctx.conversationHistory).toHaveLength(5);
    expect(ctx.conversationHistory?.[0].content).toBe('msg 3');
  });

  it('extracts kubernetes context through the manager accessor', () => {
    const mgr = makeAiManager({
      getKubernetesContext: () => ({
        selectedClusters: ['prod'],
        namespace: 'default',
        currentResource: { kind: 'Pod', metadata: { name: 'my-pod' } },
      }),
    });
    const ctx = extract(mgr);
    expect(ctx.kubernetesContext?.selectedClusters).toEqual(['prod']);
    expect(ctx.kubernetesContext?.namespace).toBe('default');
    expect(ctx.kubernetesContext?.currentResource).toEqual({
      kind: 'Pod',
      metadata: { name: 'my-pod' },
    });
  });

  it('does not set kubernetesContext when the manager has none', () => {
    const ctx = extract(makeAiManager());
    expect(ctx.kubernetesContext).toBeUndefined();
  });

  it('extracts last tool results from history (up to 3)', () => {
    const mgr = makeAiManager({
      history: [
        { role: 'tool', content: '{"pods":[]}' },
        { role: 'tool', content: '{"nodes":[]}' },
        { role: 'tool', content: '{"services":[]}' },
        { role: 'tool', content: '{"events":[]}' }, // 4th — should be dropped (keep last 3)
      ],
    });
    const ctx = extract(mgr);
    // slice(-3) keeps the last 3
    expect(Object.keys(ctx.lastToolResults ?? {})).toHaveLength(3);
    expect(ctx.lastToolResults?.tool_0).toEqual({ nodes: [] });
  });

  it('uses raw string for tool result when JSON.parse fails', () => {
    const mgr = makeAiManager({
      history: [{ role: 'tool', content: 'not valid json {{{' }],
    });
    const ctx = extract(mgr);
    expect(ctx.lastToolResults?.tool_0).toBe('not valid json {{{');
  });

  it('does not set lastToolResults when history has no tool messages', () => {
    const ctx = extract(makeAiManager({ history: [{ role: 'user', content: 'hi' }] }));
    expect(ctx.lastToolResults).toBeUndefined();
  });

  it('returns partial context when aiManager throws during extraction', () => {
    const badMgr = {
      get history() {
        throw new Error('history unavailable');
      },
    };
    // Should not throw — returns timeContext only
    const ctx = extract(badMgr as unknown as ApprovalManagerContext);
    expect(ctx.timeContext).toBeInstanceOf(Date);
  });
});

// ── event-based requestApproval flow ─────────────────────────────────────────

describe('InlineToolApprovalManager — event-based approval flow', () => {
  beforeEach(() => {
    inlineToolApprovalManager.clearSession();
    inlineToolApprovalManager.setApprovalHandler(null);
    inlineToolApprovalManager.setAutoApprovedServers([]);
    const pending = inlineToolApprovalManager.getPendingRequest();
    if (pending) inlineToolApprovalManager.denyTools(pending.requestId);
  });

  it('emits request-confirmation with tools and callbacks', async () => {
    const events: ToolConfirmationEvent[] = [];
    inlineToolApprovalManager.on('request-confirmation', event =>
      events.push(event as ToolConfirmationEvent)
    );

    const approvalPromise = inlineToolApprovalManager.requestApproval(
      [makeToolCall('t1', 'my_tool')],
      makeAiManager()
    );
    const pending = inlineToolApprovalManager.getPendingRequest();

    expect(events).toHaveLength(1);
    expect(events[0].toolConfirmation.tools).toHaveLength(1);
    expect(typeof events[0].toolConfirmation.onApprove).toBe('function');
    expect(typeof events[0].toolConfirmation.onDeny).toBe('function');
    expect(events[0].toolConfirmation.loading).toBe(false);

    // Clean up
    inlineToolApprovalManager.denyTools(pending!.requestId);
    await approvalPromise.catch(() => {});
  });

  it('emits update-confirmation when updateMessage is called', async () => {
    const updates: ToolConfirmationEvent[] = [];
    inlineToolApprovalManager.on('update-confirmation', event =>
      updates.push(event as ToolConfirmationEvent)
    );

    const approvalPromise = inlineToolApprovalManager.requestApproval(
      [makeToolCall('t1', 'my_tool')],
      makeAiManager()
    );
    const pending = inlineToolApprovalManager.getPendingRequest();

    // Call updateMessage directly
    pending!.updateMessage!(true);

    expect(updates).toHaveLength(1);
    expect(updates[0].toolConfirmation.loading).toBe(true);

    inlineToolApprovalManager.denyTools(pending!.requestId);
    await approvalPromise.catch(() => {});
  });

  it('resolves with combined auto-approved + manually approved IDs', async () => {
    // 'tool-a' is pre-approved individually; 'tool-b' needs manual approval
    inlineToolApprovalManager.setToolAutoApproval('tool-a', true);

    const approvalPromise = inlineToolApprovalManager.requestApproval(
      [makeToolCall('id-a', 'tool-a'), makeToolCall('id-b', 'tool-b')],
      makeAiManager()
    );
    const pending = inlineToolApprovalManager.getPendingRequest();

    // Manually approve only tool-b
    inlineToolApprovalManager.approveTools(pending!.requestId, ['id-b']);

    const approved = await approvalPromise;
    expect(approved).toContain('id-a'); // auto-approved
    expect(approved).toContain('id-b'); // manually approved
  });

  it('supersedes an earlier pending request when a new one arrives', async () => {
    const firstPromise = inlineToolApprovalManager.requestApproval(
      [makeToolCall('t1', 'tool-a')],
      makeAiManager()
    );

    // Start a second request before the first is resolved
    const _secondPromise = inlineToolApprovalManager.requestApproval(
      [makeToolCall('t2', 'tool-b')],
      makeAiManager()
    );

    // First promise should be rejected (superseded)
    await expect(firstPromise).rejects.toThrow();

    // Second request is now pending
    const pending = inlineToolApprovalManager.getPendingRequest();
    expect(pending?.toolCalls[0].name).toBe('tool-b');
    inlineToolApprovalManager.denyTools(pending!.requestId);
    await _secondPromise.catch(() => {});
  });

  it('includes requestId in the emitted confirmation event', async () => {
    const events: ToolConfirmationEvent[] = [];
    inlineToolApprovalManager.on('request-confirmation', event =>
      events.push(event as ToolConfirmationEvent)
    );

    const approvalPromise = inlineToolApprovalManager.requestApproval(
      [makeToolCall('t1', 'my_tool')],
      makeAiManager()
    );
    const pending = inlineToolApprovalManager.getPendingRequest();

    expect(events[0].toolConfirmation.requestId).toBe(pending?.requestId);

    inlineToolApprovalManager.denyTools(pending!.requestId);
    await approvalPromise.catch(() => {});
  });

  it('emits update-confirmation with loading:true during handleApprove', async () => {
    const updates: ToolConfirmationEvent[] = [];
    inlineToolApprovalManager.on('update-confirmation', event =>
      updates.push(event as ToolConfirmationEvent)
    );

    const approvalPromise = inlineToolApprovalManager.requestApproval(
      [makeToolCall('t1', 'my_tool')],
      makeAiManager()
    );
    const pending = inlineToolApprovalManager.getPendingRequest();

    // approveTools triggers handleApprove which calls updateMessage(true)
    inlineToolApprovalManager.approveTools(pending!.requestId, ['t1']);

    await approvalPromise;
    expect(updates.some(u => u.toolConfirmation.loading === true)).toBe(true);
  });

  it('resolves empty array when approveTools is called with no IDs', async () => {
    const approvalPromise = inlineToolApprovalManager.requestApproval(
      [makeToolCall('t1', 'my_tool')],
      makeAiManager()
    );
    const pending = inlineToolApprovalManager.getPendingRequest();
    inlineToolApprovalManager.approveTools(pending!.requestId, []);
    const approved = await approvalPromise;
    expect(approved).toEqual([]);
  });

  it('userContext is passed in the confirmation event', async () => {
    const events: ToolConfirmationEvent[] = [];
    inlineToolApprovalManager.on('request-confirmation', event =>
      events.push(event as ToolConfirmationEvent)
    );

    const mgr = makeAiManager({
      history: [{ role: 'user', content: 'list pods please' }],
    });
    const approvalPromise = inlineToolApprovalManager.requestApproval(
      [makeToolCall('t1', 'k8s_tool')],
      mgr
    );
    const pending = inlineToolApprovalManager.getPendingRequest();

    const uc = events[0].toolConfirmation.userContext;
    expect(uc?.userMessage).toBe('list pods please');

    inlineToolApprovalManager.denyTools(pending!.requestId);
    await approvalPromise.catch(() => {});
  });
});

// ── loadAndApplyAutoApproveSettings ──────────────────────────────────────────

describe('InlineToolApprovalManager — loadAndApplyAutoApproveSettings', () => {
  beforeEach(() => {
    inlineToolApprovalManager.setAutoApprovedServers([]);
    vi.restoreAllMocks();
  });

  it('sets auto-approved servers from desktop MCP config', async () => {
    Reflect.set(globalThis, 'window', {
      desktopApi: {
        mcp: {
          getConfig: async () => ({
            success: true,
            config: {
              servers: [
                { name: 'github', enabled: true, autoApprove: true },
                { name: 'filesystem', enabled: true, autoApprove: false },
                { name: 'disabled', enabled: false, autoApprove: true },
              ],
            },
          }),
        },
      },
    });

    await inlineToolApprovalManager.loadAndApplyAutoApproveSettings();

    expect(inlineToolApprovalManager.isToolAutoApproved('github__search')).toBe(true);
    expect(inlineToolApprovalManager.isToolAutoApproved('filesystem__read')).toBe(false);
    expect(inlineToolApprovalManager.isToolAutoApproved('disabled__op')).toBe(false);

    Reflect.deleteProperty(globalThis, 'window');
  });

  it('clears auto-approved servers when getConfig throws', async () => {
    inlineToolApprovalManager.setAutoApprovedServers(['github']);
    Reflect.set(globalThis, 'window', {
      desktopApi: {
        mcp: {
          getConfig: async () => {
            throw new Error('IPC error');
          },
        },
      },
    });

    await inlineToolApprovalManager.loadAndApplyAutoApproveSettings();

    expect(inlineToolApprovalManager.isToolAutoApproved('github__search')).toBe(false);

    Reflect.deleteProperty(globalThis, 'window');
  });

  it('is a no-op when window is undefined', async () => {
    const originalWindow = Reflect.get(globalThis, 'window') as unknown;
    Reflect.deleteProperty(globalThis, 'window');

    inlineToolApprovalManager.setAutoApprovedServers(['existing']);
    await inlineToolApprovalManager.loadAndApplyAutoApproveSettings();

    // No change — window not available
    expect(inlineToolApprovalManager.isToolAutoApproved('existing__tool')).toBe(true);

    Reflect.set(globalThis, 'window', originalWindow);
  });

  it('is a no-op when desktopApi is undefined', async () => {
    Reflect.set(globalThis, 'window', {});
    inlineToolApprovalManager.setAutoApprovedServers(['existing']);

    await inlineToolApprovalManager.loadAndApplyAutoApproveSettings();

    expect(inlineToolApprovalManager.isToolAutoApproved('existing__tool')).toBe(true);

    Reflect.deleteProperty(globalThis, 'window');
  });
});
