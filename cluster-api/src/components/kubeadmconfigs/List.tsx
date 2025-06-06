import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { KubeadmConfig } from '../../resources/kubeadmconfig';

export function KubeadmConfigsList() {
  return (
    <ResourceListView
      title="Kubeadm Configs"
      resourceClass={KubeadmConfig}
      columns={[
        'name',
        'namespace',
        {
          id: 'cluster',
          label: 'Cluster',
          getValue: kc => kc.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
        },
        'age',
      ]}
    />
  );
}
