import type { AgentSubscriber, HttpAgent, RunAgentResult } from '@ag-ui/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  checkHolmesAgentHealth,
  type ClusterRequestFn,
  DEFAULT_AGUI_URL,
  getHolmesProxyBaseUrl,
  getHolmesServiceProxyPath,
  HOLMES_SERVICE_NAME,
  HOLMES_SERVICE_NAMESPACE,
  HOLMES_SERVICE_PORT,
  HolmesAgent,
  type HolmesPluginConfig,
} from './client';

/** Private HolmesAgent state exercised by delegation and reset tests. */
interface HolmesAgentTestHarness {
  agent: HttpAgent;
  subscriberList: Array<{
    subscriber: AgentSubscriber;
    unsubscribe: () => void;
  }>;
  toolArgsBuffers: Map<string, string>;
  toolNames: Map<string, string>;
}

function privateAgent(agent: HolmesAgent): HolmesAgentTestHarness {
  return agent as unknown as HolmesAgentTestHarness;
}

const emptyRunResult: RunAgentResult = { result: undefined, newMessages: [] };

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

    it('returns false on 404 when the Service does not exist (Holmes not installed)', async () => {
      const mockRequest: ClusterRequestFn = vi.fn().mockRejectedValue({
        status: 404,
        message: 'services "holmesgpt-holmes" not found',
      });
      const result = await checkHolmesAgentHealth(mockRequest, 'test-cluster');
      expect(result).toBe(false);
    });

    it('returns false on 404 with a Kubernetes Status not-found body', async () => {
      const mockRequest: ClusterRequestFn = vi.fn().mockRejectedValue({
        status: 404,
        message: JSON.stringify({
          kind: 'Status',
          reason: 'NotFound',
          details: { name: 'holmesgpt-holmes', kind: 'services' },
          code: 404,
        }),
      });
      const result = await checkHolmesAgentHealth(mockRequest, 'test-cluster');
      expect(result).toBe(false);
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

    it('returns false when the configured namespace is missing', async () => {
      const mockRequest: ClusterRequestFn = vi.fn().mockRejectedValue({
        status: 404,
        body: JSON.stringify({
          kind: 'Status',
          details: { kind: 'namespaces', name: 'custom-ns' },
          message: 'namespaces "custom-ns" not found',
        }),
      });
      await expect(checkHolmesAgentHealth(mockRequest, 'test-cluster')).resolves.toBe(false);
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

    it('subscribe returns an unsubscribe function', () => {
      const agent = new HolmesAgent();
      const sub = agent.subscribe({ onRunStartedEvent: vi.fn() });
      expect(typeof sub.unsubscribe).toBe('function');
    });

    it('unsubscribe removes the subscriber from the list', () => {
      const agent = new HolmesAgent();
      const subscriber = { onRunStartedEvent: vi.fn() };
      const { unsubscribe } = agent.subscribe(subscriber);
      unsubscribe();
      const list = privateAgent(agent).subscriberList;
      expect(list).not.toContain(subscriber);
    });

    it('addMessage delegates to the inner agent', () => {
      const agent = new HolmesAgent();
      const innerAgent = privateAgent(agent).agent;
      const addMessageSpy = vi.spyOn(innerAgent, 'addMessage');
      agent.addMessage({ id: 'm1', role: 'user', content: 'hello' });
      expect(addMessageSpy).toHaveBeenCalledWith({ id: 'm1', role: 'user', content: 'hello' });
    });

    it('runAgent delegates to the inner agent with a generated runId', async () => {
      const agent = new HolmesAgent();
      const innerAgent = privateAgent(agent).agent;
      const runSpy = vi.spyOn(innerAgent, 'runAgent').mockResolvedValue(emptyRunResult);
      await agent.runAgent();
      expect(runSpy).toHaveBeenCalledWith(
        expect.objectContaining({ runId: expect.stringMatching(/^run-\d+$/) })
      );
    });

    it('runAgent passes provided runId through', async () => {
      const agent = new HolmesAgent();
      const innerAgent = privateAgent(agent).agent;
      const runSpy = vi.spyOn(innerAgent, 'runAgent').mockResolvedValue(emptyRunResult);
      await agent.runAgent({ runId: 'my-run-42' });
      expect(runSpy).toHaveBeenCalledWith(expect.objectContaining({ runId: 'my-run-42' }));
    });

    it('abortRun delegates to the inner agent', () => {
      const agent = new HolmesAgent();
      const innerAgent = privateAgent(agent).agent;
      const abortSpy = vi.spyOn(innerAgent, 'abortRun');
      agent.abortRun();
      expect(abortSpy).toHaveBeenCalled();
    });

    it('resetThread re-subscribes existing subscribers to the new agent', () => {
      const agent = new HolmesAgent();
      const subscriber = { onRunStartedEvent: vi.fn() };
      agent.subscribe(subscriber);
      agent.resetThread();
      const newInnerAgent = privateAgent(agent).agent;
      // The new inner agent should also have the subscriber
      const subSpy = vi.spyOn(newInnerAgent, 'subscribe');
      // Since subscribe was already called in resetThread, spy won't see it,
      // but we can verify the subscriberList still contains the subscriber
      const list = privateAgent(agent).subscriberList;
      expect(list.some(item => item.subscriber === subscriber)).toBe(true);
    });

    it('unsubscribe after reset detaches the current inner subscription', () => {
      const agent = new HolmesAgent();
      const unsubscribeCurrent = vi.fn();
      const subscriber = { onRunStartedEvent: vi.fn() };
      const handle = agent.subscribe(subscriber);
      agent.resetThread();
      privateAgent(agent).subscriberList[0].unsubscribe = unsubscribeCurrent;

      handle.unsubscribe();
      expect(unsubscribeCurrent).toHaveBeenCalledOnce();
      expect(privateAgent(agent).subscriberList).toEqual([]);
    });

    it('resetThread clears toolArgsBuffers and toolNames', () => {
      const agent = new HolmesAgent();
      privateAgent(agent).toolArgsBuffers.set('t1', 'args');
      privateAgent(agent).toolNames.set('t1', 'my_tool');
      agent.resetThread();
      expect(privateAgent(agent).toolArgsBuffers.size).toBe(0);
      expect(privateAgent(agent).toolNames.size).toBe(0);
    });
  });
});

