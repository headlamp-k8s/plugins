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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { restartKServicePods } from './restartKServicePods';

const mocks = {
  clearProgress: vi.fn(),
  listPodsByLabelSelector: vi.fn(),
  notifyError: vi.fn(),
  notifyInfo: vi.fn(),
  setProgress: vi.fn(),
};

type MockPod = {
  cluster: string;
  delete: ReturnType<typeof vi.fn>;
  metadata: {
    creationTimestamp: string;
    deletionTimestamp?: string;
    name: string;
  };
  status: { phase: string };
};

type ListResponse = Error | MockPod[] | (() => MockPod[]);

let listResponses: ListResponse[] = [];

function makePod(name: string, createdAt: string): MockPod {
  return {
    cluster: 'cluster-a',
    delete: vi.fn().mockResolvedValue(undefined),
    metadata: { creationTimestamp: createdAt, name },
    status: { phase: 'Running' },
  };
}

function repeatResponse(pods: MockPod[], count: number): MockPod[][] {
  return Array.from({ length: count }, () => pods);
}

function startRestart() {
  const onDone = vi.fn();
  const operation = restartKServicePods({
    clearProgress: mocks.clearProgress,
    cluster: 'cluster-a',
    listPodsByLabelSelector: mocks.listPodsByLabelSelector,
    namespace: 'default',
    notifyError: mocks.notifyError,
    notifyInfo: mocks.notifyInfo,
    onDone,
    serviceName: 'service-a',
    setProgress: mocks.setProgress,
  });

  return { onDone, operation };
}

async function finishRestart(operation: Promise<void>, advanceMs = 0) {
  await Promise.resolve();
  await vi.advanceTimersByTimeAsync(advanceMs);
  await operation;
}

beforeEach(() => {
  vi.useFakeTimers();
  listResponses = [];
  vi.clearAllMocks();
  mocks.listPodsByLabelSelector.mockImplementation(async () => {
    const next = listResponses.shift();
    if (!next) {
      throw new Error('Unexpected Pod list call');
    }

    const response = typeof next === 'function' ? next() : next;
    if (response instanceof Error) {
      throw response;
    }

    return response;
  });
});

afterEach(() => {
  vi.clearAllTimers();
  vi.useRealTimers();
});

