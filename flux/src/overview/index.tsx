import { Icon } from '@iconify/react';
import { K8s, Router, useTranslation, Utils } from '@kinvolk/headlamp-plugin/lib';
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
import { useHistory } from 'react-router-dom';
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
  const { t } = useTranslation();

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
        details.push(t('{{name}}: {{count}} failing', { name: t(name), count: failed }));
      }
    }

    // Enrich with FluxReport signals when available.
    if (hasReport) {
      const report = reports[0];

      const syncReady = report.jsonData?.spec?.sync?.ready;
      if (syncReady === false) {
        healthy = false;
        details.push(t('Cluster sync is not ready'));
      }
    }

    // Check controller deployment readiness.
    if (controllers && controllers.length > 0) {
      const notReady = controllers.filter(c => {
        const desired = c.jsonData?.spec?.replicas ?? 1;
        const ready = c.jsonData?.status?.readyReplicas ?? 0;
        return ready !== desired;
      });
      if (notReady.length > 0) {
        healthy = false;
        details.push(t('{{count}} controller(s) not ready', { count: notReady.length }));
      }
    }

    return { healthy, details };
  }, [reports, controllers, allResources, t]);
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
  const { t } = useTranslation();

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
            {t('All reconcilers healthy')}
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
  const history = useHistory();
  const { t } = useTranslation();
  const [sortFilter, setSortFilter] = useState(() => store.get()?.overviewSortFilter ?? 'failed');
  const [showFilter, setShowFilter] = useState(
    () => store.get()?.overviewShowFilter ?? 'configured'
  );
  const fluxCheck = useFluxCheck();
  const namespace = fluxCheck.namespace || 'flux-system';

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

  const [deployments] = K8s.ResourceClasses.Deployment.useList({ namespace });

  const controllers = React.useMemo(() => {
    return (
      deployments?.filter(
        deploy =>
          deploy.metadata.name.includes('controller') || deploy.metadata.name.includes('watcher')
      ) ?? null
    );
  }, [deployments]);

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
        return { rc, failed: 0, total: 0, success: 0, name: t(getDisplayName(rc)) };
      }
      return {
        rc,
        failed: getFailedCount(items),
        total: items.length,
        success: getSuccessCount(items),
        name: t(getDisplayName(rc)),
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
    t,
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
      <SectionBox title={t('Flux Overview')}>
        <Box p={3} display="flex" flexDirection="column" alignItems="center" gap={2}>
          <Icon icon="simple-icons:flux" width={48} height={48} />
          <Typography variant="h6">{t('Flux is not installed')}</Typography>
          <Typography variant="body2" color="text.secondary">
            {t('Flux is a set of continuous delivery solutions for Kubernetes.')}{' '}
            <a
              href="https://fluxcd.io/flux/installation/"
              target="_blank"
              rel="noopener noreferrer"
            >
              {t('Learn how to install Flux')}
            </a>
          </Typography>
        </Box>
      </SectionBox>
    );
  }

  return (
    <>
      <SectionBox
        title={t('Flux Overview')}
        headerProps={{
          actions: [
            <FormControl size="small" sx={{ minWidth: 200, mr: 1 }} key="sort">
              <InputLabel>{t('Sort By')}</InputLabel>
              <Select value={sortFilter} label={t('Sort By')} onChange={handleSortFilterChange}>
                <MenuItem value="failed">{t('Most Failed First')}</MenuItem>
                <MenuItem value="failed-asc">{t('Least Failed First')}</MenuItem>
                <MenuItem value="total">{t('Most Total Resources')}</MenuItem>
                <MenuItem value="total-asc">{t('Least Total Resources')}</MenuItem>
                <MenuItem value="success">{t('Most Successful')}</MenuItem>
                <MenuItem value="success-asc">{t('Least Successful')}</MenuItem>
                <MenuItem value="alphabetical">{t('Alphabetical A-Z')}</MenuItem>
                <MenuItem value="alphabetical-desc">{t('Alphabetical Z-A')}</MenuItem>
              </Select>
            </FormControl>,
            <FormControl size="small" sx={{ minWidth: 200, mr: 1 }} key="show">
              <InputLabel>{t('Show')}</InputLabel>
              <Select value={showFilter} label={t('Show')} onChange={handleShowFilterChange}>
                <MenuItem value="configured">{t('Configured Only')}</MenuItem>
                <MenuItem value="all">{t('All Resources')}</MenuItem>
              </Select>
            </FormControl>,
            <ActionButton
              key="settings"
              description={t('Flux Settings')}
              icon="mdi:cog"
              onClick={() => {
                const settingsUrl = Router.createRouteURL('pluginSettings', {
                  pluginName: '@headlamp-k8s/flux',
                });
                history.push(settingsUrl);
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
      <SectionBox title={t('Flux Checks')}>
        <Accordion>
          <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
            <Box p={1} sx={{ display: 'flex', alignItems: 'center' }} gap={1}>
              <Box>{t('Version Information')}</Box>
              <Box>
                <StatusLabel status={!!fluxCheck.version ? 'success' : 'warning'}>
                  {fluxCheck.version || t('Unknown')}
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
                    {t('Bootstrapped')}
                  </Box>{' '}
                </StatusLabel>
              ) : (
                <StatusLabel status="error">
                  <Box display="flex" alignItems="center">
                    <Box mt={0.2} mr={0.1}>
                      <Icon icon="mdi:close" width={16} height={16} />
                    </Box>{' '}
                    {t('Not Bootstrapped')}
                  </Box>
                </StatusLabel>
              )}
              {fluxCheck.distribution && (
                <StatusLabel status="success">
                  <Box display="flex" alignItems="center">
                    <Box mt={0.2} mr={0.1}>
                      <Icon icon="mdi:check" width={16} height={16} />
                    </Box>
                    {t('Distribution: {{distribution}}', { distribution: fluxCheck.distribution })}
                  </Box>{' '}
                </StatusLabel>
              )}
            </Box>
          </AccordionDetails>
        </Accordion>
        <Accordion>
          <AccordionSummary expandIcon={<Icon icon="mdi:chevron-down" />}>
            <Box p={1}>
              <Box>{t('Controllers')}</Box>
              {controllers?.length > 0 &&
                (controllers?.every(controller => {
                  const desired = controller.jsonData?.spec?.replicas ?? 1;
                  const ready = controller.jsonData?.status?.readyReplicas ?? 0;
                  return ready === desired;
                }) ? (
                  <StatusLabel status="success">
                    <Box display="flex" alignItems="center">
                      <Box mt={0.2} mr={0.1}>
                        <Icon icon="mdi:check" width={16} height={16} />
                      </Box>
                      {t('All Controllers Ready')}
                    </Box>{' '}
                  </StatusLabel>
                ) : (
                  <StatusLabel status="warning">
                    <Box display="flex" alignItems="center">
                      <Box mt={0.2} mr={0.1}>
                        <Icon icon="mdi:close" width={16} height={16} />
                      </Box>{' '}
                      {t('Some Controllers Are Not Ready')}
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
              <Box>{t('CRDs')}</Box>
              {fluxCheck.allCrdsSuccessful ? (
                <StatusLabel status="success">
                  <Box display="flex" alignItems="center">
                    <Box mt={0.2} mr={0.1}>
                      <Icon icon="mdi:check" width={16} height={16} />
                    </Box>
                    {t('All Checks Passed')}
                  </Box>{' '}
                </StatusLabel>
              ) : (
                <StatusLabel status="warning">
                  <Box display="flex" alignItems="center">
                    <Box mt={0.2} mr={0.1}>
                      <Icon icon="mdi:close" width={16} height={16} />
                    </Box>{' '}
                    {t('Some CRDs Are Not Ready')}
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

function FluxOverviewChart({ resourceClass }) {
  const [crds] = resourceClass.useList();
  const theme = useTheme();
  const { t } = useTranslation();

  function prepareLink(name) {
    switch (name) {
      case 'externalartifacts': // fallthrough
      case 'gitrepositories':
        return 'sources';
      case 'ocirepositories':
        return 'sources';
      case 'buckets':
        return 'sources';
      case 'helmrepositories':
        return 'sources';
      case 'helmcharts':
        return 'sources';
      case 'kustomizations':
        return 'kustomizations';
      case 'helmreleases':
        return 'helmreleases';
      case 'alerts':
        return 'notifications';
      case 'providers':
        return 'notifications';
      case 'receivers':
        return 'notifications';
      case 'imagerepositories':
        return 'image-automations';
      case 'imageupdateautomations':
        return 'image-automations';
      case 'imagepolicies':
        return 'image-automations';
      case 'terraforms':
        return 'terraforms';
    }

    return '';
  }

  function prepareName(name) {
    switch (name) {
      case 'externalartifacts':
        return t('External Artifacts');
      case 'gitrepositories':
        return t('Git Repositories');
      case 'ocirepositories':
        return t('OCI Repositories');
      case 'buckets':
        return t('Buckets');
      case 'helmrepositories':
        return t('Helm Repositories');
      case 'helmcharts':
        return t('Helm Charts');
      case 'kustomizations':
        return t('Kustomizations');
      case 'helmreleases':
        return t('Helm Releases');
      case 'alerts':
        return t('Alerts');
      case 'providers':
        return t('Providers');
      case 'receivers':
        return t('Receivers');
      case 'imagerepositories':
        return t('Image Repositories');
      case 'imageupdateautomations':
        return t('Image Update Automations');
      case 'imagepolicies':
        return t('Image Policies');
      case 'terraforms':
        return t('Terraforms');
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
            <Link routeName={prepareLink(resourceClass.apiName)} activeCluster={Utils.getCluster()}>
              {t(prepareName(resourceClass.apiName))}
            </Link>
          </Box>
          <Box sx={{ display: 'flex', flexDirection: 'column', mt: 1 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box>{t('{{success}}/{{total}} running', { success, total })}</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box>{t('{{failed}}/{{total}} failed', { failed, total })}</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
              <Box>{t('{{suspended}}/{{total}} suspended', { suspended, total })}</Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box>{t('{{processing}}/{{total}} processing', { processing, total })}</Box>
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
  const { t } = useTranslation();
  return (
    <Table
      data={controllers}
      columns={[
        {
          extends: 'name',
          routeName: 'deployment',
        },
        {
          header: t('Namespace'),
          accessorKey: 'metadata.namespace',
          Cell: ({ row: { original: item } }) => (
            <Link routeName="namespace" params={{ name: item.metadata.namespace }}>
              {item.metadata.namespace}
            </Link>
          ),
        },
        {
          header: t('Ready'),
          accessorFn: item => {
            const desired = item.jsonData?.spec?.replicas ?? 1;
            const ready = item.jsonData?.status?.readyReplicas ?? 0;
            return `${ready}/${desired}`;
          },
        },
        {
          header: t('Image'),
          accessorFn: item => (
            <SourceLink url={item.jsonData?.spec?.template?.spec?.containers?.[0]?.image} />
          ),
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
