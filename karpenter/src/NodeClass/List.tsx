import { Loader, ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { CLOUD_PROVIDERS, getAWSConfig } from '../common/cloudProviders';
import { createNodeClassClass } from '../helpers/createNodeClassClass';
import { useCloudProviderDetection } from '../hook/useCloudProviderDetection';

export function NodeClasses() {
  const { cloudProvider, loading, error } = useCloudProviderDetection();

  if (loading) {
    return (
      <div style={{ padding: '20px' }}>
        <Loader title="Detecting Karpenter deployment type..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', background: '#ffebee', border: '1px solid #f44336' }}>
        <h3>Detection Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!cloudProvider) {
    return (
      <div style={{ padding: '20px', background: '#fff3e0', border: '1px solid #ff9800' }}>
        <h3>No NodeClass CRDs Found</h3>
        <p>No supported NodeClass Custom Resource Definitions were detected in this cluster.</p>
      </div>
    );
  }

  return <NodeClassesList cloudProvider={cloudProvider} />;
}

function NodeClassesList({ cloudProvider }) {
  let config;

  if (typeof cloudProvider === 'object' && cloudProvider.provider === 'AWS') {
    // EKS Auto Mode - use deployment-specific configuration
    config = getAWSConfig(cloudProvider.deploymentType);
  } else if (cloudProvider === 'AWS') {
    // Self-installed Karpenter - use default configuration
    config = CLOUD_PROVIDERS.AWS;
  } else {
    // Other cloud providers (Azure, etc.)
    config = CLOUD_PROVIDERS[cloudProvider];
  }

  // Ensure config has all required properties
  if (!config || !config.columns) {
    return (
      <div style={{ padding: '20px', background: '#ffebee', border: '1px solid #f44336' }}>
        <h3>Configuration Error</h3>
        <p>Unable to load configuration for cloud provider: {JSON.stringify(cloudProvider)}</p>
      </div>
    );
  }

  const NodeClassClass = createNodeClassClass(config);

  try {
    return (
      <ResourceListView
        title={config.displayName}
        resourceClass={NodeClassClass}
        columns={config.columns}
      />
    );
  } catch (error) {
    return (
      <div style={{ padding: '20px', background: '#ffebee', border: '1px solid #f44336' }}>
        <h3>ResourceListView Error</h3>
        <p>
          <strong>Error:</strong> {error.message}
        </p>
      </div>
    );
  }
}

export function awsNodeClassClass(cloudProvider = null) {
  let config;

  if (cloudProvider && typeof cloudProvider === 'object' && cloudProvider.provider === 'AWS') {
    // EKS Auto Mode - use deployment-specific configuration
    config = getAWSConfig(cloudProvider.deploymentType);
  } else {
    // Self-installed Karpenter - use default configuration for backward compatibility
    config = getAWSConfig('SELF_INSTALLED');
  }

  return createNodeClassClass(config);
}

export function azureNodeClassClass() {
  const config = CLOUD_PROVIDERS.AZURE;
  return createNodeClassClass(config);
}
