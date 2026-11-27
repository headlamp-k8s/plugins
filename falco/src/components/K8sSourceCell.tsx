import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { FalcoEvent } from '../types/FalcoEvent';
import {
  getK8sSource,
  getRouteNameForKind,
  isClusterScopedRoute,
  isValidK8sName,
} from '../utils/falcoEventUtils';

interface K8sSourceCellProps {
  event: FalcoEvent;
}

/**
 * A component to display Kubernetes resource links in a table cell.
 */
const K8sSourceCell: React.FC<K8sSourceCellProps> = ({ event }) => {
  const { kind, name, namespace } = getK8sSource(event);
  const validKind = typeof kind === 'string' && !!kind && kind !== 'N/A';
  const validName = isValidK8sName(name);
  const validNs = isValidK8sName(namespace) || !namespace;
  const routeName = validKind ? getRouteNameForKind(kind) : null;

  if (validKind && validName && validNs && routeName) {
    const params = isClusterScopedRoute(routeName) ? { name } : { namespace, name };
    return (
      <Link
        routeName={routeName}
        params={params}
        style={{ textDecoration: 'underline', color: '#1976d2', cursor: 'pointer' }}
      >{`${kind}/${name}`}</Link>
    );
  }

  return <>{validKind && name ? `${kind}/${name}` : name || 'N/A'}</>;
};

export default K8sSourceCell;
