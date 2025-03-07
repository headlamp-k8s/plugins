import { ClusterTriggerAuthentication } from '../../resources/clusterTriggerAuthentication';
import { BaseKedaAuthenticationList } from '../common/CommonComponents';

export function ClusterTriggerAuthenticationsList() {
  return (
    <BaseKedaAuthenticationList
      title="ClusterTriggerAuthentications"
      resourceType={ClusterTriggerAuthentication}
    />
  );
}
