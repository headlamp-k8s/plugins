import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useTranslation } from 'react-i18next';
import { WorkloadPriorityClass } from '../../resources/workloadPriorityClass';
import {
  renderWorkloadPriorityClassDescription,
  renderWorkloadPriorityClassValue,
} from '../../resources/workloadPriorityClassFormatters';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function WorkloadPriorityClassList() {
  const { t } = useTranslation('plugin');

  return (
    <KueueAdminResourceAccess resourceClass={WorkloadPriorityClass} resourceLabel="WorkloadPriorityClasses" verb="list">
      <ResourceListView
        title={t('Kueue WorkloadPriorityClasses')}
        resourceClass={WorkloadPriorityClass}
        columns={[
          'name',
          {
            id: 'value',
            label: t('Value'),
            getValue: (c: WorkloadPriorityClass) => c.value,
            render: (c: WorkloadPriorityClass) => renderWorkloadPriorityClassValue(c.value),
            sort: (c1: WorkloadPriorityClass, c2: WorkloadPriorityClass) => (c1.value ?? 0) - (c2.value ?? 0),
          },
          {
            id: 'description',
            label: t('Description'),
            getValue: (c: WorkloadPriorityClass) => c.description,
            render: (c: WorkloadPriorityClass) => renderWorkloadPriorityClassDescription(c.description),
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
