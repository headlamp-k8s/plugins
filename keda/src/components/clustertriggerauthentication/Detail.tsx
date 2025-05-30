import { useParams } from 'react-router-dom';
import { ClusterTriggerAuthentication } from '../../resources/clusterTriggerAuthentication';
import { BaseKedaAuthenticationDetail } from '../common/CommonComponents';

export function ClusterTriggerAuthenticationDetail(props: { name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { name = params.name } = props;

  return (
    <BaseKedaAuthenticationDetail
      resourceType={ClusterTriggerAuthentication} 
      name={name}
    />
  );
}
