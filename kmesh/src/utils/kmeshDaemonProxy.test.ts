import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { DAEMON_ENDPOINTS } from './kmeshDaemonApi';
import { daemonRequestDeduped } from './kmeshDaemonProxy';

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {
    request: vi.fn(),
  },
}));

vi.mock('@kinvolk/headlamp-plugin/lib/Utils', () => ({
  getCluster: vi.fn(() => 'test-cluster'),
}));

describe('kmeshDaemonProxy deduplication', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should deduplicate concurrent identical GET requests', async () => {
    // Setup the mock to delay resolving so we can fire multiple concurrent requests
    let resolveRequest: (val: any) => void;
    const requestPromise = new Promise(resolve => {
      resolveRequest = resolve;
    });
    vi.mocked(ApiProxy.request).mockReturnValue(requestPromise as any);

    // Fire 3 concurrent requests with the same parameters
    const req1 = daemonRequestDeduped('ns1', 'pod1', DAEMON_ENDPOINTS.VERSION);
    const req2 = daemonRequestDeduped('ns1', 'pod1', DAEMON_ENDPOINTS.VERSION);
    const req3 = daemonRequestDeduped('ns1', 'pod1', DAEMON_ENDPOINTS.VERSION);

    // The underlying ApiProxy.request should only have been called ONCE at this point
    expect(ApiProxy.request).toHaveBeenCalledTimes(1);

    // Resolve the underlying promise
    resolveRequest!({ version: '1.2.3' });

    // Wait for all three deduplicated promises to resolve
    const [res1, res2, res3] = await Promise.all([req1, req2, req3]);

    // All should get the same response
    expect(res1).toEqual({ version: '1.2.3' });
    expect(res2).toEqual({ version: '1.2.3' });
    expect(res3).toEqual({ version: '1.2.3' });
  });

  it('should not deduplicate POST requests even if concurrent', async () => {
    vi.mocked(ApiProxy.request).mockResolvedValue({ status: 'ok' } as any);

    const req1 = daemonRequestDeduped('ns1', 'pod1', DAEMON_ENDPOINTS.ACCESSLOG, {
      method: 'POST',
      body: { enable: true },
    });
    const req2 = daemonRequestDeduped('ns1', 'pod1', DAEMON_ENDPOINTS.ACCESSLOG, {
      method: 'POST',
      body: { enable: true },
    });

    await Promise.all([req1, req2]);

    // Both requests should go through
    expect(ApiProxy.request).toHaveBeenCalledTimes(2);
  });

  it('should clear the cache after the request completes (resolves or rejects)', async () => {
    vi.mocked(ApiProxy.request).mockResolvedValueOnce({ version: 'first' } as any);

    // Fire first request and let it complete
    const res1 = await daemonRequestDeduped('ns1', 'pod1', DAEMON_ENDPOINTS.VERSION);
    expect(res1).toEqual({ version: 'first' });

    vi.mocked(ApiProxy.request).mockResolvedValueOnce({ version: 'second' } as any);

    // Fire second request sequentially, it should trigger a new ApiProxy.request
    const res2 = await daemonRequestDeduped('ns1', 'pod1', DAEMON_ENDPOINTS.VERSION);
    expect(res2).toEqual({ version: 'second' });

    expect(ApiProxy.request).toHaveBeenCalledTimes(2);
  });

  it('should reject when a GET request includes a body', async () => {
    await expect(
      daemonRequestDeduped('ns1', 'pod1', DAEMON_ENDPOINTS.VERSION, {
        method: 'GET',
        body: { foo: 'bar' },
      })
    ).rejects.toThrow('daemonRequest: GET requests cannot include a request body');

    expect(ApiProxy.request).not.toHaveBeenCalled();
  });
});
