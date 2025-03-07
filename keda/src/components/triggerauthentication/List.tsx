import { TriggerAuthentication } from '../../resources/triggerAuthentication';
import { BaseKedaAuthenticationList } from '../common/CommonComponents';

export function TriggerAuthenticationsList() {
  return (
    <BaseKedaAuthenticationList
      title="TriggerAuthentications"
      resourceType={TriggerAuthentication}
    />
  );
}
