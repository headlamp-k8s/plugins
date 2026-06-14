import { describe, expect, it, vi } from 'vitest';
import {
  checkHolmesAgentHealth,
  type ClusterRequestFn,
  DEFAULT_AGUI_URL,
  getHolmesServiceProxyPath,
  HOLMES_SERVICE_NAME,
  HOLMES_SERVICE_NAMESPACE,
  HOLMES_SERVICE_PORT,
  HolmesAgent,
  type HolmesPluginConfig,
} from './holmesClient';

describe('holmesClient', () => {
  describe('constants', () => {
    it('has correct default values', () => {
      expect(DEFAULT_AGUI_URL).toBe('http://localhost:5050');
      expect(HOLMES_SERVICE_NAME).toBe('holmesgpt-holmes');
      expect(HOLMES_SERVICE_PORT).toBe(80);
      expect(HOLMES_SERVICE_NAMESPACE).toBe('default');
    });
  });

  describe('getHolmesServiceProxyPath', () => {
    it('returns default proxy path with no config', () => {
      const path = getHolmesServiceProxyPath();
      expect(path).toBe(
        `/api/v1/namespaces/${HOLMES_SERVICE_NAMESPACE}/services/${HOLMES_SERVICE_NAME}:${HOLMES_SERVICE_PORT}/proxy`
      );
    });

    it('appends subPath', () => {
      const path = getHolmesServiceProxyPath(undefined, 'healthz');
      expect(path).toContain('/proxy/healthz');
    });

    it('strips leading slash from subPath', () => {
      const path = getHolmesServiceProxyPath(undefined, '/healthz');
      expect(path).toContain('/proxy/healthz');
      expect(path).not.toContain('/proxy//healthz');
    });

    it('uses custom config values', () => {
      const config: HolmesPluginConfig = {
        holmesNamespace: 'monitoring',
        holmesServiceName: 'my-holmes',
        holmesPort: 8080,
      };
      const path = getHolmesServiceProxyPath(config);
      expect(path).toBe('/api/v1/namespaces/monitoring/services/my-holmes:8080/proxy');
    });

    it('falls back to defaults for empty/whitespace config', () => {
      const config: HolmesPluginConfig = {
        holmesNamespace: '  ',
        holmesServiceName: '',
      };
      const path = getHolmesServiceProxyPath(config);
      expect(path).toContain(HOLMES_SERVICE_NAMESPACE);
      expect(path).toContain(HOLMES_SERVICE_NAME);
    });

    it('validates port range', () => {
      const config1: HolmesPluginConfig = { holmesPort: 0 };
      expect(getHolmesServiceProxyPath(config1)).toContain(`:${HOLMES_SERVICE_PORT}`);

      const config2: HolmesPluginConfig = { holmesPort: 70000 };
      expect(getHolmesServiceProxyPath(config2)).toContain(`:${HOLMES_SERVICE_PORT}`);

      const config3: HolmesPluginConfig = { holmesPort: 9090 };
      expect(getHolmesServiceProxyPath(config3)).toContain(':9090');
    });
  });

  describe('checkHolmesAgentHealth', () => {
    it('returns true when cluster request succeeds', async () => {
      const mockRequest: ClusterRequestFn = vi.fn().mockResolvedValue({});
      const result = await checkHolmesAgentHealth(mockRequest, 'test-cluster');
      expect(result).toBe(true);
      expect(mockRequest).toHaveBeenCalledWith(
        expect.stringContaining('/proxy'),
        expect.objectContaining({ cluster: 'test-cluster', isJSON: false, timeout: 5000 })
      );
    });

    it('returns true on 404 (pod reachable but no route)', async () => {
      const mockRequest: ClusterRequestFn = vi.fn().mockRejectedValue({ status: 404 });
      const result = await checkHolmesAgentHealth(mockRequest, 'test-cluster');
      expect(result).toBe(true);
    });

    it('returns true on 405 (pod reachable but method not allowed)', async () => {
      const mockRequest: ClusterRequestFn = vi.fn().mockRejectedValue({ status: 405 });
      const result = await checkHolmesAgentHealth(mockRequest, 'test-cluster');
      expect(result).toBe(true);
    });

    it('returns true on 422 (pod reachable but unprocessable)', async () => {
      const mockRequest: ClusterRequestFn = vi.fn().mockRejectedValue({ status: 422 });
      const result = await checkHolmesAgentHealth(mockRequest, 'test-cluster');
      expect(result).toBe(true);
    });

    it('returns false on 503 (no endpoints)', async () => {
      const mockRequest: ClusterRequestFn = vi.fn().mockRejectedValue({ status: 503 });
      const result = await checkHolmesAgentHealth(mockRequest, 'test-cluster');
      expect(result).toBe(false);
    });

    it('returns false on network error', async () => {
      const mockRequest: ClusterRequestFn = vi.fn().mockRejectedValue(new Error('ECONNREFUSED'));
      const result = await checkHolmesAgentHealth(mockRequest, 'test-cluster');
      expect(result).toBe(false);
    });

    it('passes custom config to proxy path', async () => {
      const mockRequest: ClusterRequestFn = vi.fn().mockResolvedValue({});
      const config: HolmesPluginConfig = { holmesNamespace: 'custom-ns' };
      await checkHolmesAgentHealth(mockRequest, 'test-cluster', config);
      expect(mockRequest).toHaveBeenCalledWith(
        expect.stringContaining('custom-ns'),
        expect.any(Object)
      );
    });
  });

  describe('HolmesAgent', () => {
    it('constructs with default URL', () => {
      const agent = new HolmesAgent();
      expect(agent.connectionLabel).toBe(DEFAULT_AGUI_URL);
    });

    it('constructs with custom URL', () => {
      const agent = new HolmesAgent('http://custom:9090');
      expect(agent.connectionLabel).toBe('http://custom:9090');
    });

    it('generates a thread ID', () => {
      const agent = new HolmesAgent();
      expect(agent.getThreadId()).toMatch(/^thread-\d+$/);
    });

    it('resets thread with new ID', async () => {
      const agent = new HolmesAgent();
      const firstId = agent.getThreadId();
      // Wait 1ms to ensure Date.now() changes
      await new Promise(resolve => setTimeout(resolve, 2));
      agent.resetThread();
      const secondId = agent.getThreadId();
      expect(secondId).not.toBe(firstId);
      expect(secondId).toMatch(/^thread-\d+$/);
    });
  });
});
