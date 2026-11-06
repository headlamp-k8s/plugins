import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPendingWorkloads } from './kueueVisibility';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({ request: vi.fn() }));

const mockedRequest = vi.mocked(request);

describe('fetchPendingWorkloads', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it('reads v1beta2 first', async () => {
    mockedRequest.mockResolvedValueOnce({ items: [{ metadata: { name: 'a' } }] });

    expect(await fetchPendingWorkloads('clusterqueues/cq/pendingworkloads')).toEqual([
      { metadata: { name: 'a' } },
    ]);
    expect(mockedRequest).toHaveBeenCalledWith(
      '/apis/visibility.kueue.x-k8s.io/v1beta2/clusterqueues/cq/pendingworkloads',
      {},
      false
    );
  });

  it('falls back to v1beta1, then gives up', async () => {
    mockedRequest.mockRejectedValueOnce(new Error('404')).mockResolvedValueOnce({ items: [] });
    expect(await fetchPendingWorkloads('clusterqueues/cq/pendingworkloads')).toEqual([]);
    expect(mockedRequest).toHaveBeenLastCalledWith(
      '/apis/visibility.kueue.x-k8s.io/v1beta1/clusterqueues/cq/pendingworkloads',
      {},
      false
    );

    mockedRequest.mockRejectedValue(new Error('403'));
    expect(await fetchPendingWorkloads('clusterqueues/cq/pendingworkloads')).toBeNull();
  });
});
