import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@headlamp-k8s/ai-common/ai/prompts', () => ({
  basePrompt: 'base prompt',
}));

import {
  type DiagnosisResult,
  type EventDigest,
  ProactiveDiagnosisManager,
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

const createCachedResult = (
  event: EventDigest,
  overrides: Partial<DiagnosisResult> = {}
): DiagnosisResult => ({
  eventUid: event.uid,
  event,
  diagnosis: 'diagnosis',
  diagnosedAt: 1,
  loading: false,
  pending: false,
  ...overrides,
});

describe('ProactiveDiagnosisManager', () => {
  let manager: ProactiveDiagnosisManager;

  beforeEach(() => {
    manager = new ProactiveDiagnosisManager();
  });

  it('start and stop emit status-change events', () => {
    const statuses: Array<{ enabled: boolean }> = [];
    manager.on('status-change', status => statuses.push(status));

    manager.start();
    manager.stop();

    expect(statuses).toEqual([{ enabled: true }, { enabled: false }]);
  });

  it('getAllDiagnoses returns cached results sorted by diagnosedAt', () => {
    const olderEvent = createEvent({ uid: 'uid-old', name: 'old-event' });
    const newerEvent = createEvent({ uid: 'uid-new', name: 'new-event' });
    const cache = (manager as any).cache as Map<string, DiagnosisResult>;

    cache.set(olderEvent.uid, createCachedResult(olderEvent, { diagnosedAt: 100 }));
    cache.set(newerEvent.uid, createCachedResult(newerEvent, { diagnosedAt: 200 }));

    expect(manager.getAllDiagnoses().map(result => result.eventUid)).toEqual([
      'uid-new',
      'uid-old',
    ]);
  });

  it('getDiagnosis returns a cached result by uid', () => {
    const event = createEvent();
    const result = createCachedResult(event);
    ((manager as any).cache as Map<string, DiagnosisResult>).set(event.uid, result);

    expect(manager.getDiagnosis(event.uid)).toBe(result);
    expect(manager.getDiagnosis('missing')).toBeUndefined();
  });

  it('hasDiagnosis is true only for successful cached diagnoses', () => {
    const successfulEvent = createEvent({ uid: 'success' });
    const loadingEvent = createEvent({ uid: 'loading' });
    const errorEvent = createEvent({ uid: 'error' });
    const cache = (manager as any).cache as Map<string, DiagnosisResult>;

    cache.set(successfulEvent.uid, createCachedResult(successfulEvent));
    cache.set(loadingEvent.uid, createCachedResult(loadingEvent, { loading: true }));
    cache.set(errorEvent.uid, createCachedResult(errorEvent, { error: 'boom' }));

    expect(manager.hasDiagnosis(successfulEvent.uid)).toBe(true);
    expect(manager.hasDiagnosis(loadingEvent.uid)).toBe(false);
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

  it('diagnoseSingleEvent throws when no diagnose function is configured', async () => {
    await expect(manager.diagnoseSingleEvent(createEvent())).rejects.toThrow(
      'Diagnosis function not available'
    );
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
    const cached = createCachedResult(event, { diagnosis: 'cached diagnosis', diagnosedAt: 123 });
    const diagnoseFn = vi.fn(async () => 'new diagnosis');
    manager.setDiagnoseFn(diagnoseFn);
    ((manager as any).cache as Map<string, DiagnosisResult>).set(event.uid, cached);

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
    const diagnoseFn = vi.fn(async () => 'fresh diagnosis');
    manager.setDiagnoseFn(diagnoseFn);
    ((manager as any).cache as Map<string, DiagnosisResult>).set(
      existingEvent.uid,
      createCachedResult(existingEvent, { diagnosis: 'existing diagnosis' })
    );

    await manager.diagnoseEvents([existingEvent, sameResourceEvent, newEvent]);

    expect(diagnoseFn).toHaveBeenCalledTimes(1);
    expect(manager.hasDiagnosis(newEvent.uid)).toBe(true);
    expect(manager.getDiagnosis(sameResourceEvent.uid)).toBeUndefined();
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
});
