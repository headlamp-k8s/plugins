/**
 * @vitest-environment jsdom
 */
import { request } from '@kinvolk/headlamp-plugin/lib/ApiProxy';
import { renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchPendingWorkloads, usePendingWorkloads } from './kueueVisibility';

vi.mock('@kinvolk/headlamp-plugin/lib/ApiProxy', () => ({ request: vi.fn() }));

const mockedRequest = vi.mocked(request);

describe('fetchPendingWorkloads', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it('reads v1beta2 and gives up when it is not served', async () => {
    mockedRequest.mockResolvedValueOnce({ items: [{ metadata: { name: 'a' } }] });

    expect(await fetchPendingWorkloads('clusterqueues/cq/pendingworkloads')).toEqual([
      { metadata: { name: 'a' } },
    ]);
    expect(mockedRequest).toHaveBeenCalledWith(
      '/apis/visibility.kueue.x-k8s.io/v1beta2/clusterqueues/cq/pendingworkloads?limit=1000&offset=0',
      {},
      false
    );

    mockedRequest.mockRejectedValueOnce(new Error('404'));
    expect(await fetchPendingWorkloads('clusterqueues/cq/pendingworkloads')).toBeNull();
    expect(mockedRequest).toHaveBeenCalledTimes(2);
  });

  it('follows offset pages and asks the given cluster', async () => {
    const fullPage = Array.from({ length: 1000 }, (_, i) => ({ metadata: { name: `w${i}` } }));
    mockedRequest
      .mockResolvedValueOnce({ items: fullPage })
      .mockResolvedValueOnce({ items: [{ metadata: { name: 'last' } }] });

    const items = await fetchPendingWorkloads('clusterqueues/cq/pendingworkloads', 'other');
    expect(items).toHaveLength(1001);
    expect(mockedRequest).toHaveBeenLastCalledWith(
      '/apis/visibility.kueue.x-k8s.io/v1beta2/clusterqueues/cq/pendingworkloads?limit=1000&offset=1000',
      { cluster: 'other' },
      false
    );
  });
});

describe('usePendingWorkloads', () => {
  beforeEach(() => {
    mockedRequest.mockReset();
  });

  it('shares one request between components asking for the same list', async () => {
    mockedRequest.mockResolvedValue({ items: [{ metadata: { name: 'a' } }] });
    const path = 'namespaces/ns/localqueues/lq/pendingworkloads';

    const first = renderHook(() => usePendingWorkloads(path));
    const second = renderHook(() => usePendingWorkloads(path));
    await waitFor(() => expect(second.result.current).toHaveLength(1));
    expect(first.result.current).toHaveLength(1);
    expect(mockedRequest).toHaveBeenCalledTimes(1);

    // A component mounting after the first load gets the list without a new request.
    const third = renderHook(() => usePendingWorkloads(path));
    expect(third.result.current).toHaveLength(1);
    expect(mockedRequest).toHaveBeenCalledTimes(1);

    first.unmount();
    second.unmount();
    third.unmount();
  });
});
