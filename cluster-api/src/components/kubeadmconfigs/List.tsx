import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
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
          render: kc => (
            <Link
              routeName="capicluster"
              params={{
                name: kc.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
                namespace: kc.metadata?.namespace,
              }}
            >
              {kc.metadata?.labels?.['cluster.x-k8s.io/cluster-name']}
            </Link>
          ),
        },
        'age',
      ]}
    />
  );
}
