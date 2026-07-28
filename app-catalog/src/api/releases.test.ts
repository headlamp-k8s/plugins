import { ApiProxy } from '@kinvolk/headlamp-plugin/lib';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { mockActionStatus, mockRelease, mockReleaseHistory, mockReleaseList } from '../__tests__/mockData';
import {
  createRelease,
  deleteRelease,
  fetchChart,
  getActionStatus,
  getRelease,
  getReleaseHistory,
  listReleases,
  rollbackRelease,
  upgradeRelease,
} from './releases';

// Mock ApiProxy
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: {
    request: vi.fn(),
  },
  getHeadlampAPIHeaders: vi.fn(() => ({ 'X-Test': 'header' })),
}));

describe('Releases API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('listReleases', () => {
    it('should fetch all releases', async () => {
      vi.mocked(ApiProxy.request).mockResolvedValue(mockReleaseList);

      const result = await listReleases();

      expect(ApiProxy.request).toHaveBeenCalledWith('/helm/releases/list', {
        method: 'GET',
        headers: { 'X-Test': 'header' },
      });
      expect(result).toEqual(mockReleaseList);
    });

    it('should handle API errors', async () => {
      const error = new Error('Network error');
      vi.mocked(ApiProxy.request).mockRejectedValue(error);

      await expect(listReleases()).rejects.toThrow('Network error');
    });
  });

  describe('getRelease', () => {
    it('should fetch a specific release', async () => {
      vi.mocked(ApiProxy.request).mockResolvedValue(mockRelease);

      const result = await getRelease('default', 'my-nginx');

      expect(ApiProxy.request).toHaveBeenCalledWith(
        '/helm/releases?name=my-nginx&namespace=default',
        {
          method: 'GET',
          headers: { 'X-Test': 'header' },
        }
      );
      expect(result).toEqual(mockRelease);
    });

    it('should handle special characters in parameters', async () => {
      vi.mocked(ApiProxy.request).mockResolvedValue(mockRelease);

      await getRelease('my-namespace', 'my-app-v2');

      expect(ApiProxy.request).toHaveBeenCalledWith(
        '/helm/releases?name=my-app-v2&namespace=my-namespace',
        expect.any(Object)
      );
    });
  });

  describe('getReleaseHistory', () => {
    it('should fetch release history', async () => {
      vi.mocked(ApiProxy.request).mockResolvedValue(mockReleaseHistory);

      const result = await getReleaseHistory('default', 'my-nginx');

      expect(ApiProxy.request).toHaveBeenCalledWith(
        '/helm/release/history?name=my-nginx&namespace=default',
        {
          method: 'GET',
          headers: { 'X-Test': 'header' },
        }
      );
      expect(result).toEqual(mockReleaseHistory);
      expect(result.releases).toHaveLength(3);
    });
  });

  describe('deleteRelease', () => {
    it('should delete a release', async () => {
      vi.mocked(ApiProxy.request).mockResolvedValue({ status: 'success' });

      const result = await deleteRelease('default', 'my-nginx');

      expect(ApiProxy.request).toHaveBeenCalledWith(
        '/helm/releases/uninstall?name=my-nginx&namespace=default',
        {
          method: 'DELETE',
          headers: { 'X-Test': 'header' },
        }
      );
      expect(result).toEqual({ status: 'success' });
    });
  });

  describe('rollbackRelease', () => {
    it('should rollback a release to specific version', async () => {
      vi.mocked(ApiProxy.request).mockResolvedValue({ status: 'success' });

      const result = await rollbackRelease('default', 'my-nginx', 2);

      expect(ApiProxy.request).toHaveBeenCalledWith(
        '/helm/releases/rollback?name=my-nginx&namespace=default',
        {
          method: 'PUT',
          headers: { 'X-Test': 'header' },
          body: JSON.stringify({
            name: 'my-nginx',
            namespace: 'default',
            revision: 2,
          }),
        }
      );
      expect(result).toEqual({ status: 'success' });
    });

    it('should handle version 1 rollback', async () => {
      vi.mocked(ApiProxy.request).mockResolvedValue({ status: 'success' });

      await rollbackRelease('default', 'my-nginx', 1);

      const call = vi.mocked(ApiProxy.request).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.revision).toBe(1);
    });
  });

  describe('createRelease', () => {
    it('should install a new release', async () => {
      vi.mocked(ApiProxy.request).mockResolvedValue({ status: 'success' });

      const values = 'replicaCount: 2\nservice:\n  type: LoadBalancer';
      const result = await createRelease(
        'my-nginx',
        'default',
        values,
        'bitnami/nginx',
        '1.0.0',
        'Install nginx'
      );

      expect(ApiProxy.request).toHaveBeenCalledWith(
        '/helm/release/install?namespace=default',
        {
          method: 'POST',
          headers: { 'X-Test': 'header' },
          body: JSON.stringify({
            name: 'my-nginx',
            namespace: 'default',
            values,
            chart: 'bitnami/nginx',
            version: '1.0.0',
            description: 'Install nginx',
          }),
        }
      );
      expect(result).toEqual({ status: 'success' });
    });

    it('should handle empty values', async () => {
      vi.mocked(ApiProxy.request).mockResolvedValue({ status: 'success' });

      await createRelease('my-app', 'default', '', 'stable/app', '1.0.0', '');

      const call = vi.mocked(ApiProxy.request).mock.calls[0];
      const body = JSON.parse(call[1].body);
      expect(body.values).toBe('');
      expect(body.description).toBe('');
    });
  });

  describe('upgradeRelease', () => {
    it('should upgrade an existing release', async () => {
      vi.mocked(ApiProxy.request).mockResolvedValue({ status: 'success' });

      const values = 'replicaCount: 3';
      const result = await upgradeRelease(
        'my-nginx',
        'default',
        values,
        'bitnami/nginx',
        'Upgrade to 1.1.0',
        '1.1.0'
      );

      expect(ApiProxy.request).toHaveBeenCalledWith(
        '/helm/releases/upgrade?name=my-nginx&namespace=default',
        {
          method: 'PUT',
          headers: { 'X-Test': 'header' },
          body: JSON.stringify({
            name: 'my-nginx',
            namespace: 'default',
            values,
            chart: 'bitnami/nginx',
            description: 'Upgrade to 1.1.0',
            version: '1.1.0',
          }),
        }
      );
      expect(result).toEqual({ status: 'success' });
    });
  });

  describe('getActionStatus', () => {
    it('should fetch action status', async () => {
      vi.mocked(ApiProxy.request).mockResolvedValue(mockActionStatus);

      const result = await getActionStatus('my-nginx', 'uninstall');

      expect(ApiProxy.request).toHaveBeenCalledWith(
        '/helm/action/status?name=my-nginx&action=uninstall',
        {
          method: 'GET',
          headers: { 'X-Test': 'header' },
        }
      );
      expect(result).toEqual(mockActionStatus);
    });

    it('should handle different action types', async () => {
      vi.mocked(ApiProxy.request).mockResolvedValue({ status: 'processing' });

      await getActionStatus('my-app', 'install');

      expect(ApiProxy.request).toHaveBeenCalledWith(
        '/helm/action/status?name=my-app&action=install',
        expect.any(Object)
      );
    });
  });

  describe('fetchChart', () => {
    it('should fetch chart data', async () => {
      const mockChartData = { name: 'nginx', version: '1.0.0' };
      vi.mocked(ApiProxy.request).mockResolvedValue(mockChartData);

      const result = await fetchChart('nginx');

      expect(result).toEqual(mockChartData);
    });
  });
});
