import { ApiProxy, K8s, Router } from '@kinvolk/headlamp-plugin/lib';
import type { KubeMetadata } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeMetadata';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import type { RevisionInfo } from '@kinvolk/headlamp-plugin/lib/lib/k8s/rollback';
import { useEffect, useRef, useState } from 'react';

interface RevisionMarker {
  revision: number;
  timestamp: number;
  name?: string;
  href?: string;
  previousRevisions?: number[];
  reuse?: 'recorded' | 'inferred';
}

interface RevisionHistoryEntry extends Pick<RevisionInfo, 'revision' | 'createdAt'> {
  name?: string;
  href?: string;
  previousRevisions?: number[];
}

type RevisionedWorkload =
  | InstanceType<typeof K8s.ResourceClasses.Deployment>
  | InstanceType<typeof K8s.ResourceClasses.StatefulSet>
  | InstanceType<typeof K8s.ResourceClasses.DaemonSet>;

function isRevisionedWorkload(resource?: KubeObject): resource is RevisionedWorkload {
  return (
    !!resource &&
    (K8s.ResourceClasses.Deployment.isClassOf(resource) ||
      K8s.ResourceClasses.StatefulSet.isClassOf(resource) ||
      K8s.ResourceClasses.DaemonSet.isClassOf(resource))
  );
}

export function toRevisionMarkers(
  history: RevisionHistoryEntry[],
  inferReuse = false
): RevisionMarker[] {
  const markers: RevisionMarker[] = history
    .map(revision => {
      const timestamp = Date.parse(revision.createdAt) / 1000;
      if (
        !Number.isSafeInteger(revision.revision) ||
        revision.revision <= 0 ||
        !Number.isFinite(timestamp)
      ) {
        throw new Error(
          `Invalid revision number or creation timestamp for revision ${
            revision.name || revision.revision
          }.`
        );
      }
      const previous = revision.previousRevisions;
      if (
        previous?.some(
          (value, index) =>
            !Number.isSafeInteger(value) ||
            value <= 0 ||
            value >= revision.revision ||
            (index > 0 && value <= previous[index - 1])
        )
      ) {
        throw new Error(
          `Invalid retained revision history for revision ${revision.name || revision.revision}.`
        );
      }
      return {
        revision: revision.revision,
        timestamp,
        ...(revision.name ? { name: revision.name } : {}),
        ...(revision.href ? { href: revision.href } : {}),
        ...(previous?.length ? { previousRevisions: previous, reuse: 'recorded' as const } : {}),
      };
    })
    .sort((a, b) => a.timestamp - b.timestamp || a.revision - b.revision);
  if (inferReuse) {
    let minimumLaterRevision = Infinity;
    for (let end = markers.length; end > 0; ) {
      let start = end - 1;
      while (start > 0 && markers[start - 1].timestamp === markers[end - 1].timestamp) start--;
      // Equal creation timestamps alone cannot establish that an object was reused.
      for (let i = start; i < end; i++) {
        if (!markers[i].reuse && markers[i].revision > minimumLaterRevision)
          markers[i].reuse = 'inferred';
      }
      for (let i = start; i < end; i++)
        minimumLaterRevision = Math.min(minimumLaterRevision, markers[i].revision);
      end = start;
    }
  }
  return markers;
}

interface MarkerState {
  resourceKey: string;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  markers: RevisionMarker[];
  error?: string;
  errorStatus?: number;
}

interface RevisionList {
  metadata?: { continue?: string };
  items: { metadata: KubeMetadata; revision?: number }[];
}

