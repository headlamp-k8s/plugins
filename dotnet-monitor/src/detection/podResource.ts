import type { PodLike } from './monitorDetection';

export function unwrapPodResource(resource: unknown): PodLike | null {
  if (!resource || typeof resource !== 'object') {
    return null;
  }

  const candidate = resource as PodLike & { jsonData?: PodLike; cluster?: string };
  const raw = candidate.jsonData ?? candidate;
  if (!raw || typeof raw !== 'object') {
    return null;
  }

  return {
    ...raw,
    cluster: candidate.cluster ?? (raw as PodLike).cluster,
  } as PodLike;
}

export function isPodResource(resource: unknown): boolean {
  const pod = unwrapPodResource(resource);
  return Boolean(pod && (Array.isArray(pod.spec?.containers) || Array.isArray(pod.spec?.initContainers)) && pod.metadata);
}
