import { ApiProxy, K8s } from '@kinvolk/headlamp-plugin/lib';
import { act, renderHook, waitFor } from '@testing-library/react';
import { toRevisionMarkers, useRevisionMarkers } from './useRevisionMarkers';

vi.mock('@kinvolk/headlamp-plugin/lib', async importOriginal => {
  const actual = await importOriginal<typeof import('@kinvolk/headlamp-plugin/lib')>();
  return { ...actual, ApiProxy: { ...actual.ApiProxy, request: vi.fn() } };
});

type WorkloadKind = 'Deployment' | 'StatefulSet' | 'DaemonSet';

function workload(kind: WorkloadKind, uid = 'workload') {
  const Resource = K8s.ResourceClasses[kind];
  return new Resource(
    {
      ...Resource.getBaseObject(),
      apiVersion: 'apps/v1',
      kind,
      metadata: {
        name: 'web',
        namespace: 'apps',
        uid,
        resourceVersion: '1',
        creationTimestamp: '2026-11-13T18:00:00Z',
      },
      spec: {
        selector: { matchLabels: { app: 'web' } },
        updateStrategy: {
          type: 'RollingUpdate',
          rollingUpdate: { partition: 0, maxUnavailable: 1 },
        },
        template: { spec: { containers: [], nodeName: '' } },
      },
      status: {},
    },
    'alpha'
  );
}

function ownedRevision(kind: WorkloadKind, uid: string, revision: number) {
  return {
    metadata: {
      name: `revision-${revision}`,
      namespace: 'apps',
      uid: `revision-${revision}`,
      creationTimestamp: '2026-11-13T20:00:00.125Z',
      annotations: { 'deployment.kubernetes.io/revision': String(revision) },
      ownerReferences: [{ apiVersion: 'apps/v1', kind, name: 'web', uid }],
    },
    revision,
  };
}

const history = [
  { revision: 2, createdAt: '2026-11-13T20:00:00.125Z' },
  { revision: 1, createdAt: '2026-11-13T19:00:00Z' },
];

describe('toRevisionMarkers', () => {
  it('uses creation timestamps, preserves fractional seconds and sorts chronologically', () => {
    expect(toRevisionMarkers(history)).toEqual([
      { revision: 1, timestamp: Date.parse(history[1].createdAt) / 1000 },
      { revision: 2, timestamp: Date.parse(history[0].createdAt) / 1000 },
    ]);
  });
  it.each([
    { ...history[0], createdAt: '' },
    { ...history[0], createdAt: 'not a date' },
    { ...history[0], revision: 0 },
    { ...history[0], revision: 1.5 },
    { ...history[0], revision: Number.MAX_SAFE_INTEGER + 1 },
  ])('rejects invalid metadata rather than inventing a marker', value => {
    expect(() => toRevisionMarkers([value])).toThrow(
      'Invalid revision number or creation timestamp'
    );
  });
  it('does not cap retained history', () => {
    expect(
      toRevisionMarkers(
        Array.from({ length: 600 }, (_, i) => ({
          ...history[0],
          revision: i + 1,
        }))
      )
    ).toHaveLength(600);
  });
});