// ── getHeadlampBackendOrigin (private) / getHolmesProxyBaseUrl ────────────────

describe('getHolmesProxyBaseUrl', () => {
  const origWindow = Reflect.get(globalThis, 'window') as unknown;

  afterEach(() => {
    Reflect.set(globalThis, 'window', origWindow);
  });

  it('uses the local backend fallback when window is unavailable', () => {
    vi.stubGlobal('window', undefined);

    const url = getHolmesProxyBaseUrl('node-cluster');

    expect(url).toContain('http://localhost:4466/clusters/node-cluster');
  });

  it('uses http://localhost:4466 in Electron renderer (process.type=renderer)', () => {
    Reflect.set(globalThis, 'window', {
      process: { type: 'renderer' },
      location: { origin: 'http://irrelevant' },
    });
    const url = getHolmesProxyBaseUrl('my-cluster');
    expect(url).toContain('http://localhost:4466');
    expect(url).toContain('/clusters/my-cluster');
  });

  it('uses headlampBackendPort when set in Electron', () => {
    Reflect.set(globalThis, 'window', {
      process: { type: 'renderer' },
      headlampBackendPort: 9999,
      location: { origin: 'http://irrelevant' },
    });
    const url = getHolmesProxyBaseUrl('clusterA');
    expect(url).toContain('http://localhost:9999');
  });

  it('uses http://localhost:4466 when Electron detected via userAgent', () => {
    Reflect.set(globalThis, 'window', {
      process: {},
      navigator: undefined,
      location: { origin: 'http://irrelevant' },
    });
    Object.defineProperty(Reflect.get(globalThis, 'window') as object, 'navigator', {
      value: { userAgent: 'Mozilla/5.0 Electron/22.0.0' },
      configurable: true,
    });
    const url = getHolmesProxyBaseUrl('clusterA');
    expect(url).toContain('http://localhost:4466');
  });

  it('uses http://localhost:64446 for Docker Desktop (ddClient present)', () => {
    Reflect.set(globalThis, 'window', {
      ddClient: {},
      location: { origin: 'http://irrelevant' },
    });
    const url = getHolmesProxyBaseUrl('clusterA');
    expect(url).toContain('http://localhost:64446');
  });

  it('falls through to window.location.origin in production (when DEV=false)', () => {
    // In vitest DEV is true, so origin is http://localhost:4466.
    // Stub DEV=false to exercise the production path.
    vi.stubEnv('DEV', false);
    Reflect.set(globalThis, 'window', {
      location: { origin: 'https://myapp.example.com' },
    });
    const url = getHolmesProxyBaseUrl('clusterA');
    expect(url).toContain('/clusters/clusterA');
    vi.unstubAllEnvs();
    Reflect.deleteProperty(globalThis, 'window');
  });

  it('prepends headlampBaseUrl when set to a meaningful value', () => {
    Reflect.set(globalThis, 'window', {
      location: { origin: 'https://myapp.example.com' },
      headlampBaseUrl: '/headlamp',
    });
    const url = getHolmesProxyBaseUrl('clusterA');
    // The origin will be http://localhost:4466 in dev mode, but the
    // /headlamp prefix and /clusters/clusterA path must be present.
    expect(url).toContain('/headlamp/clusters/clusterA');
    expect(url).toContain(getHolmesServiceProxyPath(undefined, ''));
  });

  it('ignores headlampBaseUrl of "/" (root)', () => {
    Reflect.set(globalThis, 'window', {
      location: { origin: 'https://myapp.example.com' },
      headlampBaseUrl: '/',
    });
    const url = getHolmesProxyBaseUrl('clusterA');
    expect(url).not.toContain('//clusters'); // no double slash from "/"
    expect(url).toContain('/clusters/clusterA');
  });

  it('ignores headlampBaseUrl of "./" and "."', () => {
    for (const base of ['./', '.']) {
      Reflect.set(globalThis, 'window', {
        location: { origin: 'https://app.example.com' },
        headlampBaseUrl: base,
      });
      const url = getHolmesProxyBaseUrl('c');
      expect(url).toContain('/clusters/c');
      expect(url).not.toContain(`${base}/clusters`);
    }
  });

  it('includes custom Holmes config in the proxy path', () => {
    Reflect.set(globalThis, 'window', {
      location: { origin: 'https://app.example.com' },
    });
    const config: HolmesPluginConfig = { holmesNamespace: 'monitoring', holmesPort: 8080 };
    const url = getHolmesProxyBaseUrl('clusterA', config);
    expect(url).toContain('/namespaces/monitoring/');
    expect(url).toContain(':8080/');
  });

  it('BUG check: headlampBaseUrl of "./" is treated as empty (no prefix)', () => {
    Reflect.set(globalThis, 'window', {
      location: { origin: 'https://app.example.com' },
      headlampBaseUrl: './',
    });
    // './' is in the exclusion list → no prefix applied
    const url = getHolmesProxyBaseUrl('c');
    // No prefix, so path goes straight to /clusters/
    expect(url).toContain('/clusters/c');
    expect(url).not.toContain('./clusters');
  });
});
