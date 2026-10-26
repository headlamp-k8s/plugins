import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@headlamp-k8s/ai-common/prompts/baseAssistantPrompt', () => ({
  basePrompt: 'base prompt',
}));

import {
  type EventDigest,
  ProactiveDiagnosisManager,
  SINGLE_EVENT_QUEUE_TIMEOUT_MS,
} from './ProactiveDiagnosisManager';

const createEvent = (overrides: Partial<EventDigest> = {}): EventDigest => ({
  uid: 'uid-1',
  name: 'evt-1',
  type: 'Warning',
  reason: 'BackOff',
  message: 'Back-off restarting',
  objectKind: 'Pod',
  objectName: 'myapp-abc123',
  objectNamespace: 'default',
  lastTimestamp: '2025-01-01T00:00:00Z',
  rawEvent: {
    metadata: { uid: 'uid-1', name: 'evt-1', namespace: 'default' },
  },
  ...overrides,
});

function deferred<T>() {
  let resolve: (value: T) => void = () => undefined;
  let reject: (error: unknown) => void = () => undefined;
  const promise = new Promise<T>((resolvePromise, rejectPromise) => {
    resolve = resolvePromise;
    reject = rejectPromise;
  });
  return { promise, resolve, reject };
}

describe('ProactiveDiagnosisManager', () => {
  let manager: ProactiveDiagnosisManager;

  beforeEach(() => {
    manager = new ProactiveDiagnosisManager();
    manager.start();
  });

  it('start and stop emit status-change events', () => {
    manager.stop();
    const statuses: Array<{ enabled: boolean }> = [];
    manager.on('status-change', status => statuses.push(status));

    manager.start();
    manager.start();
    manager.stop();

    expect(statuses).toEqual([{ enabled: true }, { enabled: false }]);
  });

  it('pauses after the active item and resumes queued items without overlap', async () => {
    const first = deferred<string>();
    const diagnose = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue('second result');
    manager.setDiagnoseFn(diagnose);
    const second = createEvent({ uid: 'second', objectName: 'other-workload' });
    const cycle = manager.diagnoseEvents([createEvent(), second]);
    const idle = manager.pauseAndWaitForIdle();
    expect(manager.isPaused()).toBe(true);
    expect(diagnose).toHaveBeenCalledTimes(1);
    first.resolve('first result');
    await Promise.all([cycle, idle]);
    expect(manager.isRunning()).toBe(false);
    expect(manager.getDiagnosis('second')).toMatchObject({ pending: true });
    expect(diagnose).toHaveBeenCalledTimes(1);
    await manager.resume();
    expect(manager.isPaused()).toBe(false);
    expect(diagnose).toHaveBeenCalledTimes(2);
    expect(manager.getDiagnosis('second')).toMatchObject({
      pending: false,
      diagnosis: 'second result',
    });
  });

  it('resumes the background backlog after active and queued manual analyses, without overlap', async () => {
    const first = deferred<string>();
    const manual = deferred<string>();
    const calls: string[] = [];
    let active = 0;
    let maxActive = 0;
    manager.setDiagnoseFn(async prompt => {
      const uid = /^- \*\*Event UID:\*\* (.+)$/m.exec(prompt)?.[1];
      if (!uid) throw new Error('Prompt has no event UID');
      calls.push(uid);
      active++;
      maxActive = Math.max(maxActive, active);
      try {
        if (uid === 'first') return await first.promise;
        if (uid === 'manual') return await manual.promise;
        return `result for ${uid}`;
      } finally {
        active--;
      }
    });
    const cycle = manager.diagnoseEvents([
      createEvent({ uid: 'first', objectName: 'first-workload' }),
      createEvent({ uid: 'background', objectName: 'background-workload' }),
    ]);
    manager.pause();
    first.resolve('first result');
    await cycle;
    const manualRun = manager.diagnoseSingleEvent(
      createEvent({ uid: 'manual', objectName: 'manual-workload' })
    );
    const queuedRun = manager.diagnoseSingleEvent(
      createEvent({ uid: 'queued', objectName: 'queued-workload' })
    );
    await manager.resume();
    expect(calls).toEqual(['first', 'manual']);
    manual.resolve('manual result');
    await Promise.all([manualRun, queuedRun]);
    await vi.waitFor(() =>
      expect(manager.getDiagnosis('background')).toMatchObject({
        pending: false,
        diagnosis: 'result for background',
      })
    );
    expect(calls).toEqual(['first', 'manual', 'queued', 'background']);
    expect(maxActive).toBe(1);
  });

  it.each(['pause', 'stop', 'clear'] as const)(
    'does not resume background work after %s while a manual analysis finishes',
    async action => {
      const first = deferred<string>();
      const manual = deferred<string>();
      const diagnose = vi
        .fn()
        .mockReturnValueOnce(first.promise)
        .mockReturnValueOnce(manual.promise)
        .mockResolvedValue('unexpected background work');
      manager.setDiagnoseFn(diagnose);
      const cycle = manager.diagnoseEvents([
        createEvent(),
        createEvent({ uid: 'background', objectName: 'other-workload' }),
      ]);
      manager.pause();
      first.resolve('first result');
      await cycle;
      const manualRun = manager.diagnoseSingleEvent(
        createEvent({ uid: 'manual', objectName: 'manual-workload' })
      );
      await manager.resume();
      if (action === 'pause') manager.pause();
      else if (action === 'stop') manager.stop();
      else manager.clearCache();
      manual.resolve('manual result');
      await manualRun;
      expect(diagnose).toHaveBeenCalledTimes(2);
    }
  );

  it('retains a resumed backlog until the diagnosis provider becomes available', async () => {
    const first = deferred<string>();
    manager.setDiagnoseFn(() => first.promise);
    const cycle = manager.diagnoseEvents([
      createEvent(),
      createEvent({ uid: 'background', objectName: 'other-workload' }),
    ]);
    manager.pause();
    first.resolve('first result');
    await cycle;
    manager.setDiagnoseFn(null);
    await manager.resume();
    expect(manager.getDiagnosis('background')?.pending).toBe(true);
    const provider = vi.fn(async () => 'resumed result');
    manager.setDiagnoseFn(provider);
    await vi.waitFor(() =>
      expect(manager.getDiagnosis('background')?.diagnosis).toBe('resumed result')
    );
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it('defers queued retries for chat priority and restarts them only on resume', async () => {
    const first = deferred<string>();
    const diagnose = vi.fn().mockReturnValueOnce(first.promise).mockResolvedValue('retried result');
    manager.setDiagnoseFn(diagnose);
    const firstRun = manager.diagnoseSingleEvent(createEvent({ uid: 'first' }), true);
    const secondRun = manager.diagnoseSingleEvent(createEvent({ uid: 'second' }), true);
    const thirdRun = manager.diagnoseSingleEvent(createEvent({ uid: 'third' }), true);
    const idle = manager.pauseAndWaitForIdle();
    first.resolve('first result');
    await Promise.all([firstRun, idle]);
    expect(diagnose).toHaveBeenCalledTimes(1);
    expect(manager.isRunning()).toBe(false);
    expect(manager.getDiagnosis('second')?.pending).toBe(true);
    expect(manager.getDiagnosis('third')?.pending).toBe(true);
    await manager.resume();
    await Promise.all([secondRun, thirdRun]);
    expect(diagnose).toHaveBeenCalledTimes(3);
  });

  it('allows fresh explicit analyses while paused but a new pause defers already-queued requests', async () => {
    const first = deferred<string>();
    const fresh = deferred<string>();
    const diagnose = vi
      .fn()
      .mockReturnValueOnce(first.promise)
      .mockReturnValueOnce(fresh.promise)
      .mockResolvedValue('resumed result');
    manager.setDiagnoseFn(diagnose);
    const firstRun = manager.diagnoseSingleEvent(createEvent({ uid: 'first' }), true);
    const deferredRun = manager.diagnoseSingleEvent(createEvent({ uid: 'deferred' }), true);
    manager.pause();
    const freshRun = manager.diagnoseSingleEvent(createEvent({ uid: 'fresh' }), true);
    first.resolve('first result');
    await firstRun;
    await vi.waitFor(() => expect(diagnose).toHaveBeenCalledTimes(2));
    expect(manager.getDiagnosis('fresh')?.loading).toBe(true);
    expect(manager.getDiagnosis('deferred')?.pending).toBe(true);
    const newerRun = manager.diagnoseSingleEvent(createEvent({ uid: 'newer' }), true);
    const idle = manager.pauseAndWaitForIdle();
    fresh.resolve('fresh result');
    await Promise.all([freshRun, idle]);
    expect(diagnose).toHaveBeenCalledTimes(2);
    expect(manager.getDiagnosis('newer')?.pending).toBe(true);
    await manager.resume();
    await Promise.all([deferredRun, newerRun]);
    expect(diagnose).toHaveBeenCalledTimes(4);
  });

  it('removes idle listeners when a queued chat message is cancelled without aborting analysis', async () => {
    const pending = deferred<string>();
    manager.setDiagnoseFn(() => pending.promise);
    const cycle = manager.diagnoseEvents([createEvent()]);
    const controller = new AbortController();
    const waiting = manager.pauseAndWaitForIdle(controller.signal);
    const cancelled = expect(waiting).rejects.toMatchObject({ name: 'AbortError' });
    expect(manager.listenerCount('cycle-end')).toBe(1);
    controller.abort();
    await cancelled;
    expect(manager.listenerCount('cycle-end')).toBe(0);
    expect(manager.isRunning()).toBe(true);
    pending.resolve('completed');
    await cycle;
  });

  it('permits an explicit re-analysis of a cached result while background work is paused', async () => {
    const diagnose = vi
      .fn()
      .mockResolvedValueOnce('old result')
      .mockResolvedValueOnce('new result');
    manager.setDiagnoseFn(diagnose);
    const event = createEvent();
    await manager.diagnoseSingleEvent(event);
    manager.pause();
    const result = await manager.diagnoseSingleEvent(event, true);
    expect(result.diagnosis).toBe('new result');
    expect(diagnose).toHaveBeenCalledTimes(2);
  });

  it('does not restore cleared results when an old provider request finishes', async () => {
    const pending = deferred<string>();
    manager.setDiagnoseFn(() => pending.promise);
    const cycle = manager.diagnoseEvents([createEvent()]);
    manager.clearCache();
    pending.resolve('outdated');
    await cycle;
    expect(manager.getAllDiagnoses()).toEqual([]);
  });

  it('rejects queued requests when their context is cleared', async () => {
    const pending = deferred<string>();
    manager.setDiagnoseFn(() => pending.promise);
    const first = manager.diagnoseSingleEvent(createEvent());
    const second = manager.diagnoseSingleEvent(createEvent({ uid: 'second', objectName: 'other' }));
    const rejected = expect(second).rejects.toThrow('Diagnosis context was cleared');
    expect(manager.getDiagnosis('second')).toMatchObject({ pending: true });
    manager.clearCache();
    await rejected;
    pending.resolve('outdated');
    await first;
    expect(manager.getAllDiagnoses()).toEqual([]);
  });

  it('uses refreshed provider configuration for the next queued item', async () => {
    const pending = deferred<string>();
    const oldProvider = vi.fn(() => pending.promise);
    const newProvider = vi.fn(async () => 'new provider result');
    manager.setDiagnoseFn(oldProvider);
    const cycle = manager.diagnoseEvents([
      createEvent(),
      createEvent({ uid: 'second', objectName: 'other-workload' }),
    ]);
    manager.setDiagnoseFn(newProvider);
    pending.resolve('first result');
    await cycle;
    expect(oldProvider).toHaveBeenCalledTimes(1);
    expect(newProvider).toHaveBeenCalledTimes(1);
    expect(manager.getDiagnosis('second')?.diagnosis).toBe('new provider result');
  });

  it('queues new requests after the owning provider detaches', async () => {
    const oldProvider = vi.fn(async () => 'old result');
    const detach = manager.setDiagnoseFn(oldProvider);
    detach();
    const pending = manager.diagnoseSingleEvent(createEvent());
    expect(oldProvider).not.toHaveBeenCalled();
    expect(manager.getDiagnosis('uid-1')).toMatchObject({ pending: true });

    const newProvider = vi.fn(async () => 'current result');
    manager.setDiagnoseFn(newProvider);
    await expect(pending).resolves.toMatchObject({ diagnosis: 'current result' });
    expect(newProvider).toHaveBeenCalledOnce();
    detach();
    const next = await manager.diagnoseSingleEvent(
      createEvent({ uid: 'next', objectName: 'next-workload' })
    );
    expect(next.diagnosis).toBe('current result');
  });

  it.each([false, true])(
    'does not detach a newer registration even if it reuses the callback (%s)',
    reuseCallback => {
      const oldProvider = vi.fn(async () => 'old result');
      const newProvider = reuseCallback ? oldProvider : vi.fn(async () => 'new result');
      const detach = manager.setDiagnoseFn(oldProvider);
      manager.setDiagnoseFn(newProvider);
      detach();
      return expect(manager.diagnoseSingleEvent(createEvent())).resolves.toMatchObject({
        diagnosis: reuseCallback ? 'old result' : 'new result',
      });
    }
  );

  it('lets an active analysis finish and retains the batch until a new provider is ready', async () => {
    const active = deferred<string>();
    const oldProvider = vi.fn(() => active.promise);
    const detach = manager.setDiagnoseFn(oldProvider);
    const cycle = manager.diagnoseEvents([
      createEvent(),
      createEvent({ uid: 'background', objectName: 'background-workload' }),
    ]);
    detach();
    expect(manager.isRunning()).toBe(true);
    const queued = manager.diagnoseSingleEvent(
      createEvent({ uid: 'manual', objectName: 'manual-workload' })
    );
    active.resolve('completed active analysis');
    await cycle;
    expect(oldProvider).toHaveBeenCalledOnce();
    expect(manager.getDiagnosis('uid-1')).toMatchObject({
      diagnosis: 'completed active analysis',
      loading: false,
    });
    expect(manager.getDiagnosis('background')).toMatchObject({ pending: true });
    expect(manager.getDiagnosis('background')?.error).toBeUndefined();
    expect(manager.getDiagnosis('manual')).toMatchObject({ pending: true });

    const calls: string[] = [];
    manager.setDiagnoseFn(async prompt => {
      calls.push(prompt.includes('**Event UID:** manual') ? 'manual' : 'background');
      return 'new provider result';
    });
    await queued;
    await vi.waitFor(() =>
      expect(manager.getDiagnosis('background')?.diagnosis).toBe('new provider result')
    );
    expect(calls).toEqual(['manual', 'background']);
  });

  it('keeps dismissed events hidden from automatic checks but allows an explicit request', async () => {
    const diagnose = vi.fn(async () => 'result');
    manager.setDiagnoseFn(diagnose);
    const event = createEvent();
    await manager.diagnoseSingleEvent(event);
    manager.dismissDiagnosis(event.uid);
    expect(manager.getAllDiagnoses()).toEqual([]);
    await manager.diagnoseEvents([event]);
    expect(diagnose).toHaveBeenCalledTimes(1);
    await manager.diagnoseSingleEvent(event, true);
    expect(diagnose).toHaveBeenCalledTimes(2);
  });

  it('rejects dismissing an active analysis', async () => {
    const pending = deferred<string>();
    manager.setDiagnoseFn(() => pending.promise);
    const result = manager.diagnoseSingleEvent(createEvent());
    expect(() => manager.dismissDiagnosis('uid-1')).toThrow(
      'Cannot dismiss queued or active analysis'
    );
    pending.resolve('done');
    await result;
  });

  it('does not deduplicate identically named resources in different clusters', async () => {
    const diagnose = vi.fn(async (_prompt: string) => 'result');
    manager.setDiagnoseFn(diagnose);
    await manager.diagnoseEvents([createEvent({ cluster: 'cluster-a' })]);
    await manager.diagnoseEvents([createEvent({ uid: 'cluster-b-event', cluster: 'cluster-b' })]);
    expect(diagnose).toHaveBeenCalledTimes(2);
    expect(diagnose.mock.calls[1][0]).toContain('**Cluster:** cluster-b');
  });

  it('preserves cluster provenance when extracting and deduplicating events', () => {
    const event = {
      type: 'Warning',
      metadata: { uid: 'one', name: 'event' },
      involvedObject: { kind: 'Pod', name: 'same-workload', namespace: 'default' },
    };
    const extracted = ProactiveDiagnosisManager.extractTopEvents([
      { _cluster: 'a', jsonData: event },
      { _cluster: 'b', jsonData: { ...event, metadata: { uid: 'two', name: 'event' } } },
    ]);
    expect(extracted.map(item => item.cluster)).toEqual(['a', 'b']);
  });

  it('rejects manual diagnosis and skips cycles while disabled', async () => {
    manager.stop();
    const diagnose = vi.fn(async () => 'diagnosis');
    manager.setDiagnoseFn(diagnose);

    await expect(manager.diagnoseSingleEvent(createEvent())).rejects.toThrow(
      'Proactive diagnosis is disabled'
    );
    await manager.diagnoseEvents([createEvent()]);
    expect(diagnose).not.toHaveBeenCalled();
    expect(manager.isEnabled()).toBe(false);
  });

  it('keeps results in insertion order as their timestamps change', async () => {
    vi.spyOn(Date, 'now')
      .mockReturnValueOnce(1)
      .mockReturnValueOnce(100)
      .mockReturnValueOnce(101)
      .mockReturnValueOnce(200);
    const olderEvent = createEvent({ uid: 'uid-old', name: 'old-event' });
    const newerEvent = createEvent({ uid: 'uid-new', name: 'new-event', objectName: 'other' });
    manager.setDiagnoseFn(async () => 'diagnosis');
    await manager.diagnoseSingleEvent(olderEvent);
    await manager.diagnoseSingleEvent(newerEvent);

    expect(manager.getAllDiagnoses().map(result => result.eventUid)).toEqual([
      'uid-old',
      'uid-new',
    ]);
  });

  it('getDiagnosis returns a result by uid', async () => {
    const event = createEvent();
    manager.setDiagnoseFn(async () => 'diagnosis');
    const result = await manager.diagnoseSingleEvent(event);

    expect(manager.getDiagnosis(event.uid)).toBe(result);
    expect(manager.getDiagnosis('missing')).toBeUndefined();
  });

  it('queues manual diagnosis until the diagnosis function is available', async () => {
    const event = createEvent();
    const diagnose = vi.fn(async () => 'diagnosis');

    const resultPromise = manager.diagnoseSingleEvent(event);

    expect(manager.getDiagnosis(event.uid)).toMatchObject({ pending: true });
    expect(diagnose).not.toHaveBeenCalled();

    manager.setDiagnoseFn(diagnose);

    await expect(resultPromise).resolves.toMatchObject({ diagnosis: 'diagnosis', pending: false });
    expect(diagnose).toHaveBeenCalledTimes(1);
  });

  it('rejects queued diagnosis if the function is installed while disabled', async () => {
    const diagnose = vi.fn(async () => 'diagnosis');
    const resultPromise = manager.diagnoseSingleEvent(createEvent());
    const rejection = expect(resultPromise).rejects.toThrow('Proactive diagnosis is disabled');
    Reflect.set(manager, 'enabled', false);

    manager.setDiagnoseFn(diagnose);

    await rejection;
    expect(diagnose).not.toHaveBeenCalled();
    expect(manager.getDiagnosis('uid-1')).toMatchObject({
      pending: false,
      error: 'Proactive diagnosis is disabled',
    });
  });

  it('runs a table-triggered diagnosis after the closed panel initializes its mock function', async () => {
    manager.stop();
    manager.start();

    const resultPromise = manager.diagnoseSingleEvent(createEvent());
    expect(manager.getDiagnosis('uid-1')).toMatchObject({ pending: true });

    manager.setDiagnoseFn(async () => 'Canned mock diagnosis for the failing Pod.');

    await expect(resultPromise).resolves.toMatchObject({
      diagnosis: 'Canned mock diagnosis for the failing Pod.',
      pending: false,
      loading: false,
    });
  });

  it('rejects a queued table diagnosis when diagnosis is stopped', async () => {
    const diagnose = vi.fn(async () => 'late diagnosis');
    const resultPromise = manager.diagnoseSingleEvent(createEvent());

    manager.stop();
    await expect(resultPromise).rejects.toThrow('Proactive diagnosis was stopped');
    manager.setDiagnoseFn(diagnose);

    expect(diagnose).not.toHaveBeenCalled();
    expect(manager.getDiagnosis('uid-1')).toMatchObject({
      pending: false,
      error: 'Proactive diagnosis was stopped',
    });
  });

  it('times out a queued table diagnosis when setup never becomes ready', async () => {
    vi.useFakeTimers();
    const resultPromise = manager.diagnoseSingleEvent(createEvent());

    vi.advanceTimersByTime(SINGLE_EVENT_QUEUE_TIMEOUT_MS);
    await expect(resultPromise).rejects.toThrow('Diagnosis setup timed out');
    expect(manager.getDiagnosis('uid-1')).toMatchObject({
      pending: false,
      error: 'Diagnosis setup timed out',
    });
    vi.useRealTimers();
  });

  it('hasDiagnosis is true only for successful diagnoses', async () => {
    const successfulEvent = createEvent({ uid: 'success' });
    const loadingEvent = createEvent({ uid: 'loading', objectName: 'loading-app' });
    const errorEvent = createEvent({ uid: 'error', objectName: 'error-app' });
    manager.setDiagnoseFn(async () => 'diagnosis');
    await manager.diagnoseSingleEvent(successfulEvent);
    const pending = deferred<string>();
    manager.setDiagnoseFn(() => pending.promise);
    const loadingPromise = manager.diagnoseSingleEvent(loadingEvent);

    expect(manager.hasDiagnosis(successfulEvent.uid)).toBe(true);
    expect(manager.hasDiagnosis(loadingEvent.uid)).toBe(false);
    pending.resolve('done');
    await loadingPromise;
    manager.setDiagnoseFn(async () => {
      throw new Error('boom');
    });
    await manager.diagnoseSingleEvent(errorEvent);
    expect(manager.hasDiagnosis(errorEvent.uid)).toBe(false);
    expect(manager.hasDiagnosis('missing')).toBe(false);
  });

  it('manages scroll-to-event state', () => {
    const listener = vi.fn();
    manager.on('scroll-to-event', listener);

    manager.setScrollToEventUid('uid-1');
    expect(manager.getScrollToEventUid()).toBe('uid-1');
    expect(listener).toHaveBeenCalledWith('uid-1');

    manager.clearScrollToEventUid();
    expect(manager.getScrollToEventUid()).toBeNull();
    manager.setScrollToEventUid(null);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('clearCache clears cached diagnoses, resource keys, and emits an event', async () => {
    const listener = vi.fn();
    const event = createEvent();
    manager.on('cache-cleared', listener);
    manager.setDiagnoseFn(async () => 'diagnosis');

    await manager.diagnoseSingleEvent(event);
    expect(manager.hasDiagnosis(event.uid)).toBe(true);
    expect(manager.hasDiagnosisForResource(createEvent({ uid: 'uid-2' }))).toBe(true);

    manager.clearCache();

    expect(manager.getAllDiagnoses()).toEqual([]);
    expect(manager.hasDiagnosis(event.uid)).toBe(false);
    expect(manager.hasDiagnosisForResource(createEvent({ uid: 'uid-2' }))).toBe(false);
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('extractTopEvents filters, sorts, and deduplicates warning and error events', () => {
    const events = [
      {
        jsonData: {
          type: 'Warning',
          metadata: { uid: 'uid-1', name: 'evt-1', namespace: 'default' },
          reason: 'BackOff',
          message: 'Back-off restarting',
          involvedObject: { kind: 'Pod', name: 'myapp-7b8d9c5f6d-xk4z2', namespace: 'default' },
          lastTimestamp: '2025-01-02T00:00:00Z',
        },
      },
      {
        jsonData: {
          type: 'Error',
          metadata: { uid: 'uid-2', name: 'evt-2', namespace: 'default' },
          reason: 'FailedCreate',
          message: 'Deployment failed',
          involvedObject: { kind: 'Deployment', name: 'myapp', namespace: 'default' },
          lastTimestamp: '2025-01-01T00:00:00Z',
        },
      },
      {
        jsonData: {
          type: 'Warning',
          metadata: { uid: 'uid-3', name: 'evt-3', namespace: 'default' },
          reason: 'FailedScheduling',
          message: 'No nodes available',
          involvedObject: { kind: 'Pod', name: 'otherapp-abc123', namespace: 'default' },
          lastTimestamp: '2025-01-03T00:00:00Z',
        },
      },
      {
        jsonData: {
          type: 'Normal',
          metadata: { uid: 'uid-4', name: 'evt-4', namespace: 'default' },
          reason: 'Pulled',
          message: 'Image pulled',
          involvedObject: { kind: 'Pod', name: 'ignored', namespace: 'default' },
          lastTimestamp: '2025-01-04T00:00:00Z',
        },
      },
    ];

    expect(ProactiveDiagnosisManager.extractTopEvents(events, 5)).toEqual([
      expect.objectContaining({ uid: 'uid-3', objectName: 'otherapp-abc123', type: 'Warning' }),
      expect.objectContaining({
        uid: 'uid-1',
        objectName: 'myapp-7b8d9c5f6d-xk4z2',
        type: 'Warning',
      }),
    ]);
  });

  it('diagnoseSingleEvent returns a diagnosis result from diagnoseFn', async () => {
    const diagnoseFn = vi.fn(async () => 'resolved diagnosis');
    manager.setDiagnoseFn(diagnoseFn);

    const result = await manager.diagnoseSingleEvent(createEvent());

    expect(result).toMatchObject({
      eventUid: 'uid-1',
      diagnosis: 'resolved diagnosis',
      loading: false,
      pending: false,
    });
    expect(diagnoseFn).toHaveBeenCalledTimes(1);
  });

  it('diagnoseSingleEvent returns a cached diagnosis without calling diagnoseFn again', async () => {
    const event = createEvent();
    manager.setDiagnoseFn(async () => 'cached diagnosis');
    const cached = await manager.diagnoseSingleEvent(event);
    const diagnoseFn = vi.fn(async () => 'new diagnosis');
    manager.setDiagnoseFn(diagnoseFn);

    await expect(manager.diagnoseSingleEvent(event)).resolves.toBe(cached);
    expect(diagnoseFn).not.toHaveBeenCalled();
  });

  it('diagnoseSingleEvent returns an error result when diagnoseFn throws', async () => {
    manager.setDiagnoseFn(async () => {
      throw new Error('broken');
    });

    await expect(manager.diagnoseSingleEvent(createEvent())).resolves.toMatchObject({
      eventUid: 'uid-1',
      diagnosis: '',
      loading: false,
      pending: false,
      error: 'broken',
    });
  });

  it('diagnoseEvents skips events that are already diagnosed', async () => {
    const existingEvent = createEvent({
      uid: 'uid-existing',
      objectName: 'myapp-7b8d9c5f6d-xk4z2',
    });
    const sameResourceEvent = createEvent({
      uid: 'uid-same-resource',
      objectName: 'myapp-9f8e7d6c5b-zx9y8',
    });
    const newEvent = createEvent({ uid: 'uid-new', objectName: 'otherapp-abc123' });
    manager.setDiagnoseFn(async () => 'existing diagnosis');
    await manager.diagnoseSingleEvent(existingEvent);
    const diagnoseFn = vi.fn(async () => 'fresh diagnosis');
    manager.setDiagnoseFn(diagnoseFn);

    await manager.diagnoseEvents([existingEvent, sameResourceEvent, newEvent]);

    expect(diagnoseFn).toHaveBeenCalledTimes(1);
    expect(manager.hasDiagnosis(newEvent.uid)).toBe(true);
    expect(manager.getDiagnosis(sameResourceEvent.uid)).toBeUndefined();
  });

  it('diagnoseEvents is a no-op without a function or while another cycle runs', async () => {
    const event = createEvent();
    await manager.diagnoseEvents([event]);
    expect(manager.getDiagnosis(event.uid)).toBeUndefined();

    const pending = deferred<string>();
    const diagnoseFn = vi.fn(() => pending.promise);
    manager.setDiagnoseFn(diagnoseFn);
    const firstCycle = manager.diagnoseEvents([event]);
    await manager.diagnoseEvents([createEvent({ uid: 'ignored', objectName: 'ignored-app' })]);
    expect(diagnoseFn).toHaveBeenCalledOnce();
    pending.resolve('done');
    await firstCycle;
  });

  it('diagnoseEvents records per-event failures and continues sequentially', async () => {
    const failed = createEvent({ uid: 'failed', objectName: 'failed-app' });
    const successful = createEvent({ uid: 'successful', objectName: 'successful-app' });
    const diagnoseFn = vi
      .fn()
      .mockRejectedValueOnce('non-error failure')
      .mockResolvedValueOnce('diagnosed');
    manager.setDiagnoseFn(diagnoseFn);

    await manager.diagnoseEvents([failed, successful]);

    expect(manager.getDiagnosis(failed.uid)).toMatchObject({
      error: 'Diagnosis failed',
      loading: false,
      pending: false,
    });
    expect(manager.getDiagnosis(successful.uid)).toMatchObject({ diagnosis: 'diagnosed' });
    expect(diagnoseFn).toHaveBeenCalledTimes(2);
  });

  it('allows retrying a resource after its previous diagnosis failed', async () => {
    const failed = createEvent({ uid: 'failed', objectName: 'retry-app' });
    const retry = createEvent({ uid: 'retry', objectName: 'retry-app' });
    manager.setDiagnoseFn(async () => {
      throw new Error('failed');
    });
    await manager.diagnoseSingleEvent(failed);
    expect(manager.hasDiagnosisForResource(retry)).toBe(false);
  });

  it('hasDiagnosisForResource matches resources by normalized resource key', async () => {
    const deploymentEvent = createEvent({
      uid: 'uid-deploy',
      objectKind: 'Deployment',
      objectName: 'myapp',
    });
    const podEvent = createEvent({
      uid: 'uid-pod',
      objectKind: 'Pod',
      objectName: 'myapp-7b8d9c5f6d-xk4z2',
    });

    manager.setDiagnoseFn(async () => 'diagnosis');
    await manager.diagnoseSingleEvent(deploymentEvent);

    expect(manager.hasDiagnosisForResource(podEvent)).toBe(true);
  });

  it('queues single-event requests behind an active cycle and preserves thinking steps', async () => {
    vi.useFakeTimers();
    const first = deferred<string>();
    const calls: string[] = [];
    manager.setDiagnoseFn(async (prompt, onStep) => {
      calls.push(prompt);
      onStep?.({ id: 'step', content: 'working', type: 'intermediate-text', timestamp: 1 });
      return calls.length === 1 ? first.promise : 'queued diagnosis';
    });
    const cycle = manager.diagnoseEvents([createEvent()]);
    const queued = manager.diagnoseSingleEvent(
      createEvent({ uid: 'queued', objectName: 'queued-app' })
    );
    const queuedResolved = vi.fn();
    void queued.then(queuedResolved);
    expect(manager.isRunning()).toBe(true);
    vi.advanceTimersByTime(SINGLE_EVENT_QUEUE_TIMEOUT_MS);
    await Promise.resolve();
    expect(queuedResolved).not.toHaveBeenCalled();
    first.resolve('cycle diagnosis');
    await cycle;
    await expect(queued).resolves.toMatchObject({
      eventUid: 'queued',
      diagnosis: 'queued diagnosis',
      thinkingSteps: [expect.objectContaining({ content: 'working' })],
    });
    expect(calls).toHaveLength(2);
    vi.useRealTimers();
  });

  it('times out queued work when the provider is removed during an active cycle', async () => {
    vi.useFakeTimers();
    const first = deferred<string>();
    const diagnoseFn = vi.fn(() => first.promise);
    manager.setDiagnoseFn(diagnoseFn);
    const cycle = manager.diagnoseEvents([createEvent()]);
    const queued = manager.diagnoseSingleEvent(
      createEvent({ uid: 'queued', objectName: 'queued-app' })
    );
    const rejection = expect(queued).rejects.toThrow('Diagnosis setup timed out');

    manager.setDiagnoseFn(null);
    first.resolve('cycle diagnosis');
    await cycle;
    vi.advanceTimersByTime(SINGLE_EVENT_QUEUE_TIMEOUT_MS);

    await rejection;
    expect(diagnoseFn).toHaveBeenCalledTimes(1);
    expect(manager.getDiagnosis('queued')).toMatchObject({
      pending: false,
      error: 'Diagnosis setup timed out',
    });
    vi.useRealTimers();
  });

  it('waits for a pending batch event without diagnosing it twice', async () => {
    const first = deferred<string>();
    const diagnoseFn = vi
      .fn()
      .mockImplementationOnce(() => first.promise)
      .mockResolvedValueOnce('second diagnosis');
    manager.setDiagnoseFn(diagnoseFn);
    const firstEvent = createEvent({ uid: 'first', objectName: 'first-app' });
    const secondEvent = createEvent({ uid: 'second', objectName: 'second-app' });
    const cycle = manager.diagnoseEvents([firstEvent, secondEvent]);
    const pendingRequest = manager.diagnoseSingleEvent(secondEvent);

    expect(manager.hasDiagnosis(secondEvent.uid)).toBe(false);
    first.resolve('first diagnosis');
    await cycle;
    await expect(pendingRequest).resolves.toMatchObject({
      eventUid: 'second',
      diagnosis: 'second diagnosis',
    });
    expect(diagnoseFn).toHaveBeenCalledTimes(2);
  });

  it('keeps nameless warning events distinct and tolerates malformed event input', () => {
    const extracted = ProactiveDiagnosisManager.extractTopEvents([
      null,
      { type: 'Warning', metadata: { uid: 'one', name: 'one' }, lastTimestamp: 'invalid' },
      { type: 'Error', metadata: { uid: 'two', name: 'two' } },
    ]);
    expect(extracted.map(event => event.uid)).toEqual(['one', 'two']);
    expect(extracted.every(event => event.rawEvent && typeof event.rawEvent === 'object')).toBe(
      true
    );
    expect(ProactiveDiagnosisManager.extractTopEvents(extracted, -1)).toEqual([]);
  });

  it('assigns distinct fallback identities to fully nameless events', () => {
    const extracted = ProactiveDiagnosisManager.extractTopEvents([
      { type: 'Warning' },
      { type: 'Error' },
    ]);
    expect(extracted.map(event => event.uid)).toEqual(['event-0', 'event-1']);
  });

  it('extractTopEvents supports direct events and fills missing fields safely', () => {
    const extracted = ProactiveDiagnosisManager.extractTopEvents([
      {
        type: 'Warning',
        metadata: { name: 'event-name', creationTimestamp: '2025-01-01T00:00:00Z' },
        involvedObject: { name: 'plain-name' },
      },
      { type: 42 },
      [],
    ]);

    expect(extracted).toEqual([
      {
        uid: 'event-name-_',
        name: 'event-name',
        type: 'Warning',
        reason: '',
        message: '',
        objectKind: '',
        objectName: 'plain-name',
        objectNamespace: '',
        lastTimestamp: '2025-01-01T00:00:00Z',
        rawEvent: expect.any(Object),
      },
    ]);
  });
});
