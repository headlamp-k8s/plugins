import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/KubeObject';
import { getSourceClassByPluralName } from '../common/Resources';
import { getSourceNameAndPluralKind } from '../helpers';

/** Returns instance of the source for the given resource */
export function useSource(item: KubeObject) {
  const namespace = item.jsonData.metadata.namespace;
  const { name, pluralKind, namespace: sourceNamespace } = getSourceNameAndPluralKind(item);

  const resourceClass = getSourceClassByPluralName(pluralKind);

  const [sourceItem] = resourceClass.useGet(name, sourceNamespace ?? namespace);

  return sourceItem;
}
