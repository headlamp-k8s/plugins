import { Icon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
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
  Typography,
} from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect, useState } from 'react';
import SourceLink from '../common/Link';
import {
  AlertNotification,
  BucketRepository,
  ExternalArtifact,
  FluxReport,
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
  Terraform,
} from '../common/Resources';
import Table from '../common/Table';
import { useFluxCheck } from '../helpers';
import { store } from '../settings';

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
    terraforms: 'Terraforms',
  };
  return nameMap[resourceClass.apiName] || resourceClass.apiName;
}

interface FluxHealthStatus {
  healthy: boolean;
  details: string[];
}

function useFluxHealth(
  controllers: KubeObject[] | null,
  allResources: { name: string; items: KubeObject[] | null }[],
  namespace: string | undefined
): FluxHealthStatus {
  const [reports] = FluxReport.useList({ namespace });

  return React.useMemo(() => {
    const details: string[] = [];
    let healthy = true;
    const hasReport = reports && reports.length > 0;

    // Compute from whatever resource lists have loaded so far.
    for (const { name, items } of allResources) {
      if (!items) {
        continue;
      }
      const failed = getFailedCount(items);
      if (failed > 0) {
        healthy = false;
        details.push(`${name}: ${failed} failing`);
      }
    }

    // Enrich with FluxReport signals when available.
    if (hasReport) {
      const report = reports[0];

      const syncReady = report.jsonData?.spec?.sync?.ready;
      if (syncReady === false) {
        healthy = false;
        details.push('Cluster sync is not ready');
      }
    }

    // Check controller pod status.
    if (controllers && controllers.length > 0) {
      const notRunning = controllers.filter(c => c.jsonData?.status?.phase !== 'Running');
      if (notRunning.length > 0) {
        healthy = false;
        details.push(`${notRunning.length} controller(s) not running`);
      }
    }

    return { healthy, details };
  }, [reports, controllers, allResources]);
}

function FluxHealthBanner({
  controllers,
  allResources,
  namespace,
}: {
  controllers: KubeObject[] | null;
  allResources: { name: string; items: KubeObject[] | null }[];
  namespace: string | undefined;
}) {
  const health = useFluxHealth(controllers, allResources, namespace);

  // Don't show the banner if no Flux resources exist at all.
  const totalResources = allResources.reduce((sum, r) => sum + (r.items?.length ?? 0), 0);
  if (totalResources === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 2 }}>
      {health.healthy ? (
        <StatusLabel status="success">
          <Box display="flex" alignItems="center" gap={0.5}>
            <Icon icon="mdi:check-circle" width={18} height={18} />
            All reconcilers healthy
          </Box>
        </StatusLabel>
      ) : (
        <StatusLabel status="error">
          <Box display="flex" alignItems="center" gap={0.5}>
            <Icon icon="mdi:alert-circle" width={18} height={18} />
            {health.details.join(' | ')}
          </Box>
        </StatusLabel>
      )}
    </Box>
  );
}

