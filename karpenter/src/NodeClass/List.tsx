import { Loader, ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { CLOUD_PROVIDERS } from '../common/cloudProviders';
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
  const config = CLOUD_PROVIDERS[cloudProvider];
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
  const config = CLOUD_PROVIDERS.AWS;
  return createNodeClassClass(config);
}

export function azureNodeClassClass() {
  const config = CLOUD_PROVIDERS.AZURE;
  return createNodeClassClass(config);
}
