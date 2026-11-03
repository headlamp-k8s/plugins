/**
 * @vitest-environment jsdom
 */
import '@testing-library/jest-dom/vitest';
import { act, cleanup, render, screen, waitFor } from '@testing-library/react';
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import {
  AUTH_RETRY_DELAY_MS,
  MAX_AUTH_RETRY_ATTEMPTS,
  MAX_CONCURRENT_NODE_AUTH_CHECKS,
  type NodeAuthController,
  type NodeAuthTarget,
  useCanGetNodes,
} from './useCanGetNodes';

const { mockGetAuthorization } = vi.hoisted(() => ({
  mockGetAuthorization: vi.fn(),
}));

vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  K8s: {
    ResourceClasses: {
      Node: {
        getAuthorization: mockGetAuthorization,
      },
    },
  },
}));

function createDeferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason?: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function AuthHarness({
  targets,
  probeCluster,
  probeNode,
}: {
  targets: Array<NodeAuthTarget | string | undefined>;
  probeCluster?: string;
  probeNode?: string;
}) {
  const { canGetNode } = useCanGetNodes(targets);
  return (
    <div data-testid="auth-result">
      {canGetNode(probeCluster, probeNode) ? 'allowed' : 'denied'}
    </div>
  );
}

describe('useCanGetNodes', () => {
  beforeEach(() => {
    mockGetAuthorization.mockReset();
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  it('uses cluster-wide fast path when unnamed get nodes check is allowed', async () => {
    mockGetAuthorization.mockResolvedValue({ status: { allowed: true } });

    render(
      <AuthHarness
        targets={[
          { cluster: 'cluster-a', nodeName: 'node-1' },
          { cluster: 'cluster-a', nodeName: 'node-2' },
        ]}
        probeCluster="cluster-a"
        probeNode="node-1"
      />
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-result')).toHaveTextContent('allowed');
    });

    // Should only invoke cluster-wide SSAR once and skip per-node checks.
    expect(mockGetAuthorization).toHaveBeenCalledTimes(1);
    expect(mockGetAuthorization).toHaveBeenCalledWith('get', {}, 'cluster-a');
  });

  it('falls back to per-node check when cluster-wide check is denied for resourceNames-scoped RBAC', async () => {
    mockGetAuthorization.mockImplementation((_verb: string, attrs: any) => {
      if (attrs?.name === 'allowed-node') {
        return Promise.resolve({ status: { allowed: true } });
      }
      return Promise.resolve({ status: { allowed: false } });
    });

    const targets = [
      { cluster: 'cluster-a', nodeName: 'allowed-node' },
      { cluster: 'cluster-a', nodeName: 'denied-node' },
    ];

    const { rerender } = render(
      <AuthHarness targets={targets} probeCluster="cluster-a" probeNode="allowed-node" />
    );

    await waitFor(() => {
      expect(screen.getByTestId('auth-result')).toHaveTextContent('allowed');
    });

    expect(mockGetAuthorization).toHaveBeenCalledWith('get', {}, 'cluster-a');
    expect(mockGetAuthorization).toHaveBeenCalledWith('get', { name: 'allowed-node' }, 'cluster-a');
    expect(mockGetAuthorization).toHaveBeenCalledWith('get', { name: 'denied-node' }, 'cluster-a');

    rerender(<AuthHarness targets={targets} probeCluster="cluster-a" probeNode="denied-node" />);
    expect(screen.getByTestId('auth-result')).toHaveTextContent('denied');
  });

  it('retains in-flight SSAR results when targets change before earlier cluster resolves', async () => {
    const clusterADeferred = createDeferred<{ status: { allowed: boolean } }>();
    const clusterBDeferred = createDeferred<{ status: { allowed: boolean } }>();

    mockGetAuthorization.mockImplementation((_verb: string, _attrs: any, cluster?: string) => {
      if (cluster === 'cluster-a') return clusterADeferred.promise;
      if (cluster === 'cluster-b') return clusterBDeferred.promise;
      return Promise.resolve({ status: { allowed: false } });
    });

    const { rerender } = render(
      <AuthHarness
        targets={[{ cluster: 'cluster-a', nodeName: 'node-a' }]}
        probeCluster="cluster-a"
        probeNode="node-a"
      />
    );

    expect(mockGetAuthorization).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('auth-result')).toHaveTextContent('denied');

    // Cluster B streams in while Cluster A's request is still pending.
    rerender(
      <AuthHarness
        targets={[
          { cluster: 'cluster-a', nodeName: 'node-a' },
          { cluster: 'cluster-b', nodeName: 'node-b' },
        ]}
        probeCluster="cluster-a"
        probeNode="node-a"
      />
    );

    expect(mockGetAuthorization).toHaveBeenCalledTimes(2);
    expect(mockGetAuthorization).toHaveBeenCalledWith('get', {}, 'cluster-b');

    // Resolving Cluster A after effect re-run must still update allowed state.
    await act(async () => {
      clusterADeferred.resolve({ status: { allowed: true } });
      await clusterADeferred.promise;
    });

    expect(screen.getByTestId('auth-result')).toHaveTextContent('allowed');

    // Also resolve Cluster B so no promises dangle.
    await act(async () => {
      clusterBDeferred.resolve({ status: { allowed: false } });
      await clusterBDeferred.promise;
    });
  });

  it('retains in-flight SSAR results across React StrictMode double-invocation', async () => {
    const deferred = createDeferred<{ status: { allowed: boolean } }>();
    mockGetAuthorization.mockReturnValue(deferred.promise);

    render(
      <React.StrictMode>
        <AuthHarness
          targets={[{ cluster: 'strict-cluster', nodeName: 'node-1' }]}
          probeCluster="strict-cluster"
          probeNode="node-1"
        />
      </React.StrictMode>
    );

    expect(mockGetAuthorization).toHaveBeenCalledTimes(1);
    expect(screen.getByTestId('auth-result')).toHaveTextContent('denied');

    await act(async () => {
      deferred.resolve({ status: { allowed: true } });
      await deferred.promise;
    });

    expect(screen.getByTestId('auth-result')).toHaveTextContent('allowed');
  });

  it('fails closed when getAuthorization rejects', async () => {
    mockGetAuthorization.mockRejectedValue(new Error('network timeout'));

    render(
      <AuthHarness
        targets={[{ cluster: 'err-cluster', nodeName: 'node-1' }]}
        probeCluster="err-cluster"
        probeNode="node-1"
      />
    );

    await waitFor(() => {
      expect(mockGetAuthorization).toHaveBeenCalledWith('get', {}, 'err-cluster');
    });

    expect(screen.getByTestId('auth-result')).toHaveTextContent('denied');
  });

  it('defers per-node checks for cluster-only targets until requested and bounds concurrent requests', async () => {
    const namedDeferreds = new Map<
      string,
      ReturnType<typeof createDeferred<{ status: { allowed: boolean } }>>
    >();
    let inFlightNamed = 0;
    let peakInFlightNamed = 0;

    mockGetAuthorization.mockImplementation((_verb: string, attrs: any) => {
      if (!attrs?.name) {
        return Promise.resolve({ status: { allowed: false } });
      }
      inFlightNamed += 1;
      peakInFlightNamed = Math.max(peakInFlightNamed, inFlightNamed);
      const d = createDeferred<{ status: { allowed: boolean } }>();
      namedDeferreds.set(attrs.name, d);
      return d.promise.finally(() => {
        inFlightNamed -= 1;
      });
    });

    let controller!: NodeAuthController;
    function QueueHarness() {
      controller = useCanGetNodes([{ cluster: 'large-cluster' }]);
      return (
        <div data-testid="queue-result">
          {controller.canGetNode('large-cluster', 'node-7') ? 'allowed' : 'denied'}
        </div>
      );
    }

    render(<QueueHarness />);

    await waitFor(() => {
      expect(mockGetAuthorization).toHaveBeenCalledWith('get', {}, 'large-cluster');
    });

    // Cluster-only target must not trigger any named node checks on its own.
    expect(mockGetAuthorization).toHaveBeenCalledTimes(1);

    // Enqueue 7 visible rows; concurrency cap must allow at most MAX_CONCURRENT_NODE_AUTH_CHECKS at once.
    act(() => {
      for (let i = 1; i <= 7; i += 1) {
        controller.requestNodeAuth('large-cluster', `node-${i}`);
      }
    });

    expect(namedDeferreds.size).toBe(MAX_CONCURRENT_NODE_AUTH_CHECKS);
    expect(peakInFlightNamed).toBe(MAX_CONCURRENT_NODE_AUTH_CHECKS);

    // Resolve the first batch so remaining queued checks drain.
    await act(async () => {
      for (let i = 1; i <= MAX_CONCURRENT_NODE_AUTH_CHECKS; i += 1) {
        const d = namedDeferreds.get(`node-${i}`)!;
        d.resolve({ status: { allowed: false } });
        await d.promise;
      }
    });

    await waitFor(() => {
      expect(namedDeferreds.size).toBe(7);
    });
    expect(peakInFlightNamed).toBe(MAX_CONCURRENT_NODE_AUTH_CHECKS);

    await act(async () => {
      for (let i = MAX_CONCURRENT_NODE_AUTH_CHECKS + 1; i <= 7; i += 1) {
        const d = namedDeferreds.get(`node-${i}`)!;
        d.resolve({ status: { allowed: i === 7 } });
        await d.promise;
      }
    });

    expect(screen.getByTestId('queue-result')).toHaveTextContent('allowed');
  });

  it('retries transient cluster-wide failures with bounded backoff and recovers when connectivity returns', async () => {
    vi.useFakeTimers();
    try {
      let calls = 0;
      mockGetAuthorization.mockImplementation((_verb: string, attrs: any) => {
        if (!attrs?.name) {
          calls += 1;
          if (calls === 1) {
            return Promise.reject(new Error('temporary outage'));
          }
          return Promise.resolve({ status: { allowed: true } });
        }
        return Promise.resolve({ status: { allowed: false } });
      });

      render(
        <AuthHarness
          targets={[{ cluster: 'flaky-cluster', nodeName: 'node-1' }]}
          probeCluster="flaky-cluster"
          probeNode="node-1"
        />
      );

      // Flush initial rejection microtasks; must not fall back to named checks on transport failure.
      await act(async () => {
        await Promise.resolve();
      });

      expect(calls).toBe(1);
      expect(mockGetAuthorization).toHaveBeenCalledTimes(1);
      expect(screen.getByTestId('auth-result')).toHaveTextContent('denied');

      // Advance past first retry delay; cluster check retries and succeeds.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(AUTH_RETRY_DELAY_MS);
      });

      expect(calls).toBe(2);
      expect(screen.getByTestId('auth-result')).toHaveTextContent('allowed');
    } finally {
      vi.useRealTimers();
    }
  });

  it('bounds named check retries on persistent errors and retries exhausted entries on refresh', async () => {
    vi.useFakeTimers();
    try {
      let nodeCalls = 0;
      let recovered = false;

      mockGetAuthorization.mockImplementation((_verb: string, attrs: any) => {
        if (!attrs?.name) {
          return Promise.resolve({ status: { allowed: false } });
        }
        nodeCalls += 1;
        if (!recovered) {
          return Promise.reject(new Error('apiserver unreachable'));
        }
        return Promise.resolve({ status: { allowed: true } });
      });

      const { rerender } = render(
        <AuthHarness
          targets={[{ cluster: 'scoped-flaky', nodeName: 'node-1' }]}
          probeCluster="scoped-flaky"
          probeNode="node-1"
        />
      );

      // Initial cluster-wide denial + initial named attempt.
      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });
      expect(nodeCalls).toBe(1);

      // Exhaust MAX_AUTH_RETRY_ATTEMPTS automatic retries.
      for (let attempt = 0; attempt < MAX_AUTH_RETRY_ATTEMPTS; attempt += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(AUTH_RETRY_DELAY_MS * (attempt + 1));
        });
      }
      expect(nodeCalls).toBe(1 + MAX_AUTH_RETRY_ATTEMPTS);

      // Advancing time further must not retry past the cap.
      await act(async () => {
        await vi.advanceTimersByTimeAsync(AUTH_RETRY_DELAY_MS * 10);
      });
      expect(nodeCalls).toBe(1 + MAX_AUTH_RETRY_ATTEMPTS);
      expect(screen.getByTestId('auth-result')).toHaveTextContent('denied');

      // Connectivity recovers and targets refresh (e.g. list watch update).
      recovered = true;
      rerender(
        <AuthHarness
          targets={[{ cluster: 'scoped-flaky', nodeName: 'node-1' }]}
          probeCluster="scoped-flaky"
          probeNode="node-1"
        />
      );

      await act(async () => {
        await Promise.resolve();
      });

      expect(nodeCalls).toBe(2 + MAX_AUTH_RETRY_ATTEMPTS);
      expect(screen.getByTestId('auth-result')).toHaveTextContent('allowed');
    } finally {
      vi.useRealTimers();
    }
  });

  it('does not retry explicit RBAC denials', async () => {
    vi.useFakeTimers();
    try {
      mockGetAuthorization.mockResolvedValue({ status: { allowed: false } });

      render(
        <AuthHarness
          targets={[{ cluster: 'denied-cluster', nodeName: 'node-1' }]}
          probeCluster="denied-cluster"
          probeNode="node-1"
        />
      );

      await act(async () => {
        await Promise.resolve();
        await Promise.resolve();
      });

      expect(mockGetAuthorization).toHaveBeenCalledTimes(2);

      await act(async () => {
        await vi.advanceTimersByTimeAsync(AUTH_RETRY_DELAY_MS * 10);
      });

      expect(mockGetAuthorization).toHaveBeenCalledTimes(2);
      expect(screen.getByTestId('auth-result')).toHaveTextContent('denied');
    } finally {
      vi.useRealTimers();
    }
  });
});
