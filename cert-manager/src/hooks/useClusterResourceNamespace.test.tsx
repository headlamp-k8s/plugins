import { act, cleanup, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useClusterResourceNamespace } from './useClusterResourceNamespace';

const mocks = vi.hoisted(() => ({ cluster: 'a' as string | null, request: vi.fn() }));
vi.mock('@kinvolk/headlamp-plugin/lib', () => ({
  ApiProxy: { clusterRequest: mocks.request },
  K8s: { useCluster: () => mocks.cluster },
}));
function deployments(namespace: string) {
  return {
    items: [
      {
        spec: {
          template: {
            spec: {
              containers: [
                {
                  name: 'cert-manager-controller',
                  args: [`--cluster-resource-namespace=${namespace}`],
                },
              ],
            },
          },
        },
      },
    ],
  };
}
function deferred() {
  let resolve!: (value: ReturnType<typeof deployments>) => void;
  const promise = new Promise<ReturnType<typeof deployments>>(done => {
    resolve = done;
  });
  return { promise, resolve };
}
beforeEach(() => {
  mocks.cluster = 'a';
  mocks.request.mockReset();
});
afterEach(cleanup);
describe('cluster resource namespace discovery', () => {
  it('invalidates the old namespace immediately and explicitly queries the new cluster', async () => {
    const next = deferred();
    mocks.request.mockResolvedValueOnce(deployments('a-secrets')).mockReturnValueOnce(next.promise);
    const { result, rerender } = renderHook(() => useClusterResourceNamespace(true));
    await waitFor(() => expect(result.current).toBe('a-secrets'));
    mocks.cluster = 'b';
    rerender();
    expect(result.current).toBeUndefined();
    expect(mocks.request).toHaveBeenLastCalledWith('/apis/apps/v1/deployments', {
      method: 'GET',
      cluster: 'b',
    });
    await act(async () => next.resolve(deployments('b-secrets')));
    expect(result.current).toBe('b-secrets');
  });
  it('ignores an obsolete response after a cluster change', async () => {
    const old = deferred();
    const next = deferred();
    mocks.request.mockReturnValueOnce(old.promise).mockReturnValueOnce(next.promise);
    const { result, rerender } = renderHook(() => useClusterResourceNamespace(true));
    mocks.cluster = 'b';
    rerender();
    await act(async () => next.resolve(deployments('b-secrets')));
    await act(async () => old.resolve(deployments('a-secrets')));
    expect(result.current).toBe('b-secrets');
  });
  it('clears discovery when disabled and does not request without a cluster', async () => {
    mocks.request.mockResolvedValue(deployments('a-secrets'));
    const { result, rerender } = renderHook(({ enabled }) => useClusterResourceNamespace(enabled), {
      initialProps: { enabled: true },
    });
    await waitFor(() => expect(result.current).toBe('a-secrets'));
    rerender({ enabled: false });
    expect(result.current).toBeUndefined();
    mocks.request.mockClear();
    mocks.cluster = null;
    rerender({ enabled: true });
    expect(mocks.request).not.toHaveBeenCalled();
  });
  it('does not invent a namespace after an RBAC or network failure', async () => {
    mocks.request.mockRejectedValue(new Error('Forbidden'));
    const { result } = renderHook(() => useClusterResourceNamespace(true));
    await act(async () => {});
    expect(result.current).toBeUndefined();
  });
});
