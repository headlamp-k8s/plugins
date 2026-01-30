import { Icon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  Link,
  NameValueTable,
  SectionBox,
  StatusLabel,
  TileChart,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import type { KubeObject, KubeObjectClass } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import SourceLink from '../common/Link';
import {
  AlertNotification,
  BucketRepository,
  ExternalArtifact,
  GitRepository,
  HelmChart,
  HelmRelease,
  HelmRepository,
  ImagePolicy,
  ImageRepository,
  ImageUpdateAutomation,
  Kustomization,
  OCIRepository,
  ProviderNotification,
  ReceiverNotification,
} from '../common/Resources';
import Table from '../common/Table';
import { useFluxCheck } from '../helpers';

// Helper to get failed count for a resource class
function getFailedCount(items: KubeObject[] | null) {
  if (items === null) return 0;
  // getStatus is defined inside FluxOverviewChart, so redefine here
  let failed = 0;
  for (const resource of items) {
    if (!resource.jsonData.status) {
      continue;
    } else if (resource.jsonData.spec?.suspend) {
      continue;
    } else if (Array.isArray(resource.jsonData.status.conditions)) {
      if (
        !resource.jsonData.status.conditions.some(
          condition => condition.type === 'Ready' && condition.status === 'True'
        )
      ) {
        failed++;
      }
    }
  }
  return failed;
}

// Helper to get success count for a resource class
function getSuccessCount(items: KubeObject[] | null) {
  if (items === null) return 0;

  let success = 0;
  for (const resource of items) {
    if (!resource.jsonData.status) {
      success++;
    } else if (resource.jsonData.spec?.suspend) {
      continue;
    } else if (Array.isArray(resource.jsonData.status.conditions)) {
      if (
        resource.jsonData.status.conditions.some(
          condition => condition.type === 'Ready' && condition.status === 'True'
        )
      ) {
        success++;
      }
    }
  }
  return success;
}

// Helper to get display name for a resource class
function getDisplayName(resourceClass: KubeObjectClass) {
  const nameMap = {
    gitrepositories: 'Git Repositories',
    ocirepositories: 'OCI Repositories',
    buckets: 'Buckets',
    helmrepositories: 'Helm Repositories',
    helmcharts: 'Helm Charts',
    kustomizations: 'Kustomizations',
    helmreleases: 'Helm Releases',
    alerts: 'Alerts',
    providers: 'Providers',
    receivers: 'Receivers',
    imagerepositories: 'Image Repositories',
    imageupdateautomations: 'Image Update Automations',
    imagepolicies: 'Image Policies',
    externalartifacts: 'External Artifacts',
  };
  return nameMap[resourceClass.apiName] || resourceClass.apiName;
}

export function FluxOverview() {
  const [sortFilter, setSortFilter] = useState('failed');
  const fluxCheck = useFluxCheck();
  const namespace = fluxCheck.namespace;

  const [kustomizations] = Kustomization.useList({ namespace });
  const [helmReleases] = HelmRelease.useList({ namespace });
  const [gitRepos] = GitRepository.useList({ namespace });
  const [ociRepos] = OCIRepository.useList({ namespace });
  const [buckets] = BucketRepository.useList({ namespace });
  const [helmRepos] = HelmRepository.useList({ namespace });
  const [externalArtifacts] = ExternalArtifact.useList({ namespace });
  const [helmCharts] = HelmChart.useList({ namespace });
  const [alerts] = AlertNotification.useList({ namespace });
  const [providerNotifications] = ProviderNotification.useList({ namespace });
  const [receiverNotifications] = ReceiverNotification.useList({ namespace });
  const [imageUpdateAutomations] = ImageUpdateAutomation.useList({ namespace });
  const [imagePolicies] = ImagePolicy.useList({ namespace });
  const [imageRepositories] = ImageRepository.useList({ namespace });

  const [pods] = K8s.ResourceClasses.Pod.useList({
    namespace: fluxCheck.namespace,
  });

  const controllers = React.useMemo(() => {
    const helmController = pods?.filter(pod => pod.metadata.labels?.['app'] === 'helm-controller');
    const kustomizeController = pods?.filter(
      pod => pod.metadata.labels?.['app'] === 'kustomize-controller'
    );
    const notificationController = pods?.filter(
      pod => pod.metadata.labels?.['app'] === 'notification-controller'
    );
    const sourceController = pods?.filter(
      pod => pod.metadata.labels?.['app'] === 'source-controller'
    );
    const imageReflectorController = pods?.filter(
      pod => pod.metadata.labels?.['app'] === 'image-reflector-controller'
    );
    const imageAutomationController = pods?.filter(
      pod => pod.metadata.labels?.['app'] === 'image-automation-controller'
    );
    const sourceWatcher = pods?.filter(pod => pod.metadata.labels?.['app'] === 'source-watcher');

    return helmController?.concat(
      kustomizeController,
      notificationController,
      sourceController,
      imageReflectorController,
      imageAutomationController,
      sourceWatcher
    );
  }, [pods]);

  // Sort resource classes based on selected filter
  const sortedResourceClasses = React.useMemo(() => {
    const itemsWithClass = [
      { rc: Kustomization, items: kustomizations },
      { rc: HelmRelease, items: helmReleases },
      { rc: GitRepository, items: gitRepos },
      { rc: OCIRepository, items: ociRepos },
      { rc: BucketRepository, items: buckets },
      { rc: HelmRepository, items: helmRepos },
      { rc: ExternalArtifact, items: externalArtifacts },
      { rc: HelmChart, items: helmCharts },
      { rc: AlertNotification, items: alerts },
      { rc: ProviderNotification, items: providerNotifications },
      { rc: ReceiverNotification, items: receiverNotifications },
      { rc: ImageRepository, items: imageRepositories },
      { rc: ImagePolicy, items: imagePolicies },
      { rc: ImageUpdateAutomation, items: imageUpdateAutomations },
    ];

    const resourceData = itemsWithClass.map(({ rc, items }) => ({
      rc,
      failed: getFailedCount(items),
      total: items?.length ?? 0,
      success: getSuccessCount(items),
      name: getDisplayName(rc),
    }));

    switch (sortFilter) {
      case 'failed':
        return resourceData.sort((a, b) => b.failed - a.failed).map(obj => obj.rc);
      case 'failed-asc':
        return resourceData.sort((a, b) => a.failed - b.failed).map(obj => obj.rc);
      case 'total':
        return resourceData.sort((a, b) => b.total - a.total).map(obj => obj.rc);
      case 'total-asc':
        return resourceData.sort((a, b) => a.total - b.total).map(obj => obj.rc);
      case 'success':
        return resourceData.sort((a, b) => b.success - a.success).map(obj => obj.rc);
      case 'success-asc':
        return resourceData.sort((a, b) => a.success - b.success).map(obj => obj.rc);
      case 'alphabetical':
        return resourceData.sort((a, b) => a.name.localeCompare(b.name)).map(obj => obj.rc);
      case 'alphabetical-desc':
        return resourceData.sort((a, b) => b.name.localeCompare(a.name)).map(obj => obj.rc);
      default:
        return resourceData.sort((a, b) => b.failed - a.failed).map(obj => obj.rc);
    }
  }, [
    kustomizations,
    helmReleases,
    gitRepos,
    ociRepos,
    buckets,
    helmRepos,
    helmCharts,
    alerts,
    providerNotifications,
    receiverNotifications,
    imageRepositories,
    imagePolicies,
    imageUpdateAutomations,
    sortFilter,
  ]);

  const handleSortFilterChange = event => {
    setSortFilter(event.target.value);
  };

  return (
    <>
      <SectionBox
        title={
          <Box display="flex" alignItems="center" mt={2}>
            <Box mr={2} ml={4}>
              <h3>Flux Overview</h3>
            </Box>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Sort By</InputLabel>
              <Select value={sortFilter} label="Sort By" onChange={handleSortFilterChange}>
                <MenuItem value="failed">Most Failed First</MenuItem>
                <MenuItem value="failed-asc">Least Failed First</MenuItem>
                <MenuItem value="total">Most Total Resources</MenuItem>
                <MenuItem value="total-asc">Least Total Resources</MenuItem>
                <MenuItem value="success">Most Successful</MenuItem>
                <MenuItem value="success-asc">Least Successful</MenuItem>
                <MenuItem value="alphabetical">Alphabetical A-Z</MenuItem>
                <MenuItem value="alphabetical-desc">Alphabetical Z-A</MenuItem>
              </Select>
            </FormControl>
          </Box>
        }
      >
        <Box display="flex" justifyContent="space-between" sx={{ flexWrap: 'wrap' }}>
          {sortedResourceClasses.map((resourceClass, idx) => (
            <Box width="300px" m={2} key={resourceClass.apiName || idx}>
              <FluxOverviewChart resourceClass={resourceClass} />
            </Box>
          ))}
        </Box>
      </SectionBox>
      <SectionBox title="Flux Checks">
        <Accordion>
          <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
            <Box p={1} sx={{ display: 'flex', alignItems: 'center' }} gap={1}>
              <Box>Version Information</Box>
              <Box>
                <StatusLabel status={!!fluxCheck.version ? 'success' : 'warning'}>
                  {fluxCheck.version || 'Unknown'}
                </StatusLabel>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box p={2} display="flex" gap={2}>
              {fluxCheck.isBoostrapped ? (
                <StatusLabel status="success">
                  <Box display="flex" alignItems="center">
                    <Box mt={0.2} mr={0.1}>
                      <Icon icon="mdi:check" width={16} height={16} />
                    </Box>
                    Bootstrapped
                  </Box>{' '}
                </StatusLabel>
              ) : (
                <StatusLabel status="error">
                  <Box display="flex" alignItems="center">
                    <Box mt={0.2} mr={0.1}>
                      <Icon icon="mdi:close" width={16} height={16} />
                    </Box>{' '}
                    Not Bootstrapped
                  </Box>
                </StatusLabel>
              )}
              {fluxCheck.distribution && (
                <StatusLabel status="success">
                  <Box display="flex" alignItems="center">
                    <Box mt={0.2} mr={0.1}>
                      <Icon icon="mdi:check" width={16} height={16} />
                    </Box>
                    Distribution: {fluxCheck.distribution}
                  </Box>{' '}
                </StatusLabel>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
            <Box p={1}>
              <Box>Controllers</Box>
              {/* show status whether all controllers are ready or not */}
              {controllers?.length > 0 &&
                (controllers?.every(controller => controller.status?.phase === 'Running') ? (
                  <StatusLabel status="success">
                    <Box display="flex" alignItems="center">
                      <Box mt={0.2} mr={0.1}>
                        <Icon icon="mdi:check" width={16} height={16} />
                      </Box>
                      All Controllers Ready
                    </Box>{' '}
                  </StatusLabel>
                ) : (
                  <StatusLabel status="warning">
                    <Box display="flex" alignItems="center">
                      <Box mt={0.2} mr={0.1}>
                        <Icon icon="mdi:close" width={16} height={16} />
                      </Box>{' '}
                      Some Controllers Are Not Ready
                    </Box>
                  </StatusLabel>
                ))}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box p={2}>
              <Controllers controllers={controllers} />
            </Box>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
            <Box p={1}>
              <Box>CRDs</Box>
              {/* see if all crds check passed */}
              {fluxCheck.allCrdsSuccessful ? (
                <StatusLabel status="success">
                  <Box display="flex" alignItems="center">
                    <Box mt={0.2} mr={0.1}>
                      <Icon icon="mdi:check" width={16} height={16} />
                    </Box>
                    All Checks Passed
                  </Box>{' '}
                </StatusLabel>
              ) : (
                <StatusLabel status="warning">
                  <Box display="flex" alignItems="center">
                    <Box mt={0.2} mr={0.1}>
                      <Icon icon="mdi:close" width={16} height={16} />
                    </Box>{' '}
                    Some CRDs Are Not Ready
                  </Box>
                </StatusLabel>
              )}
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box p={2}>
              <CRDs />
            </Box>
          </AccordionDetails>
        </Accordion>
      </SectionBox>
    </>
  );
}

declare module '@mui/material/styles' {
  interface Palette {
    chartStyles: {
      defaultFillColor: string;
      fillColor: string;
      labelColor: string;
    };
  }
  interface PaletteOptions {
    chartStyles?: {
      defaultFillColor?: string;
      fillColor?: string;
      labelColor?: string;
    };
  }
}

function FluxOverviewChart({ resourceClass }) {
  const [crds] = resourceClass.useList();
  const theme = useTheme();

  function prepareLink(name) {
    switch (name) {
      case 'externalartifacts': // fallthrough
      case 'gitrepositories':
        return '/flux/sources';
      case 'ocirepositories':
        return '/flux/sources';
      case 'buckets':
        return '/flux/sources';
      case 'helmrepositories':
        return '/flux/sources';
      case 'helmcharts':
        return '/flux/sources';
      case 'kustomizations':
        return '/flux/kustomizations';
      case 'helmreleases':
        return '/flux/helmreleases';
      case 'alerts':
        return '/flux/notifications';
      case 'providers':
        return '/flux/notifications';
      case 'receivers':
        return '/flux/notifications';
      case 'imagerepositories':
        return '/flux/image-automations';
      case 'imageupdateautomations':
        return '/flux/image-automations';
      case 'imagepolicies':
        return '/flux/image-automations';
    }

    return '';
  }

  function prepareName(name) {
    switch (name) {
      case 'externalartifacts':
        return 'External Artifacts';
      case 'gitrepositories':
        return 'Git Repositories';
      case 'ocirepositories':
        return 'OCI Repositories';
      case 'buckets':
        return 'Buckets';
      case 'helmrepositories':
        return 'Helm Repositories';
      case 'helmcharts':
        return 'Helm Charts';
      case 'kustomizations':
        return 'Kustomizations';
      case 'helmreleases':
        return 'Helm Releases';
      case 'alerts':
        return 'Alerts';
      case 'providers':
        return 'Providers';
      case 'receivers':
        return 'Receivers';
      case 'imagerepositories':
        return 'Image Repositories';
      case 'imageupdateautomations':
        return 'Image Update Automations';
      case 'imagepolicies':
        return 'Image Policies';
    }

    return '';
  }

  function getStatus(customResources: KubeObject[]) {
    let success: number = 0;
    let failed: number = 0;
    let suspended: number = 0;
    let processing: number = 0;

    for (const resource of customResources) {
      // If no status at all, treat as success (original logic)
      if (!resource.jsonData.status) {
        success++;
      } else if (resource.jsonData.spec?.suspend) {
        suspended++;
      } else if (Array.isArray(resource.jsonData.status.conditions)) {
        if (
          resource.jsonData.status.conditions.some(
            condition => condition.type === 'Ready' && condition.status === 'True'
          )
        ) {
          success++;
        } else {
          failed++;
        }
      } else {
        // status exists but no conditions array: treat as processing
        processing++;
      }
    }

    return [success, failed, suspended, processing];
  }

  function makeData() {
    if (crds) {
      const total = crds.length;
      const [success, failed, suspended, processing] = getStatus(crds);

      // Calculate actual percentages
      const successPercent = total > 0 ? Math.round((success / total) * 100) : 0;
      const failedPercent = total > 0 ? Math.round((failed / total) * 100) : 0;
      const suspendedPercent = total > 0 ? Math.round((suspended / total) * 100) : 0;
      const processingPercent = total > 0 ? Math.round((processing / total) * 100) : 0;

      // Ensure percentages add up to 100%
      let adjustedSuccessPercent = successPercent;
      let adjustedFailedPercent = failedPercent;
      let adjustedSuspendedPercent = suspendedPercent;
      let adjustedProcessingPercent = processingPercent;

      const sum = successPercent + failedPercent + suspendedPercent + processingPercent;
      if (sum !== 100 && total > 0) {
        const diff = 100 - sum;
        // Add the difference to the largest segment
        const max = Math.max(successPercent, failedPercent, suspendedPercent, processingPercent);
        if (max === successPercent) {
          adjustedSuccessPercent += diff;
        } else if (max === failedPercent) {
          adjustedFailedPercent += diff;
        } else if (max === suspendedPercent) {
          adjustedSuspendedPercent += diff;
        } else {
          adjustedProcessingPercent += diff;
        }
      }

      return [
        {
          name: 'success',
          value: adjustedSuccessPercent,
          fill: theme.palette.chartStyles.fillColor,
        },
        {
          name: 'failed',
          value: adjustedFailedPercent,
          fill: theme.palette.error.main,
        },
        {
          name: 'suspended',
          value: adjustedSuspendedPercent,
          fill: '#FDE100',
        },
        {
          name: 'processing',
          value: adjustedProcessingPercent,
          fill: '#2196F3',
        },
      ];
    }
    return [];
  }

  function makeLegend() {
    if (crds) {
      const total = crds.length;
      const [success, failed, suspended, processing] = getStatus(crds);

      return (
        <Box>
          <Box>
            <Link routeName={prepareLink(resourceClass.apiName)}>
              {prepareName(resourceClass.apiName)}
            </Link>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box>
                {success}/{total} running
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box>
                {failed}/{total} failed
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box>
                {suspended}/{total} suspended
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box>
                {processing}/{total} processing
              </Box>
            </Box>
          </Box>
        </Box>
      );
    }

    return null;
  }

  function getLabel() {
    if (crds) {
      const total = crds.length;
      if (total === 0) return '0%';

      const [success] = getStatus(crds);

      const percentage = Math.round((success / total) * 100);

      return `${percentage}%`;
    }
    return '0%';
  }

  return (
    <Box sx={{ position: 'relative' }}>
      <TileChart data={makeData()} total={100} label={getLabel()} legend={makeLegend()} />
    </Box>
  );
}

function Controllers({ controllers }) {
  return (
    <Table
      data={controllers}
      columns={[
        {
          extends: 'name',
          routeName: 'pod',
        },
        {
          header: 'Namespace',
          accessorKey: 'metadata.namespace',
          Cell: ({ row: { original: item } }) => (
            <Link routeName="namespace" params={{ name: item.metadata.namespace }}>
              {item.metadata.namespace}
            </Link>
          ),
        },
        {
          header: 'Status',
          accessorFn: item => item?.status.phase,
        },
        {
          header: 'Image',
          accessorFn: item => <SourceLink url={item.spec.containers[0].image} />,
        },
      ]}
    />
  );
}

function CRDs() {
  const [crds] = K8s.ResourceClasses.CustomResourceDefinition.useList();
  const [fluxCrds, setFluxCrds] = React.useState([]);
  useEffect(() => {
    if (crds) setFluxCrds(crds?.filter(crd => crd.metadata.name.includes('fluxcd.')));
  }, [crds]);

  const rows = React.useMemo(() => {
    return fluxCrds.map(crd => {
      return {
        name: (
          <Link routeName={'crd'} params={{ name: crd.metadata.name }}>
            {crd.metadata.name}
          </Link>
        ),
        value: crd?.status?.storedVersions.join(', '),
      };
    });
  }, [fluxCrds]);
  return (
    <>
      <NameValueTable rows={rows} />
    </>
  );
}
