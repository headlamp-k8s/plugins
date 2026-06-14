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
import { afterEach, describe, expect, it, vi } from 'vitest';

function makeDiagnosis(eventUid: string) {
  return {
    eventUid,
    event: {
      uid: eventUid,
      name: `event-${eventUid}`,
      type: 'Warning',
      reason: 'BackOff',
      message: 'Back-off restarting container',
      objectKind: 'Pod',
      objectName: 'demo-pod',
      objectNamespace: 'default',
      lastTimestamp: '2025-01-01T00:00:00Z',
      rawEvent: {},
    },
    diagnosis: `Diagnosis for ${eventUid}`,
    diagnosedAt: 1,
    loading: false,
  };
}

async function loadUseProactiveDiagnosis(options?: {
  initialStateValues?: unknown[];
  diagnoses?: unknown[];
  scrollToEventUid?: string | null;
}) {
  vi.resetModules();

  const setters = [vi.fn(), vi.fn(), vi.fn()];
  let stateIndex = 0;
  let cleanup: (() => void) | undefined;
  const diagnoses = options?.diagnoses ?? [];
  const manager = Object.assign(new EventEmitter(), {
    getAllDiagnoses: vi.fn(() => diagnoses),
    getScrollToEventUid: vi.fn(() => options?.scrollToEventUid ?? null),
    clearScrollToEventUid: vi.fn(),
  });

  vi.doMock('react', () => ({
    useState: vi.fn((initialValue: unknown) => [
      options?.initialStateValues?.[stateIndex] ?? initialValue,
      setters[stateIndex++],
    ]),
    useEffect: vi.fn((effect: () => void | (() => void)) => {
      cleanup = effect() ?? undefined;
    }),
    useCallback: vi.fn((callback: (...args: any[]) => any) => callback),
  }));

  vi.doMock('./ProactiveDiagnosisManager', () => ({
    proactiveDiagnosisManager: manager,
  }));

  const module = await import('./useProactiveDiagnosis');

  return {
    useProactiveDiagnosis: module.useProactiveDiagnosis,
    manager,
    setters,
    getCleanup: () => cleanup,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('useProactiveDiagnosis', () => {
  it('reads initial state from the manager and clears scroll targets', async () => {
    const diagnoses = [makeDiagnosis('uid-1')];
    const { useProactiveDiagnosis, manager, setters } = await loadUseProactiveDiagnosis({
      diagnoses,
      scrollToEventUid: 'uid-1',
    });

    const result = useProactiveDiagnosis();

    expect(result.diagnoses).toEqual(diagnoses);
    expect(result.isCycleRunning).toBe(false);
    expect(result.scrollToEventUid).toBe('uid-1');

    result.clearScrollTarget();

    expect(setters[2]).toHaveBeenCalledWith(null);
    expect(manager.clearScrollToEventUid).toHaveBeenCalledTimes(1);
  });

  it('subscribes to manager events, updates state, and removes listeners on cleanup', async () => {
    const initialDiagnoses = [makeDiagnosis('uid-1')];
    const updatedDiagnoses = [makeDiagnosis('uid-2')];
    const { useProactiveDiagnosis, manager, setters, getCleanup } = await loadUseProactiveDiagnosis(
      {
        diagnoses: initialDiagnoses,
      }
    );

    useProactiveDiagnosis();
    expect(manager.listenerCount('diagnosis-update')).toBe(1);
    expect(manager.listenerCount('cycle-start')).toBe(1);
    expect(manager.listenerCount('cycle-end')).toBe(1);
    expect(manager.listenerCount('cache-cleared')).toBe(1);
    expect(manager.listenerCount('scroll-to-event')).toBe(1);

    manager.getAllDiagnoses.mockReturnValue(updatedDiagnoses);

    manager.emit('diagnosis-update');
    manager.emit('cycle-start');
    manager.emit('cycle-end');
    manager.emit('cache-cleared');
    manager.emit('scroll-to-event', 'uid-2');

    expect(setters[0]).toHaveBeenNthCalledWith(1, updatedDiagnoses);
    expect(setters[1]).toHaveBeenNthCalledWith(1, true);
    expect(setters[1]).toHaveBeenNthCalledWith(2, false);
    expect(setters[0]).toHaveBeenNthCalledWith(2, updatedDiagnoses);
    expect(setters[0]).toHaveBeenNthCalledWith(3, updatedDiagnoses);
    expect(setters[2]).toHaveBeenCalledWith('uid-2');

    getCleanup()?.();

    expect(manager.listenerCount('diagnosis-update')).toBe(0);
    expect(manager.listenerCount('cycle-start')).toBe(0);
    expect(manager.listenerCount('cycle-end')).toBe(0);
    expect(manager.listenerCount('cache-cleared')).toBe(0);
    expect(manager.listenerCount('scroll-to-event')).toBe(0);
  });
});
