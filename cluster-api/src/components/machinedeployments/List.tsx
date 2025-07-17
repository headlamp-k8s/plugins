import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { MachineDeployment } from '../../resources/machinedeployment';

export function MachineDeploymentsList() {
  return (
    <ResourceListView
      title="Machine Deployments"
      resourceClass={MachineDeployment}
      columns={[
        'name',
        'namespace',
        {
          id: 'cluster',
          label: 'Cluster',
          getValue: deployment => deployment.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
          render: deployment => (
            <Link
              routeName="capicluster"
              params={{
                name: deployment.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
                namespace: deployment.metadata?.namespace,
              }}
            >
              {deployment.metadata?.labels?.['cluster.x-k8s.io/cluster-name']}
            </Link>
          ),
        },
        {
          id: 'replicas',
          label: 'Replicas',
          getValue: deployment => deployment.status?.replicas,
        },
        {
          id: 'ready',
          label: 'Ready',
          getValue: deployment => deployment.status?.readyReplicas,
        },
        {
          id: 'updated',
          label: 'Updated',
          getValue: deployment => deployment.status?.updatedReplicas,
        },
        {
          id: 'unavailable',
          label: 'Unavailable',
          getValue: deployment => deployment.status?.unavailableReplicas,
        },
        {
          id: 'phase',
          label: 'Phase',
          getValue: deployment => deployment.status?.phase,
        },
        'age',
        {
          id: 'version',
          label: 'Version',
          getValue: deployment => deployment.spec?.template.spec.version || 'N/A',
        },
      ]}
    />
  );
}
