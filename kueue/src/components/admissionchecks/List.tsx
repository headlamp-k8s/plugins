import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { AdmissionCheck } from '../../resources/admissionCheck';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function AdmissionCheckList() {
  return (
    <KueueAdminResourceAccess
      resourceClass={AdmissionCheck}
      resourceLabel="AdmissionChecks"
      verb="list"
    >
      <ResourceListView
        title="Kueue AdmissionChecks"
        resourceClass={AdmissionCheck}
        columns={[
          'name',
          {
            id: 'controllerName',
            label: 'Controller',
            getValue: (admissionCheck: AdmissionCheck) => admissionCheck.controllerName,
          },
          {
            id: 'parameters',
            label: 'Parameters',
            getValue: (admissionCheck: AdmissionCheck) => admissionCheck.parametersDisplay,
          },
          {
            id: 'status',
            label: 'Status',
            getValue: (admissionCheck: AdmissionCheck) => admissionCheck.statusDisplay,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}