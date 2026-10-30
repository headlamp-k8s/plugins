import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { VolcanoNamespaceQueue } from '../../resources/namespacequeue';
import {
  hasNamespaceQueue,
  resolveNamespaceQueueParent,
} from '../../utils/namespaceQueueRelationships';
import { volcanoRouteNames } from '../../utils/volcanoRoutes';

/**
 * Renders a NamespaceQueue parent as a link to its Queue or NamespaceQueue.
 *
 * A NamespaceQueue parent is only linked once it is known to exist, so a dangling reference is
 * shown as plain text instead of a link to an empty page.
 *
 * @param props NamespaceQueue whose  should be rendered.
 * @returns Link to the parent, the raw value when it cannot be linked, or  when unset.
 */
export default function NamespaceQueueParentLink({
  namespaceQueue,
}: {
  namespaceQueue: VolcanoNamespaceQueue;
}) {
  const parent = namespaceQueue.spec.parent;
  const parentRef = resolveNamespaceQueueParent(namespaceQueue.getNamespace(), parent);

  if (!parentRef) {
    return <>{parent || '-'}</>;
  }

  if (parentRef.kind === 'queue') {
    return (
      <Link routeName={volcanoRouteNames.queueDetail} params={{ name: parentRef.name }}>
        {parent}
      </Link>
    );
  }

  return (
    <NamespaceQueueParentExistsLink
      cluster={namespaceQueue.cluster}
      namespace={parentRef.namespace}
      name={parentRef.name}
      label={parent}
    />
  );
}

/**
 * Links to a parent NamespaceQueue once it is known to exist.
 *
 * A NamespaceQueue parent always lives in the child's namespace, so the lookup is scoped to that
 * namespace. This keeps it working with namespace-scoped RBAC, where a cluster-wide list is
 * forbidden. Requests for the same namespace are shared between rows.
 */
function NamespaceQueueParentExistsLink({
  cluster,
  namespace,
  name,
  label,
}: {
  cluster?: string;
  namespace: string;
  name: string;
  label: string;
}) {
  const [namespaceQueues] = VolcanoNamespaceQueue.useList({ cluster, namespace });

  if (!hasNamespaceQueue(namespaceQueues, namespace, name)) {
    return <>{label}</>;
  }

  return (
    <Link routeName={volcanoRouteNames.namespaceQueueDetail} params={{ namespace, name }}>
      {label}
    </Link>
  );
}
