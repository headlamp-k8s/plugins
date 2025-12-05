import { Icon } from '@iconify/react';
import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  ContainerInfo,
  ContainerInfoProps,
  DetailsGrid,
  LightTooltip,
  Link,
  NameValueTable,
  ResourceListView,
  SectionBox,
  SimpleTableProps,
  StatusLabel,
  StatusLabelProps,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Empty from '@kinvolk/headlamp-plugin/lib/components/common/EmptyContent';
import { ApiError } from '@kinvolk/headlamp-plugin/lib/k8s/api/v2/ApiError';
import { KubeContainer, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import Job from '@kinvolk/headlamp-plugin/lib/k8s/job';
import { KubePod } from '@kinvolk/headlamp-plugin/lib/k8s/pod';
import { formatDuration } from '@kinvolk/headlamp-plugin/lib/Utils';
import { Box, CircularProgress, Grid, Link as MuiLink, Typography } from '@mui/material';
import { Fragment, ReactNode } from 'react';
import { useKedaInstalled } from '../../hooks/useKedaInstalled';
import { AuthTargetRef } from '../../resources/authentication';
import { ClusterTriggerAuthentication } from '../../resources/clusterTriggerAuthentication';
import { KedaTriggerMetricType } from '../../resources/common';
import { ScaledJob } from '../../resources/scaledjob';
import { ScaledObject } from '../../resources/scaledobject';
import { TriggerAuthentication } from '../../resources/triggerAuthentication';

interface NotInstalledBannerProps {
  isLoading?: boolean;
}

export function NotInstalledBanner({ isLoading = false }: NotInstalledBannerProps) {
  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" p={2} minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box display="flex" justifyContent="center" alignItems="center" p={2} minHeight="200px">
      <Grid container spacing={2} direction="column" justifyContent="center" alignItems="center">
        <Grid item>
          <Typography variant="h5">
            KEDA was not detected on your cluster. If you haven't already, please install it.
          </Typography>
        </Grid>
        <Grid item>
          <Typography>
            Learn how to{' '}
            <MuiLink
              href="https://keda.sh/docs/latest/deploy"
              target="_blank"
              rel="noopener noreferrer"
            >
              install
            </MuiLink>{' '}
            KEDA
          </Typography>
        </Grid>
      </Grid>
    </Box>
  );
}

interface KedaInstallCheckProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function KedaInstallCheck({ children, fallback }: KedaInstallCheckProps) {
  const { isKedaInstalled, isKedaCheckLoading } = useKedaInstalled();

  if (!isKedaInstalled) {
    return fallback || <NotInstalledBanner isLoading={isKedaCheckLoading} />;
  }

  return <>{children}</>;
}

interface BaseKedaAuthenticationProps {
  title?: string;
  resourceType: typeof TriggerAuthentication | typeof ClusterTriggerAuthentication;
  namespace?: string;
  name?: string;
}

