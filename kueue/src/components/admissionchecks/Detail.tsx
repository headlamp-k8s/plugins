import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ConditionsSection } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { AdmissionCheck } from '../../resources/admissionCheck';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function AdmissionCheckDetail() {
  const { t } = useTranslation();
  const { name } = useParams<{ name: string }>();

  return (
    <KueueAdminResourceAccess
      resourceClass={AdmissionCheck}
      resourceLabel={t('AdmissionChecks')}
      verb="get"
      accessDescription={t('Kueue AdmissionChecks are cluster-scoped admission policy resources.')}
    >
      <DetailsGrid
        resourceType={AdmissionCheck}
        name={name}
        withEvents
        extraInfo={item =>
          item
            ? [
                {
                  name: t('Controller Name'),
                  value: item.controllerNameDisplay,
                },
                {
                  name: t('Retry Delay'),
                  value: item.retryDelayDisplay,
                },
                {
                  name: t('Parameters Reference'),
                  value: item.parametersDisplay,
                },
                {
                  name: t('Status'),
                  value: item.statusDisplay,
                },
              ]
            : []
        }
        extraSections={item =>
          item
            ? [
                <ConditionsSection key="conditions" resource={item?.jsonData} />,
              ]
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
