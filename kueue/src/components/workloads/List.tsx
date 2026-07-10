import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Workload } from '../../resources/workload';
import { kueueRouteNames } from '../../utils/kueueRoutes';

function getWorkloadStatusSeverity(status: string): 'success' | 'warning' | 'error' | 'info' | '' {
  if (status === 'Admitted' || status === 'Finished') {
    return 'success';
  }
  if (status.startsWith('Evicted')) {
    return 'warning';
  }
  if (status === 'Pending') {
    return 'info';
  }
  return '';
}

export default function WorkloadList() {
  return (
    <ResourceListView
      title="Workloads"
      resourceClass={Workload}
      columns={[
        'name',
        'namespace',
        {
          id: 'queueName',
          label: 'LocalQueue',
          getValue: (wl: Workload) => wl.queueName,
          render: (wl: Workload) => (
            wl.queueName && wl.queueName !== '-' ? (
              <Link
                routeName={kueueRouteNames.localQueueDetail}
                params={{ name: wl.queueName, namespace: wl.metadata.namespace }}
              >
                {wl.queueName}
              </Link>
            ) : (
              '-'
            )
          ),
        },
        {
          id: 'priority',
          label: 'Priority',
          getValue: (wl: Workload) => wl.priority,
        },
        {
          id: 'priorityClassName',
          label: 'Priority Class',
          getValue: (wl: Workload) => wl.priorityClassName,
        },
        {
          id: 'status',
          label: 'Status',
          getValue: (wl: Workload) => wl.statusMessage,
          render: (wl: Workload) => (
            <StatusLabel status={getWorkloadStatusSeverity(wl.statusMessage)}>
              {wl.statusMessage}
            </StatusLabel>
          ),
        },
        {
          id: 'active',
          label: 'Active',
          getValue: (wl: Workload) => (wl.isActive ? 'Yes' : 'No'),
          render: (wl: Workload) => (
            <StatusLabel status={wl.isActive ? 'success' : 'error'}>
              {wl.isActive ? 'Yes' : 'No'}
            </StatusLabel>
          ),
        },
        'age',
      ]}
    />
  );
}