export function BaseKedaAuthenticationDetail({
  resourceType,
  namespace,
  name,
}: BaseKedaAuthenticationProps) {
  function isAuthTargetRef(value: any): value is AuthTargetRef {
    return (
      typeof value === 'object' &&
      value !== null &&
      'parameter' in value &&
      'name' in value &&
      'key' in value &&
      typeof value.parameter === 'string' &&
      typeof value.name === 'string' &&
      typeof value.key === 'string'
    );
  }

  const renderValue = (value: any): ReactNode => {
    if (Array.isArray(value)) {
      if (value.every(item => isAuthTargetRef(item))) {
        return value.map((item, index) => (
          <NameValueTable
            key={index}
            rows={[
              { name: 'parameter', value: item.parameter },
              {
                name: 'name',
                value: (
                  <Link
                    routeName={K8s.ResourceClasses.Secret.kind}
                    params={{ name: item.name, namespace }}
                  >
                    {item.name}
                  </Link>
                ),
              },
              { name: 'key', value: item.key },
            ]}
          />
        ));
      }

      if (value.every(item => typeof item === 'object' && item !== null)) {
        return value.map((item, index) => (
          <NameValueTable
            key={index}
            rows={Object.entries(item).map(([k, v]) => ({
              name: k,
              value: renderValue(v),
            }))}
          />
        ));
      }
    }

    if (typeof value === 'object' && value !== null) {
      return (
        <NameValueTable
          rows={Object.entries(value).map(([k, v]) => ({
            name: k,
            value: renderValue(v),
          }))}
        />
      );
    }

    return String(value);
  };

  return (
    <KedaInstallCheck>
      <DetailsGrid
        resourceType={resourceType}
        name={name}
        withEvents
        namespace={resourceType.isNamespaced ? namespace : undefined}
        extraInfo={item =>
          item && [
            { name: 'API Version', value: resourceType.apiVersion },
            { name: 'Kind', value: resourceType.kind },
          ]
        }
        extraSections={item =>
          item && [
            item.spec &&
              Object.keys(item.spec).length > 0 && {
                id: 'spec',
                section: (
                  <SectionBox title="Spec">
                    {Object.entries(item.spec).map(([key, value]) => (
                      <Fragment key={key}>
                        <h2>{key}</h2>
                        {renderValue(value)}
                      </Fragment>
                    ))}
                  </SectionBox>
                ),
              },
            item.status &&
              Object.keys(item.status).length > 0 && {
                id: 'status',
                section: (
                  <SectionBox title="Status">
                    {item.scaledjobs.length > 0 && (
                      <NameValueTable
                        rows={[
                          {
                            name: 'ScaledJobs',
                            value: item.scaledjobs.map((objName, i) =>
                              resourceType === TriggerAuthentication ? (
                                <Fragment key={objName}>
                                  <Link
                                    routeName="ScaledJob"
                                    params={{
                                      name: objName,
                                      namespace: item.metadata.namespace,
                                    }}
                                  >
                                    {objName}
                                  </Link>
                                  {i < item.scaledjobs.length - 1 ? ', ' : ''}
                                </Fragment>
                              ) : (
                                `${objName}${i < item.scaledjobs.length - 1 ? ', ' : ''}`
                              )
                            ),
                          },
                        ]}
                      />
                    )}
                    {item.scaledobjects.length > 0 && (
                      <NameValueTable
                        rows={[
                          {
                            name: 'ScaledObjects',
                            value: item.scaledobjects.map((objName, i) =>
                              resourceType === TriggerAuthentication ? (
                                <Fragment key={objName}>
                                  <Link
                                    routeName="ScaledObject"
                                    params={{
                                      name: objName,
                                      namespace: item.metadata.namespace,
                                    }}
                                  >
                                    {objName}
                                  </Link>
                                  {i < item.scaledobjects.length - 1 ? ', ' : ''}
                                </Fragment>
                              ) : (
                                `${objName}${i < item.scaledobjects.length - 1 ? ', ' : ''}`
                              )
                            ),
                          },
                        ]}
                      />
                    )}
                  </SectionBox>
                ),
              },
          ]
        }
      />
    </KedaInstallCheck>
  );
}

export function BaseKedaAuthenticationList({ title, resourceType }: BaseKedaAuthenticationProps) {
  return (
    <KedaInstallCheck>
      <ResourceListView
        title={title}
        resourceClass={resourceType}
        columns={[
          'name',
          ...(resourceType.isNamespaced
            ? [
                {
                  id: 'namespace',
                  label: 'Namespace',
                  getValue: null,
                  render: item => (
                    <Link routeName="namespace" params={{ name: item.metadata.namespace }}>
                      {item.metadata.namespace}
                    </Link>
                  ),
                },
              ]
            : []),
          {
            id: 'pod-identity',
            label: 'Pod Identity',
            getValue: item => item.podIdentity || '-',
          },
          {
            id: 'secret',
            label: 'Secret',
            getValue: item => item.secretName || '-',
          },
          {
            id: 'env',
            label: 'Env',
            getValue: item => item.envName || '-',
          },
          {
            id: 'vault-address',
            label: 'Vault Address',
            getValue: item => item.vaultAddress || '-',
          },
          'age',
        ]}
      />
    </KedaInstallCheck>
  );
}

export interface TriggersSectionProps {
  resource: ScaledObject | ScaledJob;
}

