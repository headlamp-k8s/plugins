import { useParams } from 'react-router-dom';
import { TriggerAuthentication } from '../../resources/triggerAuthentication';
import { BaseKedaAuthenticationDetail } from '../common/CommonComponents';

export function TriggerAuthenticationDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;
  
  return (
    <BaseKedaAuthenticationDetail 
      resourceType={TriggerAuthentication} 
      namespace={namespace} 
      name={name} 
    />
  );
}
