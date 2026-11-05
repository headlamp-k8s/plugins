import { K8s } from '@kinvolk/headlamp-plugin/lib';
import type { KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';

/**
 * Resolves a registered resource class from Headlamp's K8s.ResourceClasses
 * only if its kind, API group, and version match the inventory entry.
 */
export function getMatchingResourceClass(
  kind: string,
  group: string | undefined,
  version: string
): KubeObjectClass | undefined {
  const candidateClass = (K8s.ResourceClasses as Record<string, KubeObjectClass | undefined>)[kind];
  if (!candidateClass || typeof candidateClass.apiGet !== 'function') {
    return undefined;
  }

  if (candidateClass.kind && candidateClass.kind !== kind) {
    return undefined;
  }

  const normalizedGroup = group || '';
  const expectedApiVersion = normalizedGroup ? `${normalizedGroup}/${version}` : version;

  const classVersions = Array.isArray(candidateClass.apiVersion)
    ? candidateClass.apiVersion
    : candidateClass.apiVersion
    ? [candidateClass.apiVersion]
    : [];

  if (!classVersions.includes(expectedApiVersion)) {
    return undefined;
  }

  if (candidateClass.apiEndpoint?.apiInfo) {
    const apiInfos = candidateClass.apiEndpoint.apiInfo;
    const confirmsMatch =
      Array.isArray(apiInfos) &&
      apiInfos.some(info => (info.group || '') === normalizedGroup && info.version === version);
    if (!confirmsMatch) {
      return undefined;
    }
  }

  return candidateClass;
}
