import {
  ConditionsSection,
  DetailsGrid,
  Loader,
  NameValueTable,
  SectionBox,
  StatusLabel as NStatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/k8s/KubeObject';
import { Box } from '@mui/material';
import React from 'react';
import { useDispatch } from 'react-redux';
import { useLocation, useParams } from 'react-router-dom';
import { CLOUD_PROVIDERS, getAWSConfig } from '../common/cloudProviders';
import { EditConfigButton } from '../common/EditConfigButton';
import { DiffEditorDialog } from '../common/resourceEditor';
import { StatusLabel } from '../common/StatusLabel';
import { createNodeClassClass } from '../helpers/createNodeClassClass';
import { handleShowDiff } from '../helpers/handleDiff';
import { getHandleSaveHelper } from '../helpers/handleSave';
import { useCloudProviderDetection } from '../hook/useCloudProviderDetection';

export function NodeClassDetailView(props: { name?: string }) {
  const params = useParams<{ name: string }>();
  const { name = params.name } = props;
  const [currentResource, setCurrentResource] = React.useState<KubeObject | null>(null);
  const [originalYaml, setOriginalYaml] = React.useState('');
  const [modifiedYaml, setModifiedYaml] = React.useState('');
  const [isEditorOpen, setIsEditorOpen] = React.useState(false);
  const location = useLocation();
  const dispatch = useDispatch();

  const { cloudProvider, loading, error } = useCloudProviderDetection();

  const getHandleSave = React.useCallback(() => {
    if (!currentResource) {
      return () => console.error('No resource available for saving');
    }

    return getHandleSaveHelper({
      dispatch,
      currentResource,
      cancelUrl: location.pathname,
      closeDialog: () => setIsEditorOpen(false),
    });
  }, [currentResource, dispatch, location.pathname]);

  if (loading) {
    return <Loader title="" />;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!cloudProvider) {
    return <div>No supported NodeClass found</div>;
  }

  // Use the same logic as NodeClass List to get the correct config
  let config;
  if (typeof cloudProvider === 'object' && cloudProvider.provider === 'AWS') {
    // New structure with deployment type - use dynamic configuration
    config = getAWSConfig(cloudProvider.deploymentType);
  } else if (cloudProvider === 'AWS' || cloudProvider?.provider === 'AWS') {
    // Fallback for old structure - use SELF_INSTALLED as default
    config = getAWSConfig('SELF_INSTALLED');
  } else {
    // Other providers (Azure, etc.)
    const providerName = typeof cloudProvider === 'object' ? cloudProvider.provider : cloudProvider;
    config = CLOUD_PROVIDERS[providerName] || getAWSConfig('SELF_INSTALLED'); // fallback to AWS SELF_INSTALLED config
  }

  // Ensure config has all required properties
  if (!config || !config.columns) {
    return <div>Configuration error</div>;
  }
  const NodeClass = createNodeClassClass(config);

  const actions = () => {
    return (item: KubeObject) =>
      item
        ? [
            {
              id: 'Nodeclass-config-editor',
              action: (
                <>
                  <EditConfigButton
                    resource={item}
                    handleClick={() =>
                      handleShowDiff(
                        item,
                        setCurrentResource,
                        setOriginalYaml,
                        setModifiedYaml,
                        setIsEditorOpen
                      )
                    }
                  />
                  {isEditorOpen && currentResource && (
                    <DiffEditorDialog
                      open={isEditorOpen}
                      onClose={() => setIsEditorOpen(false)}
                      originalYaml={originalYaml}
                      modifiedYaml={modifiedYaml}
                      onSave={getHandleSave()}
                      resource={currentResource}
                      cloudProvider={cloudProvider}
                    />
                  )}
                </>
              ),
            },
          ]
        : [];
  };

  const getExtraInfo = (item: KubeObject) => {
    if (!item) return [];

    const commonInfo = [
      {
        name: 'Status',
        value: <StatusLabel item={item} />,
      },
    ];

    if (cloudProvider === 'AWS') {
      return [
        ...commonInfo,
        {
          name: 'IAM Role',
          value: item.jsonData.spec?.role || '-',
        },
        {
          name: 'Instance Profile',
          value: item.jsonData.status?.instanceProfile || '-',
        },
        {
          name: 'AMI Family',
          value: item.jsonData.spec?.amiFamily || '-',
        },
      ];
    } else if (cloudProvider === 'AZURE') {
      return [
        ...commonInfo,
        {
          name: 'Image Family',
          value: item.jsonData.spec?.imageFamily || '-',
        },
        {
          name: 'Max Pods',
          value: item.jsonData.spec?.maxPods || '-',
        },
        {
          name: 'OS Disk Size (GB)',
          value: item.jsonData.spec?.osDiskSizeGB || '-',
        },
      ];
    }

    return commonInfo;
  };

  const getExtraSections = (item: KubeObject) => {
    if (!item) return [];

    const commonSections = [
      {
        id: 'conditions',
        section: <ConditionsSection resource={item.jsonData} />,
      },
    ];

    if (cloudProvider === 'AWS') {
      return [
        {
          id: 'nodeclass-config',
          section: (
            <SectionBox title="NodeClass Configuration">
              <NameValueTable
                rows={[
                  {
                    name: 'Subnet Selectors',
                    value: renderSelectorTerms(item.jsonData.spec?.subnetSelectorTerms),
                  },
                  {
                    name: 'Security Group Selectors',
                    value: renderSelectorTerms(item.jsonData.spec?.securityGroupSelectorTerms),
                  },
                ]}
              />
            </SectionBox>
          ),
        },
        {
          id: 'status',
          section: (
            <SectionBox title="Status">
              <NameValueTable
                rows={[
                  {
                    name: 'Security Group IDs',
                    value: renderStatusItems(item.jsonData.status?.securityGroups?.map(g => g.id)),
                  },
                  {
                    name: 'Subnet IDs',
                    value: renderStatusItems(item.jsonData.status?.subnets?.map(s => s.id)),
                  },
                  {
                    name: 'Availability Zones',
                    value: renderStatusItems(item.jsonData.status?.subnets?.map(s => s.zone)),
                  },
                ]}
              />
            </SectionBox>
          ),
        },
        ...commonSections,
      ];
    } else if (cloudProvider === 'AZURE') {
      return [
        {
          id: 'nodeclass-config',
          section: (
            <SectionBox title="NodeClass Configuration">
              <NameValueTable
                rows={[
                  {
                    name: 'Image Family',
                    value: item.jsonData.spec?.imageFamily || '-',
                  },
                  {
                    name: 'OS Disk Size (GB)',
                    value: item.jsonData.spec?.osDiskSizeGB || '-',
                  },
                  {
                    name: 'Max Pods',
                    value: item.jsonData.spec?.maxPods || '-',
                  },
                  {
                    name: 'Tags',
                    value: renderAzureTags(item.jsonData.spec?.tags),
                  },
                ]}
              />
            </SectionBox>
          ),
        },
        {
          id: 'status',
          section: (
            <SectionBox title="Status">
              <NameValueTable
                rows={[
                  {
                    name: 'Kubernetes Version',
                    value: item.jsonData.status?.kubernetesVersion || '-',
                  },
                  {
                    name: 'Available Images',
                    value: `${item.jsonData.status?.images?.length || 0} image(s) available`,
                  },
                ]}
              />
            </SectionBox>
          ),
        },
        {
          id: 'images-detail',
          section: (
            <SectionBox title="Available Images">
              {item.jsonData.status?.images && item.jsonData.status.images.length > 0 ? (
                <NameValueTable
                  rows={item.jsonData.status.images.map((image, index) => ({
                    name: `Image ${index + 1}`,
                    value: (
                      <Box>
                        <Box sx={{ mb: 1, fontFamily: 'monospace', fontSize: '0.875rem' }}>
                          {image.id ? image.id.split('/').pop() : 'Unknown'}
                        </Box>
                        {image.requirements && image.requirements.length > 0 && (
                          <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
                            {image.requirements.map((req, reqIndex) => (
                              <NStatusLabel key={reqIndex} status="" sx={{ fontSize: '0.75rem' }}>
                                {req.key.replace('karpenter.azure.com/', '')}:{' '}
                                {req.values?.join(', ') || req.operator}
                              </NStatusLabel>
                            ))}
                          </Box>
                        )}
                      </Box>
                    ),
                  }))}
                />
              ) : (
                <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                  No images available
                </Box>
              )}
            </SectionBox>
          ),
        },
        ...commonSections,
      ];
    }

    return commonSections;
  };

  return (
    <DetailsGrid
      resourceType={NodeClass}
      name={name}
      withEvents
      actions={actions()}
      extraInfo={getExtraInfo}
      extraSections={getExtraSections}
    />
  );
}

function renderStatusItems(items: string[] = []) {
  if (!items || items.length === 0) return '-';

  return (
    <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {items.map((item, index) => (
        <NStatusLabel key={index} status="">
          {item}
        </NStatusLabel>
      ))}
    </Box>
  );
}

function renderSelectorTerms(terms: any[] = []) {
  if (!terms || terms.length === 0) return '-';

  return (
    <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {terms.flatMap(term =>
        Object.entries(term.tags || {}).map(([key, value]) => (
          <NStatusLabel key={`${key}=${value}`} status="">
            {`${key}=${value}`}
          </NStatusLabel>
        ))
      )}
    </Box>
  );
}

function renderAzureTags(tags: Record<string, string> = {}) {
  if (!tags || Object.keys(tags).length === 0) return '-';

  return (
    <Box sx={{ display: 'flex', gap: '4px', flexWrap: 'wrap' }}>
      {Object.entries(tags).map(([key, value]) => (
        <NStatusLabel key={`${key}=${value}`} status="">
          {`${key}=${value}`}
        </NStatusLabel>
      ))}
    </Box>
  );
}
