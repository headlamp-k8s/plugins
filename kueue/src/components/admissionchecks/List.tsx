import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { AdmissionCheck } from '../../resources/admissionCheck';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function AdmissionCheckList() {
  const { t } = useTranslation();

  return (
    <KueueAdminResourceAccess
      resourceClass={AdmissionCheck}
      resourceLabel={t('AdmissionChecks')}
      verb="list"
    >
      <ResourceListView
        title={t('Kueue AdmissionChecks')}
        resourceClass={AdmissionCheck}
        columns={[
          'name',
          {
            id: 'controllerName',
            label: t('Controller'),
            getValue: (admissionCheck: AdmissionCheck) => admissionCheck.controllerName,
          },
          {
            id: 'parameters',
            label: t('Parameters'),
            getValue: (admissionCheck: AdmissionCheck) => admissionCheck.parametersDisplay,
          },
          {
            id: 'retryDelayMinutes',
            label: t('Retry Delay (Minutes)'),
            getValue: (admissionCheck: AdmissionCheck) => admissionCheck.retryDelayMinutes,
          },
          {
            id: 'status',
            label: t('Status'),
            getValue: (admissionCheck: AdmissionCheck) => admissionCheck.statusDisplay,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
