import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useParams } from 'react-router-dom';
import { ProvisioningRequestConfig } from '../../resources/provisioningRequestConfig';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function ProvisioningRequestConfigDetail() {
  const { name } = useParams<{ name: string }>();

  return (
    <KueueAdminResourceAccess
      resourceClass={ProvisioningRequestConfig}
      resourceLabel="ProvisioningRequestConfigs"
      verb="get"
    >
      <DetailsGrid
        resourceType={ProvisioningRequestConfig}
        name={name}
        withEvents
        extraInfo={config =>
          config
            ? [
                {
                  name: 'Provisioning Class',
                  value: config.provisioningClassName,
                },
                {
                  name: 'Managed Resources',
                  value: config.managedResourcesDisplay,
                },
                {
                  name: 'Retry Strategy',
                  value: config.retryStrategyDisplay,
                },
                {
                  name: 'Pod Set Merge Policy',
                  value: config.podSetMergePolicyDisplay,
                },
              ]
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}