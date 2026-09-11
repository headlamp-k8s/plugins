import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import type { FilterState } from '@kinvolk/headlamp-plugin/lib/redux/filterSlice';
import { useSelector } from 'react-redux';
import { Workload } from '../../resources/workload';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function WorkloadList() {
  // Use 'type' import so it doesn't crash at runtime, and avoid 'any'
  const namespacesSet = useSelector((state: { filter: FilterState }) => state.filter.namespaces);
  const namespaces = [...namespacesSet];
  const namespace = namespaces.length === 1 ? namespaces[0] : undefined;

  return (
    <KueueAdminResourceAccess
      resourceClass={Workload}
      resourceLabel="Workloads"
      verb="list"
      namespace={namespace}
      accessDescription="Kueue Workloads are namespaced user workload resources."
    >
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
    </KueueAdminResourceAccess>
  );
}
