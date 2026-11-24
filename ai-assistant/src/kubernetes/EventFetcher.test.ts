/*
 * Copyright 2026 The Kubernetes Authors
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
import type { RawK8sEvent } from './EventFetcher';

const api = vi.hoisted(() => ({ clusterRequest: vi.fn() }));
vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({ clusterRequest: api.clusterRequest }));

const event: RawK8sEvent = {
  metadata: {
    uid: 'warning',
    name: 'warning',
    namespace: 'demo',
    creationTimestamp: '2026-10-23T00:00:00Z',
  },
  type: 'Warning',
  reason: 'BackOff',
  message: 'Container is restarting',
  involvedObject: { kind: 'Pod', name: 'checkout', namespace: 'demo' },
};

describe('EventFetcher', () => {
  beforeEach(() => {
    vi.resetModules();
    api.clusterRequest.mockReset();
    vi.useFakeTimers();
    vi.setSystemTime(0);
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it('preserves successful event caching and real empty results', async () => {
    const { fetchWarningEventsForCluster } = await import('./EventFetcher');
    api.clusterRequest
      .mockResolvedValueOnce({ items: [event] })
      .mockResolvedValueOnce({ items: [] });
    expect(await fetchWarningEventsForCluster('main')).toEqual([event]);
    expect(await fetchWarningEventsForCluster('main')).toEqual([event]);
    expect(api.clusterRequest).toHaveBeenCalledTimes(1);
    vi.setSystemTime(30_001);
    expect(await fetchWarningEventsForCluster('main')).toEqual([]);
    expect(api.clusterRequest).toHaveBeenCalledWith(
      '/api/v1/events?fieldSelector=type!=Normal&limit=50',
      { cluster: 'main' }
    );
  });

  it('shares an in-flight read without issuing duplicate requests', async () => {
    const { fetchWarningEventsForCluster } = await import('./EventFetcher');
    let complete: (result: { items: RawK8sEvent[] }) => void = () => undefined;
    api.clusterRequest.mockImplementation(
      () =>
        new Promise(resolve => {
          complete = resolve;
        })
    );
    const first = fetchWarningEventsForCluster('main');
    const second = fetchWarningEventsForCluster('main');
    expect(api.clusterRequest).toHaveBeenCalledTimes(1);
    complete({ items: [event] });
    expect(await Promise.all([first, second])).toEqual([[event], [event]]);
  });

  it('retains a permission failure during backoff and recovers only after a successful read', async () => {
    const { fetchWarningEventsForCluster } = await import('./EventFetcher');
    api.clusterRequest.mockRejectedValueOnce({
      status: 403,
      message: 'Forbidden: cannot list events',
    });
    await expect(fetchWarningEventsForCluster('main')).rejects.toThrow(
      'Failed to read warning events for cluster "main": Forbidden: cannot list events'
    );
    await expect(fetchWarningEventsForCluster('main')).rejects.toThrow('Forbidden');
    expect(api.clusterRequest).toHaveBeenCalledTimes(1);
    expect(console.warn).toHaveBeenCalledTimes(1);
    vi.setSystemTime(300_001);
    api.clusterRequest.mockResolvedValueOnce({ items: [] });
    await expect(fetchWarningEventsForCluster('main')).resolves.toEqual([]);
    expect(api.clusterRequest).toHaveBeenCalledTimes(2);
  });

  it('does not turn network failures into empty warning lists', async () => {
    const { fetchWarningEventsForClusters } = await import('./EventFetcher');
    api.clusterRequest.mockRejectedValueOnce(new TypeError('Failed to fetch'));
    await expect(fetchWarningEventsForClusters(['offline'])).rejects.toThrow(
      'Failed to read warning events for cluster "offline": Failed to fetch'
    );
  });

  it('reports an incomplete multi-cluster read and preserves errors in grouped context', async () => {
    const { fetchWarningEventsForClusters, fetchClusterWarnings } = await import('./EventFetcher');
    api.clusterRequest.mockImplementation((_url: string, options: { cluster: string }) =>
      options.cluster === 'healthy'
        ? Promise.resolve({ items: [event] })
        : Promise.reject(new Error('Forbidden'))
    );
    await expect(fetchWarningEventsForClusters(['healthy', 'restricted'])).rejects.toThrow(
      'cluster "restricted": Forbidden'
    );
    const context = await fetchClusterWarnings(['healthy', 'restricted']);
    expect(context.healthy).toEqual({ warnings: [{ jsonData: event }], error: null });
    expect(context.restricted.warnings).toEqual([]);
    expect(context.restricted.error?.message).toContain('Forbidden');
    expect(api.clusterRequest).toHaveBeenCalledTimes(2);
  });

  it('preserves cluster provenance for successful multi-cluster reads', async () => {
    const { fetchWarningEventsForClusters } = await import('./EventFetcher');
    api.clusterRequest.mockResolvedValue({ items: [event] });
    await expect(fetchWarningEventsForClusters(['one', 'two'])).resolves.toEqual([
      { jsonData: event, _cluster: 'one' },
      { jsonData: event, _cluster: 'two' },
    ]);
  });

  it('rejects malformed responses rather than claiming that the event list is empty', async () => {
    const { fetchWarningEventsForCluster } = await import('./EventFetcher');
    api.clusterRequest.mockResolvedValueOnce({});
    await expect(fetchWarningEventsForCluster('main')).rejects.toThrow(
      'Invalid Kubernetes event list response'
    );
  });
});
