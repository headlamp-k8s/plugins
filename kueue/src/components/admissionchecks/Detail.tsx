import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { AdmissionCheck } from '../../resources/admissionCheck';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function AdmissionCheckDetail() {
  const { name } = useParams<{ name: string }>();

  return (
    <KueueAdminResourceAccess
      resourceClass={AdmissionCheck}
      resourceLabel="AdmissionChecks"
      verb="get"
    >
      <DetailsGrid
        resourceType={AdmissionCheck}
        name={name}
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
              ]
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}