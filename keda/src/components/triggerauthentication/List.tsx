import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { TriggerAuthentication } from '../../resources/triggerAuthentication';
import { BaseKedaAuthenticationList } from '../common/CommonComponents';

export function TriggerAuthenticationsList() {
  const { t } = useTranslation();

  return (
    <BaseKedaAuthenticationList
      title={t('TriggerAuthentications')}
      resourceType={TriggerAuthentication}
    />
  );
}
