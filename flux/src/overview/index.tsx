import { Icon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  Link,
  NameValueTable,
  SectionBox,
  StatusLabel,
  TileChart,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { KubeObject } from '@kinvolk/headlamp-plugin/lib/lib/k8s/cluster';
import { Accordion, AccordionDetails, AccordionSummary, Box } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import React, { useEffect } from 'react';
import SourceLink from '../common/Link';
import Table from '../common/Table';
import { helmReleaseClass } from '../helm-releases/HelmReleaseList';
import { useFluxCheck } from '../helpers';
import {
  imagePolicyClass,
  imageRepositoriesClass,
  imageUpdateAutomationClass,
} from '../image-automation/ImageAutomationList';
import { kustomizationClass } from '../kustomizations/KustomizationList';
import { providerNotificationClass } from '../notifications/NotificationList';
import { alertNotificationClass } from '../notifications/NotificationList';
import { receiverNotificationClass } from '../notifications/NotificationList';
import {
  bucketRepositoryClass,
  gitRepositoryClass,
  helmChartClass,
  helmRepositoryClass,
  ociRepositoryClass,
} from '../sources/SourceList';

export function FluxOverview() {
  const kustomizationResourceClass = kustomizationClass();
  const helmReleaseResourceClass = helmReleaseClass();
  const gitRepoResourceClass = gitRepositoryClass();
  const ociRepoResourceClass = ociRepositoryClass();
  const bucketRepoResourceClass = bucketRepositoryClass();
  const helmRepoResourceClass = helmRepositoryClass();
  const helmChartResourceClass = helmChartClass();
  const alertsResourceClass = alertNotificationClass();
  const providersResourceClass = providerNotificationClass();
  const receiversResourceClass = receiverNotificationClass();

  const imageUpdateAutomationResourceClass = imageUpdateAutomationClass();
  const imagePolicyResourceClass = imagePolicyClass();
  const imageRepositoryResourceClass = imageRepositoriesClass();

  const fluxCheck = useFluxCheck();

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

    return helmController?.concat(
      kustomizeController,
      notificationController,
      sourceController,
      imageReflectorController,
      imageAutomationController
    );
  }, [pods]);

  return (
    <>
      <SectionBox title="Flux Overview">
        <Box
          display="flex"
          justifyContent="space-between"
          sx={{
            flexWrap: 'wrap',
          }}
        >
          <Box width="300px" m={2}>
            {kustomizationResourceClass && (
              <FluxOverviewChart resourceClass={kustomizationResourceClass} />
            )}
          </Box>
          <Box width="300px" m={2}>
            {helmReleaseResourceClass && (
              <FluxOverviewChart resourceClass={helmReleaseResourceClass} />
            )}
          </Box>
          <Box width="300px" m={2}>
            {gitRepoResourceClass && <FluxOverviewChart resourceClass={gitRepoResourceClass} />}
          </Box>
          <Box width="300px" m={2}>
            {ociRepoResourceClass && <FluxOverviewChart resourceClass={ociRepoResourceClass} />}
          </Box>
          <Box width="300px" m={2}>
            {bucketRepoResourceClass && (
              <FluxOverviewChart resourceClass={bucketRepoResourceClass} />
            )}
          </Box>
          <Box width="300px" m={2}>
            {helmRepoResourceClass && <FluxOverviewChart resourceClass={helmRepoResourceClass} />}
          </Box>
          <Box width="300px" m={2}>
            {helmChartResourceClass && <FluxOverviewChart resourceClass={helmChartResourceClass} />}
          </Box>
          <Box width="300px" m={2}>
            {alertsResourceClass && <FluxOverviewChart resourceClass={alertsResourceClass} />}
          </Box>
          <Box width="300px" m={2}>
            {providersResourceClass && <FluxOverviewChart resourceClass={providersResourceClass} />}
          </Box>
          <Box width="300px" m={2}>
            {receiversResourceClass && <FluxOverviewChart resourceClass={receiversResourceClass} />}
          </Box>
          <Box width="300px" m={2}>
            {imageRepositoryResourceClass && (
              <FluxOverviewChart resourceClass={imageRepositoryResourceClass} />
            )}
          </Box>
          <Box width="300px" m={2}>
            {imagePolicyResourceClass && (
              <FluxOverviewChart resourceClass={imagePolicyResourceClass} />
            )}
          </Box>
          <Box width="300px" m={2}>
            {imageUpdateAutomationResourceClass && (
              <FluxOverviewChart resourceClass={imageUpdateAutomationResourceClass} />
            )}
          </Box>
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
                  <Box display="flex" aligItems="center">
                    <Box mt={0.2} mr={0.1}>
                      <Icon icon="mdi:check" width={16} height={16} />
                    </Box>
                    Boostrapped
                  </Box>{' '}
                </StatusLabel>
              ) : (
                <StatusLabel status="error">
                  <Box display="flex" aligItems="center">
                    <Box mt={0.2} mr={0.1}>
                      <Icon icon="mdi:close" width={16} height={16} />
                    </Box>{' '}
                    Not Bootstrapped
                  </Box>
                </StatusLabel>
              )}
              {fluxCheck.distribution && (
                <StatusLabel status="success">
                  <Box display="flex" aligItems="center">
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
                    <Box display="flex" aligItems="center">
                      <Box mt={0.2} mr={0.1}>
                        <Icon icon="mdi:check" width={16} height={16} />
                      </Box>
                      All Controllers Ready
                    </Box>{' '}
                  </StatusLabel>
                ) : (
                  <StatusLabel status="warning">
                    <Box display="flex" aligItems="center">
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
                  <Box display="flex" aligItems="center">
                    <Box mt={0.2} mr={0.1}>
                      <Icon icon="mdi:check" width={16} height={16} />
                    </Box>
                    All Checks Passed
                  </Box>{' '}
                </StatusLabel>
              ) : (
                <StatusLabel status="warning">
                  <Box display="flex" aligItems="center">
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

function FluxOverviewChart({ resourceClass }) {
  const [crds] = resourceClass.useList();
  const theme = useTheme();

  function prepareLink(name) {
    switch (name) {
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

    for (const resource of customResources) {
      if (!resource.jsonData.status) {
        success++;
      } else if (resource.jsonData.spec?.suspend) {
        suspended++;
      } else if (
        resource.jsonData.status.conditions?.some(
          condition => condition.type === 'Ready' && condition.status === 'True'
        )
      ) {
        success++;
      } else {
        failed++;
      }
    }

    return [success, failed, suspended];
  }

  function makeData() {
    if (crds) {
      const total = crds.length;
      const [success, failed, suspended] = getStatus(crds);

      // Calculate actual percentages
      // Use Math.round to ensure whole numbers
      const successPercent = total > 0 ? Math.round((success / total) * 100) : 0;
      const failedPercent = total > 0 ? Math.round((failed / total) * 100) : 0;
      const suspendedPercent = total > 0 ? Math.round((suspended / total) * 100) : 0;

      // Ensure percentages add up to 100%
      let adjustedSuccessPercent = successPercent;
      let adjustedFailedPercent = failedPercent;
      let adjustedSuspendedPercent = suspendedPercent;

      const sum = successPercent + failedPercent + suspendedPercent;
      if (sum !== 100 && total > 0) {
        const diff = 100 - sum;
        // Add the difference to the largest segment
        if (successPercent >= failedPercent && successPercent >= suspendedPercent) {
          adjustedSuccessPercent += diff;
        } else if (failedPercent >= successPercent && failedPercent >= suspendedPercent) {
          adjustedFailedPercent += diff;
        } else {
          adjustedSuspendedPercent += diff;
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
          fill: '#DC7501',
        },
        {
          name: 'suspended',
          value: adjustedSuspendedPercent,
          fill: '#FDE100',
        },
      ];
    }
    return [];
  }

  function makeLegend() {
    if (crds) {
      const total = crds.length;
      const [success, failed, suspended] = getStatus(crds);

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
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Box>
                {suspended}/{total} suspended
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