export function TriggersSection(props: TriggersSectionProps) {
  const { resource } = props;

  return (
    <SectionBox title="Triggers">
      {resource.spec.triggers.map((trigger, index) => (
        <Fragment key={index}>
          <h2>{`Trigger ${index + 1} (${trigger.type})`}</h2>
          <NameValueTable
            rows={[
              {
                name: 'Name',
                value: trigger.name ?? '-',
              },
              {
                name: 'Type',
                value: trigger.type,
              },
              {
                name: 'Metadata',
                value: (
                  <NameValueTable
                    rows={Object.entries(trigger.metadata).map(([key, value]) => ({
                      name: key,
                      value: value,
                    }))}
                  />
                ),
              },
              {
                name: 'Authentication Reference',
                value: trigger.authenticationRef ? (
                  <Link
                    routeName={trigger.authenticationRef.kind ?? TriggerAuthentication.kind}
                    params={{
                      name: trigger.authenticationRef.name,
                      namespace: resource.metadata.namespace,
                    }}
                  >
                    {trigger.authenticationRef.kind ?? TriggerAuthentication.kind}/
                    {trigger.authenticationRef.name}
                  </Link>
                ) : (
                  '-'
                ),
              },
              {
                name: 'Use Cached Metrics',
                value: trigger.useCachedMetrics ? 'Yes' : 'No',
              },
              {
                name: 'Metric Type',
                value: trigger.metricType ?? KedaTriggerMetricType.AVERAGEVALUE,
              },
            ]}
          />
        </Fragment>
      ))}
    </SectionBox>
  );
}

export function ContainersSection(props: { resource: KubeObjectInterface | null }) {
  const { resource } = props;

  let title = '…';

  function getContainers() {
    if (!resource) {
      return [];
    }

    let containers: KubeContainer[] = [];

    if (resource.spec) {
      if (resource.spec.containers) {
        title = 'Containers';
        containers = resource.spec.containers;
      } else if (resource.spec.template && resource.spec.template.spec) {
        title = 'Container Spec';
        containers = resource.spec.template.spec.containers;
      } else if (
        resource.kind === ScaledJob.kind &&
        resource.spec.jobTargetRef?.template?.spec?.containers
      ) {
        // KEDA ScaledJob contains containers in jobTargetRef.template.spec.containers
        title = 'Container Spec';
        containers = resource.spec.jobTargetRef.template.spec.containers;
      }
    }

    return containers;
  }

  function getInitContainers() {
    if (
      resource?.kind === ScaledJob.kind &&
      resource.spec?.jobTargetRef?.template?.spec?.initContainers
    ) {
      return resource.spec.jobTargetRef.template.spec.initContainers || [];
    }
    return resource?.spec?.initContainers || [];
  }

  function getEphemeralContainers() {
    if (
      resource?.kind === ScaledJob.kind &&
      resource.spec?.jobTargetRef?.template?.spec?.ephemeralContainers
    ) {
      return resource.spec.jobTargetRef.template.spec.ephemeralContainers || [];
    }
    return resource?.spec?.ephemeralContainers || [];
  }

  function getStatuses(
    statusKind: 'containerStatuses' | 'initContainerStatuses' | 'ephemeralContainerStatuses'
  ) {
    if (!resource || resource.kind !== 'Pod') {
      return {};
    }

    const statuses: {
      [key: string]: ContainerInfoProps['status'];
    } = {};

    ((resource as KubePod).status[statusKind] || []).forEach(containerStatus => {
      const { name, ...status } = containerStatus;
      statuses[name] = { ...status };
    });

    return statuses;
  }

  const containers = getContainers();
  const initContainers = getInitContainers();
  const ephemContainers = getEphemeralContainers();
  const statuses = getStatuses('containerStatuses');
  const initStatuses = getStatuses('initContainerStatuses');
  const ephemStatuses = getStatuses('ephemeralContainerStatuses');
  const numContainers = containers.length;

  return (
    <>
      <SectionBox title={title}>
        {numContainers === 0 ? (
          <Empty>No data to be shown.</Empty>
        ) : (
          containers.map((container: any) => (
            <ContainerInfo
              key={`container_${container.name}`}
              resource={resource}
              container={container}
              status={statuses[container.name]}
            />
          ))
        )}
      </SectionBox>

      {ephemContainers.length > 0 && (
        <SectionBox title="Ephemeral Containers">
          {ephemContainers.map((ephemContainer: KubeContainer) => (
            <ContainerInfo
              key={`ephem_container_${ephemContainer.name}`}
              resource={resource}
              container={ephemContainer}
              status={ephemStatuses[ephemContainer.name]}
            />
          ))}
        </SectionBox>
      )}

      {initContainers.length > 0 && (
        <SectionBox title="Init Containers">
          {initContainers.map((initContainer: KubeContainer, i: number) => (
            <ContainerInfo
              key={`init_container_${i}`}
              resource={resource}
              container={initContainer}
              status={initStatuses[initContainer.name]}
            />
          ))}
        </SectionBox>
      )}
    </>
  );
}

