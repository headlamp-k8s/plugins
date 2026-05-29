import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ClusterTriggerAuthentication } from '../../resources/clusterTriggerAuthentication';
import { BaseKedaAuthenticationList } from '../common/CommonComponents';

export function ClusterTriggerAuthenticationsList() {
  const { t } = useTranslation();

  return (
    <BaseKedaAuthenticationList
      title={t('ClusterTriggerAuthentications')}
      resourceType={ClusterTriggerAuthentication}
    />
  );
}
