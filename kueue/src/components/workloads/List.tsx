import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Workload } from '../../resources/workload';

export default function WorkloadList() {
  return (
    <ResourceListView
      title="Kueue Workloads"
        resourceClass={Workload}
        columns={[
          'name',
          'namespace',
          {
            id: 'queue',
            label: 'Queue',
            getValue: (workload: Workload) => workload.queueNameDisplay,
          },
          {
            id: 'priority',
            label: 'Priority',
            getValue: (workload: Workload) => workload.priorityDisplay,
          },
          {
            id: 'priorityClass',
            label: 'Priority Class',
            getValue: (workload: Workload) => workload.priorityClassDisplay,
          },
          {
            id: 'active',
            label: 'Active',
            getValue: (workload: Workload) => workload.activeDisplay,
          },
          {
            id: 'admitted',
            label: 'Admitted',
            getValue: (workload: Workload) => workload.admittedDisplay,
          },
          {
            id: 'finished',
            label: 'Finished',
            getValue: (workload: Workload) => workload.finishedDisplay,
          },
          {
            id: 'status',
            label: 'Status',
            getValue: (workload: Workload) => workload.statusDisplay,
          },
          'age',
        ]}
      />
  );
}
