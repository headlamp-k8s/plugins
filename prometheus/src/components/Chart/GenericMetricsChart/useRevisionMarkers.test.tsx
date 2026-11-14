import { ApiProxy, K8s, Router } from '@kinvolk/headlamp-plugin/lib';
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
        generation: 1,
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
  const annotations: Record<string, string> = {
    'deployment.kubernetes.io/revision': String(revision),
  };
  return {
    metadata: {
      name: `revision-${revision}`,
      namespace: 'apps',
      uid: `revision-${revision}`,
      creationTimestamp: '2026-11-13T20:00:00.125Z',
      annotations,
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
  it.each([
    {
      value: { ...history[0], name: 'checkout-api-7c8f6bb995', revision: NaN },
      identifier: 'checkout-api-7c8f6bb995',
    },
    {
      value: { ...history[0], name: 'orders-postgres-5d8966bc78', createdAt: 'not a date' },
      identifier: 'orders-postgres-5d8966bc78',
    },
    { value: { ...history[0], name: '', revision: 0 }, identifier: '0' },
  ])('identifies malformed history as $identifier', ({ value, identifier }) => {
    expect(() => toRevisionMarkers([value])).toThrow(
      `Invalid revision number or creation timestamp for revision ${identifier}.`
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

  it('keeps current and retained prior revision numbers separate from object creation', () => {
    const [marker] = toRevisionMarkers([{ ...history[1], revision: 7, previousRevisions: [3, 5] }]);
    expect(marker).toEqual({
      revision: 7,
      timestamp: Date.parse(history[1].createdAt) / 1000,
      previousRevisions: [3, 5],
      reuse: 'recorded',
    });
    expect(marker.previousRevisions).not.toContain(1);
  });

  it.each([[0], [NaN], [2], [3, 1], [1, 1], [Number.MAX_SAFE_INTEGER + 1]])(
    'rejects malformed retained revision history %j',
    (...previousRevisions) => {
      expect(() =>
        toRevisionMarkers([
          {
            ...history[0],
            name: 'checkout-api-6d7f8b9b6c',
            previousRevisions,
          },
        ])
      ).toThrow('Invalid retained revision history for revision checkout-api-6d7f8b9b6c.');
    }
  );

  it('flags ordering-based reuse as inferred without inventing original revisions or new timestamps', () => {
    const markers = toRevisionMarkers([{ ...history[1], revision: 3 }, history[0]], true);
    expect(markers[0]).toEqual({
      revision: 3,
      timestamp: Date.parse(history[1].createdAt) / 1000,
      reuse: 'inferred',
    });
    expect(markers[1].reuse).toBeUndefined();
  });

  it('does not infer reuse from equal timestamps or an isolated retained object', () => {
    expect(
      toRevisionMarkers([{ ...history[0], revision: 3 }, history[0]], true).every(
        marker => !marker.reuse
      )
    ).toBe(true);
    expect(toRevisionMarkers([{ ...history[1], revision: 3 }], true)[0].reuse).toBeUndefined();
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
        {
          revision: 2,
          timestamp: Date.parse('2026-11-13T20:00:00.125Z') / 1000,
          name: 'revision-2',
          ...(kind === 'Deployment' ? { href: '/c/alpha/replicasets/apps/revision-2' } : {}),
        },
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

  it('reads retained Deployment revision numbers without presenting the earliest retained number as original', async () => {
    const old = ownedRevision('Deployment', 'workload', 7);
    old.metadata.annotations['deployment.kubernetes.io/revision-history'] = '3,5';
    const resource = workload('Deployment');
    vi.mocked(ApiProxy.request).mockResolvedValue({ items: [old] });
    const { result } = renderHook(() => useRevisionMarkers(resource, true));
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(result.current.markers[0]).toMatchObject({
      revision: 7,
      previousRevisions: [3, 5],
      reuse: 'recorded',
      timestamp: Date.parse(old.metadata.creationTimestamp) / 1000,
    });
  });

  it.each(['StatefulSet', 'DaemonSet'] as const)(
    'flags possible %s reuse across paginated ControllerRevision history',
    async kind => {
      const old = ownedRevision(kind, 'workload', 3);
      const newer = ownedRevision(kind, 'workload', 2);
      newer.metadata.creationTimestamp = '2026-11-13T21:00:00Z';
      vi.mocked(ApiProxy.request)
        .mockResolvedValueOnce({ metadata: { continue: 'page2' }, items: [old] })
        .mockResolvedValueOnce({ items: [newer] });
      const resource = workload(kind);
      const { result } = renderHook(() => useRevisionMarkers(resource, true));
      await waitFor(() => expect(result.current.status).toBe('loaded'));
      expect(result.current.markers[0]).toMatchObject({
        revision: 3,
        reuse: 'inferred',
        timestamp: Date.parse(old.metadata.creationTimestamp) / 1000,
      });
      expect(result.current.markers[0].previousRevisions).toBeUndefined();
    }
  );

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

  it('reloads when the workload generation changes', async () => {
    const resource = workload('Deployment');
    const { result, rerender } = renderHook(() => useRevisionMarkers(resource, true));
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    resource.jsonData.metadata.generation = 2;
    rerender();
    await waitFor(() => expect(ApiProxy.request).toHaveBeenCalledTimes(2));
  });

  it('ignores status-only updates and equivalent replacement workload objects', async () => {
    let resource = workload('Deployment');
    const { result, rerender } = renderHook(() => useRevisionMarkers(resource, true));
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    for (const version of ['2', '3', '4']) {
      resource = workload('Deployment');
      resource.jsonData.metadata.resourceVersion = version;
      resource.jsonData.status = { replicas: Number(version) };
      rerender();
    }
    expect(ApiProxy.request).toHaveBeenCalledOnce();
  });

  it('coalesces revision changes during a pending read without aborting it', async () => {
    let resolveFirst!: (value: object) => void;
    let resolveNext!: (value: object) => void;
    vi.mocked(ApiProxy.request)
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveFirst = resolve;
        })
      )
      .mockReturnValueOnce(
        new Promise(resolve => {
          resolveNext = resolve;
        })
      );
    let resource = workload('Deployment');
    const { result, rerender } = renderHook(() => useRevisionMarkers(resource, true));
    const signal = vi.mocked(ApiProxy.request).mock.calls[0][1]?.signal;
    for (const generation of [2, 3, 4]) {
      resource = workload('Deployment');
      resource.jsonData.metadata.generation = generation;
      resource.jsonData.spec.selector = { matchLabels: { app: `web-${generation}` } };
      rerender();
    }
    expect(ApiProxy.request).toHaveBeenCalledOnce();
    expect(signal?.aborted).toBe(false);
    await act(async () => resolveFirst({ items: [ownedRevision('Deployment', 'workload', 1)] }));
    expect(result.current.markers.map(marker => marker.revision)).toEqual([1]);
    expect(ApiProxy.request).toHaveBeenCalledTimes(2);
    expect(
      new URL(vi.mocked(ApiProxy.request).mock.calls[1][0], 'http://localhost').searchParams.get(
        'labelSelector'
      )
    ).toBe('app=web-4');
    await act(async () => resolveNext({ items: [ownedRevision('Deployment', 'workload', 4)] }));
    expect(result.current.markers.map(marker => marker.revision)).toEqual([4]);
    expect(ApiProxy.request).toHaveBeenCalledTimes(2);
  });

  it('refreshes after controller acknowledgement and revision-annotation changes', async () => {
    const resource = workload('Deployment');
    const { result, rerender } = renderHook(() => useRevisionMarkers(resource, true));
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    resource.jsonData.status = { observedGeneration: 1 };
    rerender();
    await waitFor(() => expect(ApiProxy.request).toHaveBeenCalledTimes(2));
    resource.jsonData.metadata.annotations = { 'deployment.kubernetes.io/revision': '42' };
    rerender();
    await waitFor(() => expect(ApiProxy.request).toHaveBeenCalledTimes(3));
  });

  it.each(['currentRevision', 'updateRevision'] as const)(
    'refreshes when StatefulSet %s changes without a new workload generation',
    async field => {
      const resource = workload('StatefulSet');
      const { result, rerender } = renderHook(() => useRevisionMarkers(resource, true));
      await waitFor(() => expect(result.current.status).toBe('loaded'));
      resource.jsonData.status = { [field]: 'web-5d8966bc78' };
      rerender();
      await waitFor(() => expect(ApiProxy.request).toHaveBeenCalledTimes(2));
    }
  );

  it('discards queued old-workload refreshes on navigation', async () => {
    let resolveOld!: (value: object) => void;
    vi.mocked(ApiProxy.request).mockReturnValueOnce(
      new Promise(resolve => {
        resolveOld = resolve;
      })
    );
    let resource = workload('Deployment');
    const { result, rerender } = renderHook(() => useRevisionMarkers(resource, true));
    const signal = vi.mocked(ApiProxy.request).mock.calls[0][1]?.signal;
    resource.jsonData.metadata.generation = 2;
    rerender();
    resource = workload('Deployment', 'new-workload');
    rerender();
    expect(signal?.aborted).toBe(true);
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    await act(async () => resolveOld({ items: [ownedRevision('Deployment', 'workload', 1)] }));
    expect(ApiProxy.request).toHaveBeenCalledTimes(2);
    expect(result.current.markers).toEqual([]);
  });

  it('uses a registered ControllerRevision route rather than inventing a CRD link', async () => {
    const route = vi.spyOn(Router, 'createRouteURL').mockReturnValue('/custom/revision-2');
    vi.mocked(ApiProxy.request).mockResolvedValue({
      items: [ownedRevision('StatefulSet', 'workload', 2)],
    });
    const resource = workload('StatefulSet');
    const { result } = renderHook(() => useRevisionMarkers(resource, true));
    await waitFor(() => expect(result.current.status).toBe('loaded'));
    expect(route).toHaveBeenCalledWith(K8s.ResourceClasses.ControllerRevision.detailsRoute, {
      cluster: 'alpha',
      namespace: 'apps',
      name: 'revision-2',
    });
    expect(result.current.markers[0].href).toBe('/custom/revision-2');
  });

  it.each(['error', 'empty', 'markers'] as const)(
    'preserves settled %s state during pending same-workload refreshes',
    async initial => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      if (initial === 'error')
        vi.mocked(ApiProxy.request).mockRejectedValueOnce(new Error('Forbidden'));
      else
        vi.mocked(ApiProxy.request).mockResolvedValueOnce({
          items: initial === 'markers' ? [ownedRevision('Deployment', 'workload', 2)] : [],
        });
      const resource = workload('Deployment');
      const { result, rerender } = renderHook(() => useRevisionMarkers(resource, true));
      await waitFor(() =>
        expect(result.current.status).toBe(initial === 'error' ? 'error' : 'loaded')
      );
      const settled = result.current;
      let resolveList!: (value: object) => void;
      vi.mocked(ApiProxy.request).mockReturnValueOnce(
        new Promise(resolve => {
          resolveList = resolve;
        })
      );
      resource.jsonData.metadata.generation = 2;
      rerender();
      expect(ApiProxy.request).toHaveBeenCalledTimes(2);
      expect(result.current).toEqual(settled);
      await act(async () => resolveList({ items: [ownedRevision('Deployment', 'workload', 3)] }));
      expect(result.current.status).toBe('loaded');
      expect(result.current.error).toBeUndefined();
      expect(result.current.markers.map(marker => marker.revision)).toEqual([3]);
    }
  );

  it('reports forbidden access separately from an empty retained history', async () => {
    const failure = Object.assign(new Error('Forbidden'), { status: 403 });
    vi.mocked(ApiProxy.request).mockRejectedValue(failure);
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resource = workload('Deployment');
    const { result } = renderHook(() => useRevisionMarkers(resource, true));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe('Forbidden');
    expect(result.current.errorStatus).toBe(403);
    expect(log).toHaveBeenCalledWith('Error loading workload revision markers:', failure);
  });

  it('does not retry forbidden history on workload status churn', async () => {
    vi.mocked(ApiProxy.request).mockRejectedValue(
      Object.assign(new Error('Forbidden'), { status: 403 })
    );
    vi.spyOn(console, 'error').mockImplementation(() => {});
    let resource = workload('Deployment');
    const { result, rerender } = renderHook(() => useRevisionMarkers(resource, true));
    await waitFor(() => expect(result.current.status).toBe('error'));
    for (const version of ['2', '3', '4']) {
      resource = workload('Deployment');
      resource.jsonData.metadata.resourceVersion = version;
      rerender();
    }
    expect(ApiProxy.request).toHaveBeenCalledOnce();
  });

  it('identifies the malformed ReplicaSet when a revision annotation is nonnumeric', async () => {
    const item = ownedRevision('Deployment', 'workload', 2);
    item.metadata.name = 'checkout-api-7c8f6bb995';
    item.metadata.annotations['deployment.kubernetes.io/revision'] = 'not-a-revision';
    vi.mocked(ApiProxy.request).mockResolvedValue({ items: [item] });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    const resource = workload('Deployment');
    const { result } = renderHook(() => useRevisionMarkers(resource, true));
    await waitFor(() => expect(result.current.status).toBe('error'));
    expect(result.current.error).toBe(
      'Invalid revision number or creation timestamp for revision checkout-api-7c8f6bb995.'
    );
    expect(result.current.markers).toEqual([]);
    expect(log).toHaveBeenCalledWith(
      'Error loading workload revision markers:',
      new Error(result.current.error)
    );
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
