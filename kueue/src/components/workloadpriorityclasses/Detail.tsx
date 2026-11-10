import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { WorkloadPriorityClass } from '../../resources/workloadPriorityClass';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';
import { RelatedWorkloadsByPriorityClassSection } from '../common/RelatedResources';

export default function WorkloadPriorityClassDetail() {
  const { name } = useParams<{ name: string }>();

  return (
    <KueueAdminResourceAccess
      resourceClass={WorkloadPriorityClass}
      resourceLabel="WorkloadPriorityClasses"
      verb="get"
    >
      <DetailsGrid
        resourceType={WorkloadPriorityClass}
        name={name}
        withEvents
        extraInfo={wpc =>
          wpc
            ? [
                {
                  name: 'Value',
                  value: wpc.valueDisplay,
                },
                {
                  name: 'Description',
                  value: wpc.descriptionDisplay,
                },
              ]
            : []
        }
        extraSections={wpc =>
          wpc
            ? [
                {
                  id: 'related-workloads',
                  section: (
                    <RelatedWorkloadsByPriorityClassSection priorityClassName={wpc.metadata.name} />
                  ),
                },
              ].filter(Boolean)
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
