import type { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { filterResource } from '@kinvolk/headlamp-plugin/lib/Utils';

/** Empty set: filterResource ignores Headlamp's global namespace selection. */
const NO_NAMESPACE_FILTER = new Set<string>();

/**
 * ResourceListView filter that keeps text search but ignores the global
 * namespace selector. Velero Schedule/Backup/Restore lists are already scoped
 * to the plugin's configured Velero namespace via useList.
 */
export function veleroListFilterFunction(
  item: { jsonData?: KubeObjectInterface } | KubeObjectInterface,
  search?: string
): boolean {
  const resource =
    item && typeof item === 'object' && 'jsonData' in item && item.jsonData
      ? item.jsonData
      : (item as KubeObjectInterface);
  return filterResource(resource, { namespaces: NO_NAMESPACE_FILTER }, search);
}
