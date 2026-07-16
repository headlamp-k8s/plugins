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

import type { ToolApprovalRequest } from '@headlamp-k8s/ai-common/tools/approval/ToolApprovalManager';
import { EventEmitter } from 'events';
import { afterEach, describe, expect, it, vi } from 'vitest';

function makePendingRequest(requestId = 'req-1'): ToolApprovalRequest {
  return {
    requestId,
    toolCalls: [
      {
        id: 'tool-1',
        name: 'kubectl-get',
        arguments: {},
        type: 'regular' as const,
      },
    ],
    resolve: vi.fn(),
    reject: vi.fn(),
  };
}

async function loadUseToolApproval(initialStateValues: unknown[] = [false, null, false]) {
  vi.resetModules();

  const setters = [vi.fn(), vi.fn(), vi.fn()];
  let stateIndex = 0;
  let cleanup: (() => void) | undefined;
  const manager = Object.assign(new EventEmitter(), {
    approveTools: vi.fn(),
    denyTools: vi.fn(),
  });

  vi.doMock('react', () => ({
    useState: vi.fn((initialValue: unknown) => [
      initialStateValues[stateIndex] ?? initialValue,
      setters[stateIndex++],
    ]),
    useEffect: vi.fn((effect: () => void | (() => void)) => {
      cleanup = effect() ?? undefined;
    }),
    useCallback: vi.fn(<Callback>(callback: Callback) => callback),
    useRef: vi.fn((initialValue: unknown) => ({ current: initialValue })),
  }));

  vi.doMock('@headlamp-k8s/ai-common/tools/approval/ToolApprovalManager', () => ({
    toolApprovalManager: manager,
  }));

  const module = await import('./useToolApproval');

  return {
    useToolApproval: module.useToolApproval,
    manager,
    setters,
    getCleanup: () => cleanup,
  };
}

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('useToolApproval', () => {
  it('subscribes to approval requests, updates state, and unsubscribes on cleanup', async () => {
    const { useToolApproval, manager, setters, getCleanup } = await loadUseToolApproval();
    const request = makePendingRequest();

    useToolApproval();
    expect(manager.listenerCount('approval-requested')).toBe(1);

    manager.emit('approval-requested', request);

    expect(setters[1]).toHaveBeenCalledWith(request);
    expect(setters[0]).toHaveBeenCalledWith(true);
    expect(setters[2]).toHaveBeenCalledWith(false);

    getCleanup()?.();

    expect(manager.listenerCount('approval-requested')).toBe(0);
  });

  it('ignores malformed approval events', async () => {
    const { useToolApproval, manager, setters } = await loadUseToolApproval();

    useToolApproval();
    manager.emit('approval-requested', { requestId: 'missing-fields' });

    expect(setters[0]).not.toHaveBeenCalled();
    expect(setters[1]).not.toHaveBeenCalled();
    expect(setters[2]).not.toHaveBeenCalled();
  });

  it('approves a pending request and resets state after the processing delay', async () => {
    vi.useFakeTimers();
    const pendingRequest = makePendingRequest();
    const { useToolApproval, manager, setters } = await loadUseToolApproval([
      false,
      pendingRequest,
      false,
    ]);

    const result = useToolApproval();
    result.handleApprove(['tool-1'], true);

    expect(setters[2]).toHaveBeenCalledWith(true);
    expect(manager.approveTools).toHaveBeenCalledWith('req-1', ['tool-1'], true);

    vi.advanceTimersByTime(500);

    expect(setters[0]).toHaveBeenCalledWith(false);
    expect(setters[1]).toHaveBeenCalledWith(null);
    expect(setters[2]).toHaveBeenLastCalledWith(false);
  });

  it('does not remember an approval by default', async () => {
    const pendingRequest = makePendingRequest();
    const { useToolApproval, manager } = await loadUseToolApproval([true, pendingRequest, false]);

    useToolApproval().handleApprove(['tool-1']);

    expect(manager.approveTools).toHaveBeenCalledWith('req-1', ['tool-1'], false);
  });

  it('does not let an approval close timer clear a newer request', async () => {
    vi.useFakeTimers();
    const pendingRequest = makePendingRequest();
    const nextRequest = makePendingRequest('req-2');
    const { useToolApproval, manager, setters } = await loadUseToolApproval([
      true,
      pendingRequest,
      false,
    ]);

    useToolApproval().handleApprove(['tool-1']);
    manager.emit('approval-requested', nextRequest);
    vi.advanceTimersByTime(500);

    expect(setters[1]).toHaveBeenCalledWith(nextRequest);
    expect(setters[1]).not.toHaveBeenCalledWith(null);
    expect(setters[0]).not.toHaveBeenCalledWith(false);
  });

  it('cancels a pending approval close when the hook unmounts', async () => {
    vi.useFakeTimers();
    const pendingRequest = makePendingRequest();
    const { useToolApproval, setters, getCleanup } = await loadUseToolApproval([
      true,
      pendingRequest,
      false,
    ]);

    useToolApproval().handleApprove(['tool-1']);
    getCleanup()?.();
    vi.advanceTimersByTime(500);

    expect(setters[0]).not.toHaveBeenCalledWith(false);
    expect(setters[1]).not.toHaveBeenCalledWith(null);
  });

  it('does nothing when approving without a pending request', async () => {
    const { useToolApproval, manager, setters } = await loadUseToolApproval();

    useToolApproval().handleApprove(['tool-1'], true);

    expect(manager.approveTools).not.toHaveBeenCalled();
    expect(setters[0]).not.toHaveBeenCalled();
    expect(setters[1]).not.toHaveBeenCalled();
    expect(setters[2]).not.toHaveBeenCalled();
  });

  it('denies a pending request and clears dialog state', async () => {
    const pendingRequest = makePendingRequest();
    const { useToolApproval, manager, setters } = await loadUseToolApproval([
      true,
      pendingRequest,
      true,
    ]);

    useToolApproval().handleDeny();

    expect(manager.denyTools).toHaveBeenCalledWith('req-1');
    expect(setters[0]).toHaveBeenCalledWith(false);
    expect(setters[1]).toHaveBeenCalledWith(null);
    expect(setters[2]).toHaveBeenCalledWith(false);
  });

  it('cancels a pending approval close when denying the request', async () => {
    vi.useFakeTimers();
    const pendingRequest = makePendingRequest();
    const { useToolApproval, setters } = await loadUseToolApproval([true, pendingRequest, false]);
    const result = useToolApproval();

    result.handleApprove(['tool-1']);
    result.handleDeny();
    setters.forEach(setter => setter.mockClear());
    vi.advanceTimersByTime(500);

    expect(setters.every(setter => setter.mock.calls.length === 0)).toBe(true);
  });

  it('treats closing the dialog as a denial', async () => {
    const pendingRequest = makePendingRequest();
    const { useToolApproval, manager } = await loadUseToolApproval([true, pendingRequest, false]);

    useToolApproval().handleClose();

    expect(manager.denyTools).toHaveBeenCalledWith('req-1');
  });
});
