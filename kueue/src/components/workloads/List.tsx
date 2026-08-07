import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Workload } from '../../resources/workload';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function WorkloadList() {
  return (
    <KueueAdminResourceAccess
      resourceClass={Workload}
      resourceLabel="Workloads"
      verb="list"
    >
      <ResourceListView
        title="Kueue Workloads"
        resourceClass={Workload}
        columns={[
          'name',
          'namespace',
          {
            id: 'queueName',
            label: 'Queue Name',
            getValue: (workload: Workload) => workload.queueNameDisplay,
          },
          {
            id: 'priorityClassName',
            label: 'Priority Class Name',
            getValue: (workload: Workload) => workload.priorityClassNameDisplay,
          },
          {
            id: 'status',
            label: 'Status',
            getValue: (workload: Workload) => workload.statusDisplay,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
