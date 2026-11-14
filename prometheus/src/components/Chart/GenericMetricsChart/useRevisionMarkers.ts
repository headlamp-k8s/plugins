import { ApiProxy, K8s } from '@kinvolk/headlamp-plugin/lib';
import type { KubeMetadata } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeMetadata';
import type { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import type { RevisionInfo } from '@kinvolk/headlamp-plugin/lib/lib/k8s/rollback';
import { useEffect, useState } from 'react';

interface RevisionMarker {
  revision: number;
  timestamp: number;
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
  history: Pick<RevisionInfo, 'revision' | 'createdAt'>[]
): RevisionMarker[] {
  return history
    .map(revision => {
      const timestamp = Date.parse(revision.createdAt) / 1000;
      if (
        !Number.isSafeInteger(revision.revision) ||
        revision.revision <= 0 ||
        !Number.isFinite(timestamp)
      ) {
        throw new Error(
          `Invalid revision number or creation timestamp for revision ${revision.revision}.`
        );
      }
      return { revision: revision.revision, timestamp };
    })
    .sort((a, b) => a.timestamp - b.timestamp || a.revision - b.revision);
}

interface MarkerState {
  resourceKey: string;
  status: 'idle' | 'loading' | 'loaded' | 'error';
  markers: RevisionMarker[];
  error?: string;
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
  const history: Pick<RevisionInfo, 'revision' | 'createdAt'>[] = [];
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
      history.push({ revision: Number(value), createdAt: item.metadata.creationTimestamp });
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
  return toRevisionMarkers(history);
}

export function useRevisionMarkers(resource: KubeObject | undefined, active: boolean) {
  const resourceKey = resource ? JSON.stringify([resource.cluster, resource.metadata.uid]) : '';
  const resourceVersion = resource?.metadata.resourceVersion;
  const supported = isRevisionedWorkload(resource);
  const enabled = active && supported;
  const [state, setState] = useState<MarkerState>({
    resourceKey,
    status: 'idle',
    markers: [],
  });

  useEffect(() => {
    if (!enabled || !isRevisionedWorkload(resource)) {
      setState({ resourceKey, status: 'idle', markers: [] });
      return;
    }

    let cancelled = false;
    let finished = false;
    const controller = new AbortController();
    setState(current => ({
      resourceKey,
      status: 'loading',
      markers: current.resourceKey === resourceKey ? current.markers : [],
    }));
    (async () => {
      try {
        const markers = await fetchRevisionMarkers(resource, controller.signal);
        if (!cancelled) {
          setState({ resourceKey, status: 'loaded', markers });
        }
      } catch (error) {
        if (!cancelled) {
          console.error('Error loading workload revision markers:', error);
          setState({
            resourceKey,
            status: 'error',
            markers: [],
            error: error instanceof Error ? error.message : String(error),
          });
        }
      } finally {
        finished = true;
      }
    })();
    return () => {
      cancelled = true;
      if (!finished) controller.abort();
    };
  }, [enabled, resource, resourceVersion, resourceKey]);

  const current =
    state.resourceKey === resourceKey
      ? state
      : { status: 'idle' as const, markers: [], error: undefined };
  return {
    supported,
    enabled,
    status: current.status,
    markers: current.markers,
    error: current.error,
  };
}
