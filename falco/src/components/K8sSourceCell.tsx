import { Link } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import React from 'react';
import { FalcoEvent } from '../types/FalcoEvent';
import { getK8sSource, isValidK8sName, singularizeKind } from '../utils/falcoEventUtils';

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

  if (validKind && validName && validNs) {
    const singularKind = singularizeKind(kind);

    if (kind.toLowerCase() === 'pod') {
      return (
        <Link
          routeName="pod"
          params={{ namespace, name }}
          style={{ textDecoration: 'underline', color: '#1976d2', cursor: 'pointer' }}
        >{`${kind}/${name}`}</Link>
      );
    }

    if (kind.toLowerCase() === 'namespace') {
      return (
        <Link
          routeName="namespace"
          params={{ name }}
          style={{ textDecoration: 'underline', color: '#1976d2', cursor: 'pointer' }}
        >{`${kind}/${name}`}</Link>
      );
    }

    return (
      <Link
        routeName={singularKind}
        params={{ namespace, name }}
        style={{ textDecoration: 'underline', color: '#1976d2', cursor: 'pointer' }}
      >{`${kind}/${name}`}</Link>
    );
  }

  return <>{validKind && name ? `${kind}/${name}` : name || 'N/A'}</>;
};

export default K8sSourceCell;
