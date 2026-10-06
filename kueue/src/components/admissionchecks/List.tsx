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
      accessDescription={t('Kueue AdmissionChecks are cluster-scoped admission policy resources.')}
    >
      <ResourceListView
        title={t('AdmissionChecks')}
        resourceClass={AdmissionCheck}
        columns={[
          'name',
          {
            id: 'controllerName',
            label: t('Controller Name'),
            getValue: (admissionCheck: AdmissionCheck) => admissionCheck.controllerNameDisplay,
          },
          {
            id: 'retryDelay',
            label: t('Retry Delay'),
            getValue: (admissionCheck: AdmissionCheck) => admissionCheck.retryDelayDisplay,
          },
          {
            id: 'parameters',
            label: t('Parameters'),
            getValue: (admissionCheck: AdmissionCheck) => admissionCheck.parametersDisplay,
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
