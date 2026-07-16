import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@headlamp-k8s/ai-common/prompts/baseAssistantPrompt', () => ({
  basePrompt: 'base prompt',
}));

import { type EventDigest, ProactiveDiagnosisManager } from './ProactiveDiagnosisManager';

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

  it('getAllDiagnoses returns results sorted by diagnosedAt', async () => {
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
      'uid-new',
      'uid-old',
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
    expect(manager.isRunning()).toBe(true);
    first.resolve('cycle diagnosis');
    await cycle;
    await expect(queued).resolves.toMatchObject({
      eventUid: 'queued',
      diagnosis: 'queued diagnosis',
      thinkingSteps: [expect.objectContaining({ content: 'working' })],
    });
    expect(calls).toHaveLength(2);
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