describe('useRevisionMarkers', () => {
  beforeEach(() => {
    vi.mocked(ApiProxy.request).mockReset();
    vi.mocked(ApiProxy.request).mockResolvedValue({ items: [] });
  });
  afterEach(() => vi.restoreAllMocks());

  it.each(['Deployment', 'StatefulSet', 'DaemonSet'] as const)(
    'scopes %s reads and filters by owner UID, not labels or name alone',
    async kind => {
      const resource = workload(kind);
      vi.mocked(ApiProxy.request).mockResolvedValue({
        items: [ownedRevision(kind, 'workload', 2), ownedRevision(kind, 'different', 99)],
      });
      const { result } = renderHook(() => useRevisionMarkers(resource, true));
      expect(result.current.enabled).toBe(true);
      await waitFor(() => expect(result.current.status).toBe('loaded'));
      const [path, options] = vi.mocked(ApiProxy.request).mock.calls[0];
      const url = new URL(path, 'http://localhost');
      expect(url.pathname).toBe(
        `/apis/apps/v1/namespaces/apps/${
          kind === 'Deployment' ? 'replicasets' : 'controllerrevisions'
        }`
      );
      expect(url.searchParams.get('labelSelector')).toBe('app=web');
      expect(options).toMatchObject({ cluster: 'alpha', method: 'GET' });
      expect(options?.signal).toBeInstanceOf(AbortSignal);
      expect(result.current.markers).toEqual([
        { revision: 2, timestamp: Date.parse('2026-11-13T20:00:00.125Z') / 1000 },
      ]);
      expect(ApiProxy.request).toHaveBeenCalledOnce();
    }
  );

  it('does not query when metrics are unavailable or the resource is unsupported', () => {
    const resource = workload('Deployment');
    const { result } = renderHook(() => useRevisionMarkers(resource, false));
    expect(result.current.enabled).toBe(false);
    const unsupported = new K8s.ResourceClasses.ReplicaSet(
      K8s.ResourceClasses.ReplicaSet.getBaseObject(),
      'alpha'
    );
    expect(renderHook(() => useRevisionMarkers(unsupported, true)).result.current.supported).toBe(
      false
    );
    expect(ApiProxy.request).not.toHaveBeenCalled();
  });

  it.each(['uid', 'namespace'] as const)(
    'refuses a read when the workload %s is missing',
    async field => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      const resource = workload('Deployment');
      resource.jsonData.metadata[field] = '';
      const { result } = renderHook(() => useRevisionMarkers(resource, true));
      await waitFor(() => expect(result.current.status).toBe('error'));
      expect(result.current.error).toContain('required for revision ownership');
      expect(ApiProxy.request).not.toHaveBeenCalled();
    }
  );

  it('follows continuation tokens without truncating retained revisions', async () => {
    vi.mocked(ApiProxy.request)
      .mockResolvedValueOnce({
        metadata: { continue: 'next/page' },
        items: [ownedRevision('Deployment', 'workload', 2)],
      })
      .mockResolvedValueOnce({ items: [ownedRevision('Deployment', 'workload', 1)] });
    const resource = workload('Deployment');
    const { result } = renderHook(() => useRevisionMarkers(resource, true));
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.markers.map(marker => marker.revision)).toEqual([1, 2]);
    const next = new URL(vi.mocked(ApiProxy.request).mock.calls[1][0], 'http://localhost');
    expect(next.searchParams.get('continue')).toBe('next/page');
  });

  it('rejects repeated continuation tokens instead of looping forever', async () => {
    vi.mocked(ApiProxy.request).mockResolvedValue({ metadata: { continue: 'same' }, items: [] });
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const resource = workload('Deployment');
    const { result } = renderHook(() => useRevisionMarkers(resource, true));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toContain('continuation token');
    expect(ApiProxy.request).toHaveBeenCalledTimes(2);
  });

  it('automatically loads the new workload without showing the previous history', async () => {
    const first = workload('Deployment', 'first');
    const second = workload('Deployment', 'second');
    vi.mocked(ApiProxy.request)
      .mockResolvedValueOnce({ items: [ownedRevision('Deployment', 'first', 1)] })
      .mockResolvedValueOnce({ items: [ownedRevision('Deployment', 'second', 2)] });
    const { result, rerender } = renderHook(({ resource }) => useRevisionMarkers(resource, true), {
      initialProps: { resource: first },
    });
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    rerender({ resource: second });
    expect(result.current.enabled).toBe(true);
    expect(result.current.markers).toEqual([]);
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.markers.map(marker => marker.revision)).toEqual([2]);
    expect(ApiProxy.request).toHaveBeenCalledTimes(2);
  });

  it('aborts pending reads and ignores late results after disabling', async () => {
    let resolveList: (value: object) => void;
    vi.mocked(ApiProxy.request).mockReturnValue(
      new Promise(resolve => {
        resolveList = resolve;
      })
    );
    const resource = workload('Deployment');
    const { result, rerender } = renderHook(({ active }) => useRevisionMarkers(resource, active), {
      initialProps: { active: true },
    });
    const signal = vi.mocked(ApiProxy.request).mock.calls[0][1]?.signal;
    rerender({ active: false });
    expect(signal?.aborted).toBe(true);
    await act(async () => resolveList!({ items: [ownedRevision('Deployment', 'workload', 2)] }));
    expect(result.current.status).toBe('idle');
    expect(result.current.markers).toEqual([]);
  });

  it('aborts old-cluster reads and does not render their late results', async () => {
    let resolveList: (value: object) => void;
    vi.mocked(ApiProxy.request).mockReturnValueOnce(
      new Promise(resolve => {
        resolveList = resolve;
      })
    );
    const first = workload('Deployment');
    const second = workload('Deployment');
    second.cluster = 'beta';
    vi.mocked(ApiProxy.request).mockResolvedValue({
      items: [ownedRevision('Deployment', 'workload', 3)],
    });
    const { result, rerender } = renderHook(({ resource }) => useRevisionMarkers(resource, true), {
      initialProps: { resource: first },
    });
    const signal = vi.mocked(ApiProxy.request).mock.calls[0][1]?.signal;
    rerender({ resource: second });
    expect(signal?.aborted).toBe(true);
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    await act(async () => resolveList!({ items: [ownedRevision('Deployment', 'workload', 2)] }));
    expect(result.current.enabled).toBe(true);
    expect(result.current.markers.map(marker => marker.revision)).toEqual([3]);
    expect(vi.mocked(ApiProxy.request).mock.calls[1][1]?.cluster).toBe('beta');
  });

  it('reloads when the workload resource version changes', async () => {
    const resource = workload('Deployment');
    const { result, rerender } = renderHook(() => useRevisionMarkers(resource, true));
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    resource.jsonData.metadata.resourceVersion = '2';
    rerender();
    await waitFor(() => expect(ApiProxy.request).toHaveBeenCalledTimes(2));
  });

  it('reports forbidden access separately from an empty retained history', async () => {
    const failure = new Error('Forbidden');
    vi.mocked(ApiProxy.request).mockRejectedValue(failure);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resource = workload('Deployment');
    const { result } = renderHook(() => useRevisionMarkers(resource, true));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Forbidden');
    expect(log).toHaveBeenCalledWith('Error loading workload revision markers:', failure);
  });

  it('represents no retained revisions as a successful empty read', async () => {
    const resource = workload('Deployment');
    const { result } = renderHook(() => useRevisionMarkers(resource, true));
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.error).toBeUndefined();
    expect(result.current.markers).toEqual([]);
  });

  it.each([
    { items: null },
    {
      items: [
        {
          ...ownedRevision('Deployment', 'workload', 2),
          metadata: {
            ...ownedRevision('Deployment', 'workload', 2).metadata,
            creationTimestamp: '',
          },
        },
      ],
    },
  ])('surfaces malformed responses and metadata', async response => {
    vi.mocked(ApiProxy.request).mockResolvedValue(response);
    vi.spyOn(console, 'error').mockImplementation(() => {});
    const resource = workload('Deployment');
    const { result } = renderHook(() => useRevisionMarkers(resource, true));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBeTruthy();
  });
});
