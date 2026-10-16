import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { ProvisioningRequestConfig } from '../../resources/provisioningRequestConfig';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

export default function ProvisioningRequestConfigList() {
  return (
    <KueueAdminResourceAccess
      resourceClass={ProvisioningRequestConfig}
      resourceLabel="ProvisioningRequestConfigs"
      verb="list"
    >
      <ResourceListView
        title="Kueue ProvisioningRequestConfigs"
        resourceClass={ProvisioningRequestConfig}
        columns={[
          'name',
          {
            id: 'provisioningClassName',
            label: 'Provisioning Class',
            getValue: (config: ProvisioningRequestConfig) => config.provisioningClassName,
          },
          {
            id: 'managedResources',
            label: 'Managed Resources',
            getValue: (config: ProvisioningRequestConfig) => config.managedResourcesDisplay,
          },
          {
            id: 'retryStrategy',
            label: 'Retry Strategy',
            getValue: (config: ProvisioningRequestConfig) => config.retryStrategyDisplay,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}