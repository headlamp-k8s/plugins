import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Workload } from '../../resources/workload';
import { renderPodSetsSummary, renderWorkloadStatus } from '../../resources/workloadFormatters';

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
          label: 'Queue',
          getValue: (workload: Workload) => workload.queueName,
        },
        {
          id: 'clusterQueue',
          label: 'ClusterQueue',
          getValue: (workload: Workload) => workload.clusterQueueName,
        },
        {
          id: 'priority',
          label: 'Priority',
          getValue: (workload: Workload) => workload.priority,
        },
        {
          id: 'podSets',
          label: 'Pod Sets',
          getValue: (workload: Workload) => renderPodSetsSummary(workload.podSets),
        },
        {
          id: 'status',
          label: 'Status',
          getValue: (workload: Workload) => renderWorkloadStatus(workload.conditions),
        },
        'age',
      ]}
    />
  );
}
