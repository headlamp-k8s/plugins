import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeadmControlPlane } from '../../resources/kubeadmcontrolplane';

export function KubeadmControlPlanesList() {
  return (
    <ResourceListView
      title="Kubeadm Control Planes"
      resourceClass={KubeadmControlPlane}
      columns={[
        'name',
        'namespace',
        {
          id: 'cluster',
          label: 'Cluster',
          getValue: kcp => kcp.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
        },
        {
          id: 'initialized',
          label: 'Initialized',
          getValue: kcp => (kcp.status?.initialized ? 'true' : ''),
        },
        {
          id: 'apiserveravailable',
          label: 'API Server Available',
          getValue: kcp => (kcp.status?.ready ? 'true' : ''),
        },
        {
          id: 'replicas',
          label: 'Replicas',
          getValue: kcp => kcp.status?.replicas,
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: kcp => kcp.status?.readyReplicas,
        },
        {
          id: 'updated',
          label: 'Updated',
          getValue: kcp => kcp.status?.updatedReplicas,
        },
        {
          id: 'unavailable',
          label: 'Unavailable',
          getValue: kcp => kcp.status?.unavailableReplicas,
        },
        'age',
        {
          id: 'version',
          label: 'Version',
          getValue: kcp => kcp.status?.version,
        },
      ]}
    />
  );
}
