import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { WorkloadPriorityClass } from '../../resources/workloadPriorityClass';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function WorkloadPriorityClassList() {
  return (
    <KueueAdminResourceAccess
      resourceClass={WorkloadPriorityClass}
      resourceLabel="WorkloadPriorityClasses"
      verb="list"
    >
      <ResourceListView
        title="Kueue WorkloadPriorityClasses"
        resourceClass={WorkloadPriorityClass}
        columns={[
          'name',
          {
            id: 'value',
            label: 'Value',
            getValue: (item: WorkloadPriorityClass) => item.value,
            gridTemplate: 'min-content',
          },
          {
            id: 'description',
            label: 'Description',
            getValue: (item: WorkloadPriorityClass) => item.description,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
