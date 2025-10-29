import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Machine } from '../../resources/machine';

export function MachinesList() {
  return (
    <ResourceListView
      title="Machines"
      resourceClass={Machine}
      columns={[
        'name',
        'namespace',
        {
          id: 'cluster',
          label: 'Cluster',
          getValue: machine => machine.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
          render: machine => (
            <Link
              routeName="capicluster"
              params={{
                name: machine.metadata?.labels?.['cluster.x-k8s.io/cluster-name'],
                namespace: machine.metadata?.namespace,
              }}
            >
              {machine.metadata?.labels?.['cluster.x-k8s.io/cluster-name']}
            </Link>
          ),
        },
        {
          id: 'nodeName',
          label: 'Node Name',
          getValue: machine => machine.status?.nodeRef?.name,
        },
        {
          id: 'providerID',
          label: 'Provider ID',
          getValue: machine => machine.spec?.providerID,
        },
        {
          id: 'phase',
          label: 'Phase',
          getValue: machine => machine.status?.phase,
        },
        'age',
      ]}
    />
  );
}
