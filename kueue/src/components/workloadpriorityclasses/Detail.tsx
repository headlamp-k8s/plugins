import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useTranslation } from 'react-i18next';
import { useParams } from 'react-router-dom';
import { WorkloadPriorityClass } from '../../resources/workloadPriorityClass';
import {
  renderWorkloadPriorityClassDescription,
  renderWorkloadPriorityClassValue,
} from '../../resources/workloadPriorityClassFormatters';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function WorkloadPriorityClassDetail() {
  const { name } = useParams<{ name: string }>();
  const { t } = useTranslation('plugin');

  return (
    <KueueAdminResourceAccess resourceClass={WorkloadPriorityClass} resourceLabel="WorkloadPriorityClass" verb="get">
      <DetailsGrid
        resourceType={WorkloadPriorityClass}
        name={name}
        extraInfo={item =>
          item && [
            {
              name: t('Value'),
              value: renderWorkloadPriorityClassValue(item.value),
            },
            {
              name: t('Description'),
              value: renderWorkloadPriorityClassDescription(item.description),
            },
          ]
        }
      />
    </KueueAdminResourceAccess>
  );
}