export function makeJobStatusLabel(job: Job) {
  if (!job?.status?.conditions) {
    return null;
  }

  const conditionOptions = {
    Failed: {
      status: 'error',
      icon: 'mdi:alert-outline',
    },
    Complete: {
      status: 'success',
      icon: 'mdi:check-bold',
    },
    Suspended: {
      status: '',
      icon: 'mdi:pause',
    },
  };

  const condition = job.status.conditions.find(
    ({ status, type }: { status: string; type: string }) =>
      type in conditionOptions && status === 'True'
  );

  if (!condition) {
    return null;
  }

  const tooltip = '';

  const conditionInfo = conditionOptions[(condition.type as 'Complete' | 'Failed') || 'Suspended'];

  return (
    <LightTooltip title={tooltip} interactive>
      <Box display="inline">
        <StatusLabel status={conditionInfo.status as StatusLabelProps['status']}>
          {condition.type}
          <Icon aria-label="hidden" icon={conditionInfo.icon} width="1.2rem" height="1.2rem" />
        </StatusLabel>
      </Box>
    </LightTooltip>
  );
}

export interface JobsListRendererProps {
  jobs: Job[] | null;
  errors?: ApiError[] | null;
  hideColumns?: string[];
  reflectTableInURL?: SimpleTableProps['reflectInURL'];
  noNamespaceFilter?: boolean;
}

export function JobsListRenderer(props: JobsListRendererProps) {
  const { jobs, errors, hideColumns = [], reflectTableInURL = 'jobs', noNamespaceFilter } = props;

  function getCompletions(job: Job) {
    return `${job.spec.completions}/${job.spec.parallelism}`;
  }

  function sortByCompletions(job1: Job, job2: Job) {
    const parallelismSorted = job1.spec.parallelism - job2.spec.parallelism;
    if (parallelismSorted === 0) {
      return job1.spec.completions - job2.spec.completions;
    }
    return parallelismSorted;
  }

  return (
    <ResourceListView
      title="Jobs"
      headerProps={{
        noNamespaceFilter,
      }}
      hideColumns={hideColumns}
      errors={errors}
      columns={[
        'name',
        'namespace',
        'cluster',
        {
          id: 'completions',
          label: 'Completions',
          gridTemplate: 'min-content',
          getValue: job => getCompletions(job),
          sort: sortByCompletions,
        },
        {
          id: 'conditions',
          label: 'Conditions',
          gridTemplate: 'min-content',
          getValue: job =>
            job.status?.conditions?.find(({ status }: { status: string }) => status === 'True') ??
            null,
          render: job => makeJobStatusLabel(job),
        },
        {
          id: 'duration',
          label: 'Duration',
          gridTemplate: 'min-content',
          getValue: job => {
            const duration = job.getDuration();
            if (duration > 0) {
              return formatDuration(duration, { format: 'mini' });
            }
            return '-';
          },
          sort: (job1, job2) => job1.getDuration() - job2.getDuration(),
        },
        {
          id: 'containers',
          label: 'Containers',
          getValue: job =>
            job
              .getContainers()
              .map(c => c.name)
              .join(''),
          render: job => {
            const containerNames = job.getContainers().map((c: KubeContainer) => c.name);
            const containerTooltip = containerNames.join('\n');
            const containerText = containerNames.join(', ');
            return (
              <LightTooltip title={containerTooltip} interactive>
                {containerText}
              </LightTooltip>
            );
          },
        },
        {
          id: 'images',
          label: 'Images',
          gridTemplate: 'auto',
          getValue: job =>
            job
              .getContainers()
              .map(c => c.image)
              .join(''),
          render: job => {
            const containerImages = job.getContainers().map((c: KubeContainer) => c.image);
            const containerTooltip = containerImages.join('\n');
            const containerText = containerImages.join(', ');
            return (
              <LightTooltip title={containerTooltip} interactive>
                {containerText}
              </LightTooltip>
            );
          },
        },
        'age',
      ]}
      data={jobs}
      reflectInURL={reflectTableInURL}
      id="headlamp-jobs"
    />
  );
}