describe('restartKServicePods', () => {
  it('aborts before deleting another Pod when replacement recovery times out', async () => {
    const podA = makePod('pod-a', '2026-01-01T00:00:00Z');
    const podB = makePod('pod-b', '2026-01-01T00:01:00Z');
    const replacementB = makePod('pod-b-replacement', '2026-01-01T00:02:00Z');
    listResponses = [
      [podA, podB],
      [podA, podB],
      [podB],
      ...repeatResponse([podB], 30),
      [podB],
      [],
      [replacementB],
    ];

    const { onDone, operation } = startRestart();
    await finishRestart(operation, 62_000);

    expect(podA.delete).toHaveBeenCalledOnce();
    expect(podB.delete).not.toHaveBeenCalled();
    expect(mocks.notifyError).toHaveBeenCalledWith(
      'Timed out waiting for replacement pod after deleting pod-a'
    );
    expect(mocks.notifyInfo).not.toHaveBeenCalledWith('Restart completed successfully');
    expect(mocks.clearProgress).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('aborts before recovery or another deletion when Pod deletion times out', async () => {
    const podA = makePod('pod-a', '2026-01-01T00:00:00Z');
    const podB = makePod('pod-b', '2026-01-01T00:01:00Z');
    const replacementB = makePod('pod-b-replacement', '2026-01-01T00:02:00Z');
    listResponses = [
      [podA, podB],
      [podA, podB],
      ...repeatResponse([podA, podB], 600),
      [podA, podB],
      [podA, podB],
      [podA],
      [podA, replacementB],
    ];

    const { onDone, operation } = startRestart();
    await finishRestart(operation, 602_000);

    expect(podA.delete).toHaveBeenCalledOnce();
    expect(podB.delete).not.toHaveBeenCalled();
    expect(mocks.notifyError).toHaveBeenCalledOnce();
    expect(mocks.notifyError).toHaveBeenCalledWith('Timed out waiting for pod deletion: pod-a');
    expect(mocks.notifyInfo).not.toHaveBeenCalledWith('Restart completed successfully');
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('aborts before deleting another Pod when deletion throws', async () => {
    const podA = makePod('pod-a', '2026-01-01T00:00:00Z');
    const podB = makePod('pod-b', '2026-01-01T00:01:00Z');
    const replacementB = makePod('pod-b-replacement', '2026-01-01T00:02:00Z');
    podA.delete.mockRejectedValue(new Error('delete denied'));
    listResponses = [
      [podA, podB],
      [podA, podB],
      [podA, podB],
      [podA, podB],
      [podA],
      [podA, replacementB],
    ];

    const { onDone, operation } = startRestart();
    await finishRestart(operation, 2_000);

    expect(podA.delete).toHaveBeenCalledOnce();
    expect(podB.delete).not.toHaveBeenCalled();
    expect(mocks.notifyError).toHaveBeenCalledWith('Failed to delete pod pod-a: delete denied');
    expect(mocks.notifyInfo).not.toHaveBeenCalledWith('Restart completed successfully');
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('restarts Pods sequentially after each replacement recovers', async () => {
    const events: string[] = [];
    const podA = makePod('pod-a', '2026-01-01T00:00:00Z');
    const podB = makePod('pod-b', '2026-01-01T00:01:00Z');
    const replacementA = makePod('pod-a-replacement', '2026-01-01T00:02:00Z');
    const replacementB = makePod('pod-b-replacement', '2026-01-01T00:03:00Z');
    podB.delete.mockImplementation(async () => {
      events.push('pod-b-deleted');
    });
    listResponses = [
      [podA, podB],
      [podA, podB],
      [podB],
      () => {
        events.push('pod-a-recovered');
        return [podB, replacementA];
      },
      [podB, replacementA],
      [replacementA],
      [replacementA, replacementB],
    ];

    const { onDone, operation } = startRestart();
    await finishRestart(operation, 2_000);

    expect(podA.delete).toHaveBeenCalledOnce();
    expect(podB.delete).toHaveBeenCalledOnce();
    expect(events).toEqual(['pod-a-recovered', 'pod-b-deleted']);
    expect(mocks.notifyInfo).toHaveBeenCalledTimes(1);
    expect(mocks.notifyInfo).toHaveBeenCalledWith('Restart completed successfully');
    expect(mocks.notifyError).not.toHaveBeenCalled();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('does not delete a Pod when its availability baseline cannot be established', async () => {
    const podA = makePod('pod-a', '2026-01-01T00:00:00Z');
    const podB = makePod('pod-b', '2026-01-01T00:01:00Z');
    const replacementB = makePod('pod-b-replacement', '2026-01-01T00:02:00Z');
    listResponses = [
      [podA, podB],
      new Error('list denied'),
      [podB],
      [podB],
      [podB],
      [],
      [replacementB],
    ];

    const { onDone, operation } = startRestart();
    await finishRestart(operation, 2_000);

    expect(podA.delete).not.toHaveBeenCalled();
    expect(podB.delete).not.toHaveBeenCalled();
    expect(mocks.notifyError).toHaveBeenCalledWith(
      'Failed to check pod availability before deleting pod-a: list denied'
    );
    expect(mocks.notifyInfo).not.toHaveBeenCalledWith('Restart completed successfully');
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('aborts when the target Pod disappears before deletion', async () => {
    const podA = makePod('pod-a', '2026-01-01T00:00:00Z');
    const podB = makePod('pod-b', '2026-01-01T00:01:00Z');
    const replacementB = makePod('pod-b-replacement', '2026-01-01T00:02:00Z');
    listResponses = [[podA, podB], [podB], [podB], [], [replacementB]];

    const { onDone, operation } = startRestart();
    await finishRestart(operation);

    expect(podA.delete).not.toHaveBeenCalled();
    expect(podB.delete).not.toHaveBeenCalled();
    expect(mocks.notifyError).toHaveBeenCalledWith(
      'Restart stopped because pod pod-a is no longer present'
    );
    expect(mocks.notifyInfo).not.toHaveBeenCalledWith('Restart completed successfully');
    expect(mocks.clearProgress).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalledOnce();
  });

  it('aborts when the target Pod is already terminating', async () => {
    const podA = makePod('pod-a', '2026-01-01T00:00:00Z');
    const podB = makePod('pod-b', '2026-01-01T00:01:00Z');
    const terminatingPodA = {
      ...podA,
      metadata: { ...podA.metadata, deletionTimestamp: '2026-01-01T00:02:00Z' },
    };
    listResponses = [
      [podA, podB],
      [terminatingPodA, podB],
    ];

    const { onDone, operation } = startRestart();
    await finishRestart(operation);

    expect(podA.delete).not.toHaveBeenCalled();
    expect(podB.delete).not.toHaveBeenCalled();
    expect(mocks.notifyError).toHaveBeenCalledWith(
      'Restart stopped because pod pod-a is already terminating'
    );
    expect(mocks.notifyInfo).not.toHaveBeenCalledWith('Restart completed successfully');
    expect(mocks.clearProgress).toHaveBeenCalledOnce();
    expect(onDone).toHaveBeenCalledOnce();
  });
});
