import { Loader, ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { CLOUD_PROVIDERS, getAWSConfig } from '../common/cloudProviders';
import { createNodeClassClass } from '../helpers/createNodeClassClass';
import { useCloudProviderDetection } from '../hook/useCloudProviderDetection';

export function NodeClasses() {
  const { cloudProvider, loading, error } = useCloudProviderDetection();

  if (loading) {
    return <Loader title="" />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!cloudProvider) {
    return <div>No supported NodeClass found</div>;
  }

  return <NodeClassesList cloudProvider={cloudProvider} />;
}

function NodeClassesList({ cloudProvider }) {
  let config;
  
  if (typeof cloudProvider === 'object' && cloudProvider.provider === 'AWS') {
    // New structure with deployment type - use dynamic configuration
    config = getAWSConfig(cloudProvider.deploymentType);
  } else if (cloudProvider === 'AWS' || cloudProvider?.provider === 'AWS') {
    // Fallback for old structure
    config = CLOUD_PROVIDERS.AWS;
  } else {
    // Other providers (Azure, etc.)
    const providerName = typeof cloudProvider === 'object' ? cloudProvider.provider : cloudProvider;
    config = CLOUD_PROVIDERS[providerName] || CLOUD_PROVIDERS.AWS; // fallback to AWS config
  }

  // Ensure config has all required properties
  if (!config || !config.columns) {
    console.error('Invalid config for cloud provider:', cloudProvider);
    return <div>Error: Invalid configuration for cloud provider</div>;
  }

  const NodeClassClass = createNodeClassClass(config);

  return (
    <ResourceListView
      title={config.displayName}
      resourceClass={NodeClassClass}
      columns={config.columns}
    />
  );
}

export function awsNodeClassClass() {
  // Use the AWS config - this will work for both deployment types
  // since the helper functions are mainly used for map view and other utilities
  const config = CLOUD_PROVIDERS.AWS;
  return createNodeClassClass(config);
}

export function azureNodeClassClass() {
  const config = CLOUD_PROVIDERS.AZURE;
  return createNodeClassClass(config);
}
