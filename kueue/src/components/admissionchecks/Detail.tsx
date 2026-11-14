import { ConditionsSection, DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { AdmissionCheck } from '../../resources/admissionCheck';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';
import {
  AdmissionCheckClusterQueuesSection,
  AdmissionCheckWorkloadsSection,
} from '../common/RelatedResources';

/** Build the standard Headlamp conditions section for AdmissionCheck status. */
function getConditionsSection(admissionCheck: AdmissionCheck) {
  if (!admissionCheck.conditions.length) {
    return null;
  }

  return {
    id: 'conditions',
    section: <ConditionsSection resource={admissionCheck.jsonData} />,
  };
}

export default function AdmissionCheckDetail(props: { name?: string; cluster?: string }) {
  const params = useParams<{ name: string }>();
  const { name = params.name, cluster } = props;

  return (
    <KueueAdminResourceAccess
      resourceClass={AdmissionCheck}
      resourceLabel="AdmissionChecks"
      verb="get"
      cluster={cluster}
    >
      <DetailsGrid
        resourceType={AdmissionCheck}
        name={name}
        cluster={cluster}
        withEvents
        extraInfo={admissionCheck =>
          admissionCheck
            ? [
                {
                  name: 'Controller',
                  value: admissionCheck.controllerName,
                },
                {
                  name: 'Parameters',
                  value: admissionCheck.parametersDisplay,
                },
                {
                  name: 'Status',
                  value: admissionCheck.statusDisplay,
                },
                {
                  name: 'Retry Delay (Minutes)',
                  value: admissionCheck.retryDelayMinutes,
                },
              ]
            : []
        }
        extraSections={admissionCheck =>
          admissionCheck
            ? [
                getConditionsSection(admissionCheck),
                {
                  id: 'admission-check-cluster-queues',
                  section: (
                    <AdmissionCheckClusterQueuesSection
                      checkName={admissionCheck.metadata.name}
                      cluster={admissionCheck.cluster}
                    />
                  ),
                },
                {
                  id: 'admission-check-workloads',
                  section: (
                    <AdmissionCheckWorkloadsSection
                      checkName={admissionCheck.metadata.name}
                      cluster={admissionCheck.cluster}
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