// One-shot lists avoid opening watches through the SDK revision-history helpers.
async function fetchRevisionMarkers(resource: RevisionedWorkload, signal: AbortSignal) {
  const namespace = resource.getNamespace();
  const uid = resource.metadata.uid;
  if (!namespace || !uid || !resource.cluster) {
    throw new Error('Workload cluster, namespace, and UID are required for revision ownership.');
  }
  const deployment = K8s.ResourceClasses.Deployment.isClassOf(resource);
  const Resource = deployment
    ? K8s.ResourceClasses.ReplicaSet
    : K8s.ResourceClasses.ControllerRevision;
  const path = `/apis/${Resource.apiVersion}/namespaces/${encodeURIComponent(namespace)}/${
    Resource.apiName
  }`;
  const params = new URLSearchParams({ limit: '500' });
  if (resource.spec.selector) {
    const selector = K8s.labelSelectorToQuery(resource.spec.selector);
    if (selector) params.set('labelSelector', selector);
  }
  const history: RevisionHistoryEntry[] = [];
  const tokens = new Set<string>();
  let continuation: string;
  do {
    signal.throwIfAborted();
    const page: RevisionList = await ApiProxy.request(`${path}?${params}`, {
      method: 'GET',
      cluster: resource.cluster,
      signal,
    });
    if (!Array.isArray(page.items)) {
      throw new Error('Invalid Kubernetes revision list response.');
    }
    for (const item of page.items) {
      if (
        !item.metadata.ownerReferences?.some(
          owner => owner.uid === uid && owner.kind === resource.kind
        )
      ) {
        continue;
      }
      const value = deployment
        ? item.metadata.annotations?.['deployment.kubernetes.io/revision']
        : item.revision;
      if (value === undefined || value === '' || Number(value) === 0) continue;
      const name = item.metadata.name;
      const href = name
        ? Router.createRouteURL(Resource.detailsRoute, {
            cluster: resource.cluster,
            namespace,
            name,
          })
        : undefined;
      history.push({
        revision: Number(value),
        createdAt: item.metadata.creationTimestamp,
        name,
        href: href || undefined,
        previousRevisions:
          deployment && item.metadata.annotations?.['deployment.kubernetes.io/revision-history']
            ? item.metadata.annotations['deployment.kubernetes.io/revision-history']
                .split(',')
                .map(Number)
            : undefined,
      });
    }
    if (page.metadata?.continue !== undefined && typeof page.metadata.continue !== 'string') {
      throw new Error('Invalid Kubernetes revision continuation token.');
    }
    continuation = page.metadata?.continue ?? '';
    if (continuation) {
      if (tokens.has(continuation))
        throw new Error('Repeated Kubernetes revision continuation token.');
      tokens.add(continuation);
      params.set('continue', continuation);
    }
  } while (continuation);
  return toRevisionMarkers(history, true);
}

export function useRevisionMarkers(resource: KubeObject | undefined, active: boolean) {
  const resourceKey = resource ? JSON.stringify([resource.cluster, resource.metadata.uid]) : '';
  const status: { observedGeneration?: number; currentRevision?: string; updateRevision?: string } =
    resource?.jsonData.status ?? {};
  const revisionKey = JSON.stringify([
    resource?.metadata.generation,
    resource?.metadata.annotations?.['deployment.kubernetes.io/revision'],
    status.observedGeneration,
    status.currentRevision,
    status.updateRevision,
    resource?.jsonData.spec?.selector,
  ]);
  const supported = isRevisionedWorkload(resource);
  const enabled = active && supported;
  const latestResource = useRef(resource);
  const requestRefresh = useRef<() => void>();
  const [state, setState] = useState<MarkerState>({
    resourceKey,
    status: 'idle',
    markers: [],
  });

  useEffect(() => {
    latestResource.current = resource;
  });

  useEffect(() => {
    if (!enabled) {
      setState({ resourceKey, status: 'idle', markers: [] });
      return;
    }

    let cancelled = false;
    let running = false;
    let queued = false;
    let controller: AbortController | undefined;
    const refresh = async () => {
      if (running) {
        queued = true;
        return;
      }
      running = true;
      try {
        do {
          queued = false;
          const currentResource = latestResource.current;
          if (!isRevisionedWorkload(currentResource)) return;
          controller = new AbortController();
          setState(current =>
            current.resourceKey === resourceKey &&
            (current.status === 'loaded' || current.status === 'error')
              ? current
              : { resourceKey, status: 'loading', markers: [] }
          );
          try {
            const markers = await fetchRevisionMarkers(currentResource, controller.signal);
            if (!cancelled) setState({ resourceKey, status: 'loaded', markers });
          } catch (error) {
            if (!cancelled) {
              console.error('Error loading workload revision markers:', error);
              setState({
                resourceKey,
                status: 'error',
                markers: [],
                error: error instanceof Error ? error.message : String(error),
                errorStatus:
                  typeof error === 'object' &&
                  error !== null &&
                  'status' in error &&
                  typeof error.status === 'number'
                    ? error.status
                    : undefined,
              });
            }
          } finally {
            controller = undefined;
          }
        } while (queued && !cancelled);
      } finally {
        running = false;
      }
    };
    requestRefresh.current = () => {
      void refresh();
    };
    return () => {
      cancelled = true;
      queued = false;
      controller?.abort();
      requestRefresh.current = undefined;
    };
  }, [enabled, resourceKey]);

  useEffect(() => {
    requestRefresh.current?.();
  }, [enabled, resourceKey, revisionKey]);

  const current =
    state.resourceKey === resourceKey
      ? state
      : { status: 'idle' as const, markers: [], error: undefined, errorStatus: undefined };
  return {
    supported,
    enabled,
    status: current.status,
    markers: current.markers,
    error: current.error,
    errorStatus: current.errorStatus,
  };
}
