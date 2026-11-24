import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { WorkloadPriorityClass } from '../../resources/workloadPriorityClass';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';
import { RelatedWorkloadsByPriorityClassSection } from '../common/RelatedResources';

export default function WorkloadPriorityClassDetail(props: { name?: string; cluster?: string }) {
  const params = useParams<{ name: string }>();
  const { name = params.name, cluster } = props;

  return (
    <KueueAdminResourceAccess
      resourceClass={WorkloadPriorityClass}
      resourceLabel="WorkloadPriorityClasses"
      verb="get"
      cluster={cluster}
    >
      <DetailsGrid
        resourceType={WorkloadPriorityClass}
        name={name}
        cluster={cluster}
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
                    <RelatedWorkloadsByPriorityClassSection
                      priorityClassName={wpc.metadata.name}
                      cluster={wpc.cluster}
                    />
                  ),
                },
              ].filter(Boolean)
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
