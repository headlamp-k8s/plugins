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

import { act, renderHook } from '@testing-library/react';
import { EventEmitter } from 'events';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { DiagnosisResult } from './ProactiveDiagnosisManager';

function makeDiagnosis(eventUid: string): DiagnosisResult {
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
  diagnoses?: DiagnosisResult[];
  running?: boolean;
  scrollToEventUid?: string | null;
}) {
  vi.resetModules();

  const manager = Object.assign(new EventEmitter(), {
    getAllDiagnoses: vi.fn<() => DiagnosisResult[]>(() => options?.diagnoses ?? []),
    isRunning: vi.fn<() => boolean>(() => options?.running ?? false),
    getScrollToEventUid: vi.fn<() => string | null>(() => options?.scrollToEventUid ?? null),
    clearScrollToEventUid: vi.fn(),
  });

  vi.doMock('./ProactiveDiagnosisManager', async () => {
    const actual = await vi.importActual<typeof import('./ProactiveDiagnosisManager')>(
      './ProactiveDiagnosisManager'
    );
    return { ...actual, proactiveDiagnosisManager: manager };
  });

  const module = await import('./useProactiveDiagnosis');
  return { useProactiveDiagnosis: module.useProactiveDiagnosis, manager };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.resetModules();
});

describe('useProactiveDiagnosis', () => {
  it('reads initial manager state and clears scroll targets', async () => {
    const diagnoses = [makeDiagnosis('uid-1')];
    const { useProactiveDiagnosis, manager } = await loadUseProactiveDiagnosis({
      diagnoses,
      running: true,
      scrollToEventUid: 'uid-1',
    });

    const { result } = renderHook(() => useProactiveDiagnosis());

    expect(result.current.diagnoses).toEqual(diagnoses);
    expect(result.current.isCycleRunning).toBe(true);
    expect(result.current.scrollToEventUid).toBe('uid-1');

    act(() => result.current.clearScrollTarget());
    expect(result.current.scrollToEventUid).toBeNull();
    expect(manager.clearScrollToEventUid).toHaveBeenCalledTimes(1);
  });

  it('subscribes to manager events, updates state, and removes listeners on cleanup', async () => {
    const initialDiagnoses = [makeDiagnosis('uid-1')];
    const updatedDiagnoses = [makeDiagnosis('uid-2')];
    const { useProactiveDiagnosis, manager } = await loadUseProactiveDiagnosis({
      diagnoses: initialDiagnoses,
    });

    const { result, unmount } = renderHook(() => useProactiveDiagnosis());
    expect(manager.listenerCount('diagnosis-update')).toBe(1);
    expect(manager.listenerCount('cycle-start')).toBe(1);
    expect(manager.listenerCount('cycle-end')).toBe(1);
    expect(manager.listenerCount('cache-cleared')).toBe(1);
    expect(manager.listenerCount('scroll-to-event')).toBe(1);

    manager.getAllDiagnoses.mockReturnValue(updatedDiagnoses);
    act(() => {
      manager.emit('diagnosis-update');
      manager.emit('cycle-start');
    });
    expect(result.current.diagnoses).toEqual(updatedDiagnoses);
    expect(result.current.isCycleRunning).toBe(true);

    act(() => {
      manager.emit('cycle-end');
      manager.emit('cache-cleared');
      manager.emit('scroll-to-event', 'uid-2');
    });
    expect(result.current.isCycleRunning).toBe(false);
    expect(result.current.diagnoses).toEqual(updatedDiagnoses);
    expect(result.current.scrollToEventUid).toBe('uid-2');

    unmount();
    expect(manager.listenerCount('diagnosis-update')).toBe(0);
    expect(manager.listenerCount('cycle-start')).toBe(0);
    expect(manager.listenerCount('cycle-end')).toBe(0);
    expect(manager.listenerCount('cache-cleared')).toBe(0);
    expect(manager.listenerCount('scroll-to-event')).toBe(0);
  });

  it('resynchronizes snapshots after subscribing to close the mount gap', async () => {
    const initialDiagnoses = [makeDiagnosis('initial')];
    const currentDiagnoses = [makeDiagnosis('current')];
    const { useProactiveDiagnosis, manager } = await loadUseProactiveDiagnosis();
    manager.getAllDiagnoses.mockReturnValueOnce(initialDiagnoses).mockImplementation(() => {
      expect(manager.listenerCount('diagnosis-update')).toBe(1);
      return currentDiagnoses;
    });
    manager.isRunning.mockReturnValueOnce(false).mockImplementation(() => {
      expect(manager.listenerCount('cycle-start')).toBe(1);
      expect(manager.listenerCount('cycle-end')).toBe(1);
      return true;
    });
    manager.getScrollToEventUid.mockReturnValueOnce(null).mockImplementation(() => {
      expect(manager.listenerCount('scroll-to-event')).toBe(1);
      return 'current';
    });

    const { result } = renderHook(() => useProactiveDiagnosis());

    expect(result.current.diagnoses).toEqual(currentDiagnoses);
    expect(result.current.isCycleRunning).toBe(true);
    expect(result.current.scrollToEventUid).toBe('current');
  });
});
