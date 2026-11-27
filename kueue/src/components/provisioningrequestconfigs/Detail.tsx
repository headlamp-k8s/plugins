import { DetailsGrid } from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { ProvisioningRequestConfig } from '../../resources/provisioningRequestConfig';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function ProvisioningRequestConfigDetail(props: {
  name?: string;
  cluster?: string;
}) {
  const params = useParams<{ name: string }>();
  const { name = params.name, cluster } = props;

  return (
    <KueueAdminResourceAccess
      resourceClass={ProvisioningRequestConfig}
      resourceLabel="ProvisioningRequestConfigs"
      verb="get"
      cluster={cluster}
    >
      <DetailsGrid
        resourceType={ProvisioningRequestConfig}
        name={name}
        cluster={cluster}
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