export function FluxOverview() {
  const [sortFilter, setSortFilter] = useState(() => store.get()?.overviewSortFilter ?? 'failed');
  const [showFilter, setShowFilter] = useState(
    () => store.get()?.overviewShowFilter ?? 'configured'
  );
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
  const [terraforms] = Terraform.useList({ namespace });

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

  const allResources = React.useMemo(
    () => [
      { name: 'Kustomizations', items: kustomizations },
      { name: 'Helm Releases', items: helmReleases },
      { name: 'Git Repositories', items: gitRepos },
      { name: 'OCI Repositories', items: ociRepos },
      { name: 'Buckets', items: buckets },
      { name: 'Helm Repositories', items: helmRepos },
      { name: 'External Artifacts', items: externalArtifacts },
      { name: 'Helm Charts', items: helmCharts },
      { name: 'Alerts', items: alerts },
      { name: 'Providers', items: providerNotifications },
      { name: 'Receivers', items: receiverNotifications },
      { name: 'Image Repositories', items: imageRepositories },
      { name: 'Image Policies', items: imagePolicies },
      { name: 'Image Update Automations', items: imageUpdateAutomations },
    ],
    [
      kustomizations,
      helmReleases,
      gitRepos,
      ociRepos,
      buckets,
      helmRepos,
      externalArtifacts,
      helmCharts,
      alerts,
      providerNotifications,
      receiverNotifications,
      imageRepositories,
      imagePolicies,
      imageUpdateAutomations,
    ]
  );

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
      { rc: Terraform, items: terraforms },
    ];

    let resourceData = itemsWithClass.map(({ rc, items }) => {
      if (!Array.isArray(items)) {
        return { rc, failed: 0, total: 0, success: 0, name: getDisplayName(rc) };
      }
      return {
        rc,
        failed: getFailedCount(items),
        total: items.length,
        success: getSuccessCount(items),
        name: getDisplayName(rc),
      };
    });

    if (showFilter === 'configured') {
      resourceData = resourceData.filter(({ total }) => total > 0);
    }

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
    externalArtifacts,
    helmCharts,
    alerts,
    providerNotifications,
    receiverNotifications,
    imageRepositories,
    imagePolicies,
    imageUpdateAutomations,
    terraforms,
    sortFilter,
    showFilter,
  ]);

  const handleSortFilterChange = event => {
    const value = event.target.value;
    setSortFilter(value);
    store.set({ ...store.get(), overviewSortFilter: value });
  };

  const handleShowFilterChange = event => {
    const value = event.target.value;
    setShowFilter(value);
    store.set({ ...store.get(), overviewShowFilter: value });
  };

  // Only show the empty state once the CRD check has resolved; otherwise
  // we'd briefly render "Flux is not installed" on clusters where it is.
  if (fluxCheck.isFluxCheckLoaded && !fluxCheck.hasFluxCRDs) {
    return (
      <SectionBox title="Flux Overview">
        <Box p={3} display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Icon icon="simple-icons:flux" width={48} height={48} />
          <Typography variant="h6">Flux is not installed</Typography>
          <Typography variant="body2" color="text.secondary">
            Flux is a set of continuous delivery solutions for Kubernetes.{' '}
            <a
              href="https://fluxcd.io/flux/installation/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Learn how to install Flux
            </a>
          </Typography>
        </Box>
      </SectionBox>
    );
  }

  return (
    <>
      <SectionBox
        title="Flux Overview"
        headerProps={{
          actions: [
            <FormControl size="small" sx={{ minWidth: 200, mr: 1 }} key="sort">
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
            </FormControl>,
            <FormControl size="small" sx={{ minWidth: 200, mr: 1 }} key="show">
              <InputLabel>Show</InputLabel>
              <Select value={showFilter} label="Show" onChange={handleShowFilterChange}>
                <MenuItem value="configured">Configured Only</MenuItem>
                <MenuItem value="all">All Resources</MenuItem>
              </Select>
            </FormControl>,
            <ActionButton
              key="settings"
              description="Flux Settings"
              icon="mdi:cog"
              onClick={() => {
                window.location.href = '/settings/plugins/@headlamp-k8s%2Fflux';
              }}
            />,
          ],
        }}
      >
        <FluxHealthBanner
          controllers={controllers}
          allResources={allResources}
          namespace={namespace}
        />
        <Box display="flex" sx={{ flexWrap: 'wrap' }}>
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
      case 'terraforms':
        return '/flux/terraforms';
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
      case 'terraforms':
        return 'Terraforms';
    }

    return '';
  }

  function getStatus(customResources: KubeObject[]) {
    let success: number = 0;
    let failed: number = 0;
    let suspended: number = 0;
    let processing: number = 0;

    for (const resource of customResources) {
      const status = resource.jsonData.status;

      // If no status at all, treat as success (original logic)
      if (!status) {
        success++;
      } else if (resource.jsonData.spec?.suspend) {
        suspended++;
      } else if (Array.isArray(status.conditions)) {
        const readyCondition = status.conditions.find(condition => condition.type === 'Ready');

        if (readyCondition?.status === 'True') {
          success++;
        } else if (
          !readyCondition ||
          readyCondition.status === 'Unknown' ||
          ['DependencyNotReady', 'Progressing', 'ReconciliationInProgress'].includes(
            readyCondition.reason ?? ''
          )
        ) {
          processing++;
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
      const successPercent = total > 0 ? Math.round((success / total) * 100) : 100;
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
