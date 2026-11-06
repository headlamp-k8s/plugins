import { ApiProxy, Utils } from '@kinvolk/headlamp-plugin/lib';
import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  CHECK_TTL_MS,
  checkMongoDBCommunityCRD,
  CRD_PATH,
  isMongoDBCommunityInstalled,
  isNotFoundError,
  REQUEST_TIMEOUT_MS,
  resetCRDCache,
  useMongoDBCommunityInstalled,
  withTimeout,
} from './crdDetection';

vi.mock('@kinvolk/headlamp-plugin/lib/lib/k8s/crd', () => ({
  makeCustomResourceClass: () =>
    class MockCRD {
      jsonData: any;
      constructor(jsonData: any) {
        this.jsonData = jsonData;
      }
    },
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => {
  return {
    ApiProxy: {
      clusterRequest: vi.fn(),
    },
    Utils: {
      getCluster: vi.fn(),
    },
  };
});

describe('crdDetection', () => {
  const mockClusterRequest = ApiProxy.clusterRequest as unknown as ReturnType<typeof vi.fn>;
  const mockGetCluster = Utils.getCluster as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.resetAllMocks();
    resetCRDCache();
    mockGetCluster.mockReturnValue('test-cluster');
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllTimers();
  });

  describe('isNotFoundError', () => {
    it('identifies status 404 as number and string', () => {
      expect(isNotFoundError({ status: 404 })).toBe(true);
      expect(isNotFoundError({ status: '404' })).toBe(true);
    });

    it('returns false for other status codes or malformed errors', () => {
      expect(isNotFoundError({ status: 403 })).toBe(false);
      expect(isNotFoundError({ status: 500 })).toBe(false);
      expect(isNotFoundError(new Error('Generic failure'))).toBe(false);
      expect(isNotFoundError(null)).toBe(false);
      expect(isNotFoundError(undefined)).toBe(false);
      expect(isNotFoundError('404')).toBe(false);
    });
  });

  describe('withTimeout', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('resolves when request settles before timeout', async () => {
      await expect(withTimeout(Promise.resolve('ok'), 'reading')).resolves.toBe('ok');
    });

    it('rejects with original error when request fails before timeout', async () => {
      const err = new Error('Request refused');
      await expect(withTimeout(Promise.reject(err), 'reading')).rejects.toBe(err);
    });

    it('rejects with timeout error when request exceeds timeout', async () => {
      const pendingPromise = new Promise(() => {});
      const promise = withTimeout(pendingPromise, 'reading CRD');

      const settled = vi.fn();
      promise.catch(settled);

      await vi.advanceTimersByTimeAsync(REQUEST_TIMEOUT_MS - 1);
      expect(settled).not.toHaveBeenCalled();

      await vi.advanceTimersByTimeAsync(1);
      await expect(promise).rejects.toThrow('Timed out reading CRD');
    });
  });

  describe('checkMongoDBCommunityCRD', () => {
    it('sets isInstalled to true when CRD exists (200 OK)', async () => {
      mockClusterRequest.mockResolvedValueOnce({ kind: 'CustomResourceDefinition' });

      const cluster = 'cluster-present';
      const result = await checkMongoDBCommunityCRD(cluster);

      expect(result).toBe(true);
      expect(isMongoDBCommunityInstalled(cluster)).toBe(true);
      expect(mockClusterRequest).toHaveBeenCalledWith(CRD_PATH, { cluster });
      expect(mockClusterRequest).toHaveBeenCalledTimes(1);
    });

    it('sets isInstalled to false when CRD is genuinely missing (404 Not Found)', async () => {
      const notFoundError = new Error('Not found') as any;
      notFoundError.status = 404;
      mockClusterRequest.mockRejectedValueOnce(notFoundError);

      const cluster = 'cluster-missing';
      const result = await checkMongoDBCommunityCRD(cluster);

      expect(result).toBe(false);
      expect(isMongoDBCommunityInstalled(cluster)).toBe(false);
      expect(mockClusterRequest).toHaveBeenCalledWith(CRD_PATH, { cluster });
    });

    it('treats 403 Forbidden as installed (graceful degradation for limited RBAC)', async () => {
      const forbiddenError = new Error('Forbidden') as any;
      forbiddenError.status = 403;
      mockClusterRequest.mockRejectedValueOnce(forbiddenError);

      const cluster = 'cluster-restricted-rbac';
      const result = await checkMongoDBCommunityCRD(cluster);

      expect(result).toBe(true);
      expect(isMongoDBCommunityInstalled(cluster)).toBe(true);
    });

    it('treats 500 server or network error as installed so resources are not falsely hidden', async () => {
      const serverError = new Error('Internal server error') as any;
      serverError.status = 500;
      mockClusterRequest.mockRejectedValueOnce(serverError);

      const cluster = 'cluster-server-error';
      const result = await checkMongoDBCommunityCRD(cluster);

      expect(result).toBe(true);
      expect(isMongoDBCommunityInstalled(cluster)).toBe(true);
    });

    it('deduplicates in-flight requests for the same cluster', async () => {
      let resolvePromise: (value: any) => void;
      mockClusterRequest.mockReturnValueOnce(
        new Promise(resolve => {
          resolvePromise = resolve;
        })
      );

      const cluster = 'cluster-concurrent';
      const p1 = checkMongoDBCommunityCRD(cluster);
      const p2 = checkMongoDBCommunityCRD(cluster);

      expect(mockClusterRequest).toHaveBeenCalledTimes(1);

      resolvePromise!({ kind: 'CustomResourceDefinition' });
      const [res1, res2] = await Promise.all([p1, p2]);

      expect(res1).toBe(true);
      expect(res2).toBe(true);
    });

    it('serves fresh cached result within TTL and re-fetches after TTL expires', async () => {
      vi.useFakeTimers();
      mockClusterRequest.mockResolvedValue({ kind: 'CustomResourceDefinition' });

      const cluster = 'cluster-cached';
      await checkMongoDBCommunityCRD(cluster);
      expect(mockClusterRequest).toHaveBeenCalledTimes(1);

      // Second check within TTL
      vi.advanceTimersByTime(CHECK_TTL_MS - 1000);
      const secondResult = await checkMongoDBCommunityCRD(cluster);
      expect(secondResult).toBe(true);
      expect(mockClusterRequest).toHaveBeenCalledTimes(1);

      // Check after TTL expires triggers a new request
      vi.advanceTimersByTime(2000);
      const thirdResult = await checkMongoDBCommunityCRD(cluster);
      expect(thirdResult).toBe(true);
      expect(mockClusterRequest).toHaveBeenCalledTimes(2);

      vi.useRealTimers();
    });
  });

  describe('useMongoDBCommunityInstalled', () => {
    it('reports notInstalled=true immediately when CRD is missing (404)', async () => {
      const notFoundError = new Error('Not found') as any;
      notFoundError.status = 404;
      mockClusterRequest.mockRejectedValueOnce(notFoundError);

      mockGetCluster.mockReturnValue('cluster-direct-open');

      const { result } = renderHook(() => useMongoDBCommunityInstalled());

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.notInstalled).toBe(true);
      expect(result.current.isInstalled).toBe(false);
    });

    it('reports isInstalled=true when CRD is present', async () => {
      mockClusterRequest.mockResolvedValueOnce({ kind: 'CustomResourceDefinition' });
      mockGetCluster.mockReturnValue('cluster-direct-installed');

      const { result } = renderHook(() => useMongoDBCommunityInstalled());

      expect(result.current.isLoading).toBe(true);

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.notInstalled).toBe(false);
      expect(result.current.isInstalled).toBe(true);
    });

    it('initializes from cache without loading when value is already known', async () => {
      mockClusterRequest.mockResolvedValueOnce({ kind: 'CustomResourceDefinition' });
      mockGetCluster.mockReturnValue('cluster-pre-cached');

      await checkMongoDBCommunityCRD('cluster-pre-cached');

      const { result } = renderHook(() => useMongoDBCommunityInstalled());

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isInstalled).toBe(true);
      expect(result.current.notInstalled).toBe(false);

      await act(async () => {
        await Promise.resolve();
      });
    });

    it('resets state when switching clusters and does not leak previous cluster result', async () => {
      // Cluster A: missing CRD (404)
      const notFoundError = new Error('Not found') as any;
      notFoundError.status = 404;
      mockClusterRequest.mockRejectedValueOnce(notFoundError);

      mockGetCluster.mockReturnValue('cluster-a');
      const { result, rerender } = renderHook(() => useMongoDBCommunityInstalled());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.notInstalled).toBe(true);
      expect(result.current.isLoading).toBe(false);

      // Now simulate cluster switch to cluster-b (which has not resolved yet)
      let resolveClusterB: (value: any) => void;
      mockClusterRequest.mockReturnValueOnce(
        new Promise(resolve => {
          resolveClusterB = resolve;
        })
      );
      mockGetCluster.mockReturnValue('cluster-b');
      rerender();

      // Cluster B is un-cached, so it must show isLoading=true, NOT notInstalled=true from cluster A
      expect(result.current.isLoading).toBe(true);
      expect(result.current.notInstalled).toBe(false);
      expect(result.current.isInstalled).toBe(false);

      // Settle cluster B
      await act(async () => {
        resolveClusterB!({ kind: 'CustomResourceDefinition' });
        await Promise.resolve();
      });

      expect(result.current.isLoading).toBe(false);
      expect(result.current.isInstalled).toBe(true);
      expect(result.current.notInstalled).toBe(false);
    });

    it('updates dynamically when cache updates while hook is mounted', async () => {
      vi.useFakeTimers();

      // Initially cluster is missing CRD
      const notFoundError = new Error('Not found') as any;
      notFoundError.status = 404;
      mockClusterRequest.mockRejectedValueOnce(notFoundError);

      mockGetCluster.mockReturnValue('cluster-dynamic');
      const { result } = renderHook(() => useMongoDBCommunityInstalled());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.notInstalled).toBe(true);

      // Advance time past TTL so that the next check makes a real network request
      vi.advanceTimersByTime(CHECK_TTL_MS + 1000);

      // Now operator is installed and a sidebar check updates the cache
      mockClusterRequest.mockResolvedValueOnce({ kind: 'CustomResourceDefinition' });
      await act(async () => {
        await checkMongoDBCommunityCRD('cluster-dynamic');
      });

      // Hook should automatically react to cache update
      expect(result.current.isInstalled).toBe(true);
      expect(result.current.notInstalled).toBe(false);
      expect(result.current.isLoading).toBe(false);

      vi.useRealTimers();
    });

    it('rechecks periodically via interval and recovers when operator becomes installed', async () => {
      vi.useFakeTimers();

      // Initially cluster is missing CRD
      const notFoundError = new Error('Not found') as any;
      notFoundError.status = 404;
      mockClusterRequest.mockRejectedValueOnce(notFoundError);

      mockGetCluster.mockReturnValue('cluster-interval');
      const { result } = renderHook(() => useMongoDBCommunityInstalled());

      await act(async () => {
        await Promise.resolve();
      });

      expect(result.current.notInstalled).toBe(true);

      // Next request will succeed when interval fires
      mockClusterRequest.mockResolvedValueOnce({ kind: 'CustomResourceDefinition' });

      // Advance interval
      await act(async () => {
        vi.advanceTimersByTime(CHECK_TTL_MS);
        await Promise.resolve();
      });

      expect(result.current.isInstalled).toBe(true);
      expect(result.current.notInstalled).toBe(false);
      expect(result.current.isLoading).toBe(false);

      vi.useRealTimers();
    });
  });
});
