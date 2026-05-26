import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  ConditionsTable,
  DeleteButton,
  DetailsGrid,
  Link as HeadlampLink,
  NameValueTable,
  ObjectEventList,
  SectionBox,
  SimpleTable,
  Tabs,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Alert, Stack } from '@mui/material';
import yaml from 'js-yaml';
import React from 'react';
import { useParams } from 'react-router-dom';
import { ClusterTrainingRuntimeClass, TrainingRuntimeClass } from '../../resources/trainingRuntime';
import { JobSetClass, TrainJobClass } from '../../resources/trainJob';
import { KubeflowDiffViewerAction } from '../common/KubeflowDiffViewerAction';
import { KubeflowJsonViewerAction } from '../common/KubeflowJsonViewerAction';
import { launchPodContainerLogs, launchTrainJobLogs } from '../common/KubeflowLogsViewer';
import { KubeflowStatusBadge } from '../common/KubeflowStatusBadge';
import { SectionPage } from '../common/SectionPage';
import {
  buildRuntimePatchPreview,
  buildTrainJobWarnings,
  formatDurationSeconds,
  formatMetrics,
  formatPercent,
  formatResourcesSummary,
  formatRuntimeRef,
  getContainerResourceSummary,
  getGpuQuantity,
  getMetricValue,
  getPodContainers,
  getPodMetricLookup,
  getPodPhase,
  getRuntimeForTrainJob,
  getRuntimeLabel,
  getRuntimePatchManagers,
  getRuntimeTemplateJobNames,
  getSchedulingSummary,
  getTrainJobStatusInfo,
  getUnschedulableMessage,
  inferPodMetricSummary,
} from './trainerUtils';
import { TrainJobStatusBadge } from './TrainJobStatusBadge';
import { TrainJobSuspendButton } from './TrainJobSuspendButton';

function WarningBanner({ warnings }: { warnings: ReturnType<typeof buildTrainJobWarnings> }) {
  if (warnings.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1}>
      {warnings.map(warning => (
        <Alert key={`${warning.severity}-${warning.title}`} severity={warning.severity}>
          <strong>{warning.title}:</strong> {warning.message}
        </Alert>
      ))}
    </Stack>
  );
}

/**
 * Renders the TrainJob operator view with status, logs, events, and child resources.
 */
export function TrainJobsDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  const [job] = TrainJobClass.useGet(name as string, namespace);
  const [namespaceRuntimes, namespaceRuntimesError] = TrainingRuntimeClass.useList({ namespace });
  const [clusterRuntimes, clusterRuntimesError] = ClusterTrainingRuntimeClass.useList();
  const [jobSet] = JobSetClass.useGet(name as string, namespace);

  const labelSelector = `jobset.sigs.k8s.io/jobset-name=${name}`;
  const [jobs] = K8s.ResourceClasses.Job.useList({ namespace, labelSelector });
  const [pods] = K8s.ResourceClasses.Pod.useList({ namespace, labelSelector });
  const PodMetricsClass = (K8s.ResourceClasses as any).PodMetrics;
  const [podMetrics] = PodMetricsClass
    ? PodMetricsClass.useList({ namespace, labelSelector, refetchInterval: 5000 })
    : [null];

  const namespacedRuntime =
    job && namespaceRuntimes
      ? namespaceRuntimes.find(
          (runtime: TrainingRuntimeClass) => runtime.getName() === job.runtimeName
        ) || null
      : null;
  const clusterRuntime =
    job && clusterRuntimes
      ? clusterRuntimes.find(
          (runtime: ClusterTrainingRuntimeClass) => runtime.getName() === job.runtimeName
        ) || null
      : null;

  const runtime = getRuntimeForTrainJob({
    job: job || TrainJobClass.create({ metadata: { name, namespace } } as any),
    namespacedRuntime,
    clusterRuntime,
  });

  const warnings = job
    ? buildTrainJobWarnings({
        job,
        namespacedRuntime,
        clusterRuntime,
        runtimeError: namespaceRuntimesError || clusterRuntimesError,
      })
    : [];

  const childJobs = React.useMemo(() => {
    const jobList = jobs ?? [];
    if (!job) {
      return [];
    }

    return jobList.filter((childJob: any) => {
      const ownerRefs = childJob.metadata?.ownerReferences ?? [];
      const ownedByJobSet = ownerRefs.some(
        (owner: any) => owner.kind === 'JobSet' && owner.name === job.metadata.name
      );

      return (
        ownedByJobSet ||
        childJob.metadata?.labels?.['jobset.sigs.k8s.io/jobset-name'] === job.metadata.name ||
        childJob.metadata?.name?.startsWith(`${job.metadata.name}-`)
      );
    });
  }, [job, jobs]);

  const childPods = React.useMemo(() => {
    const podList = pods ?? [];
    const childJobNames = new Set(childJobs.map((childJob: any) => childJob.metadata?.name));
    if (!job) {
      return [];
    }

    return podList.filter((pod: any) => {
      const ownerRefs = pod.metadata?.ownerReferences ?? [];
      const ownerName = ownerRefs.find((owner: any) => owner.kind === 'Job')?.name;
      return (
        ownerRefs.some(
          (owner: any) => owner.kind === 'JobSet' && owner.name === job.metadata.name
        ) ||
        (ownerName && childJobNames.has(ownerName)) ||
        childJobNames.has(pod.metadata?.labels?.['job-name']) ||
        pod.metadata?.labels?.['jobset.sigs.k8s.io/jobset-name'] === job.metadata.name
      );
    });
  }, [childJobs, job, pods]);

  const metricsForChildPods = React.useMemo(() => {
    const podNames = new Set(childPods.map((pod: any) => pod.metadata?.name));
    return (podMetrics ?? []).filter((metric: any) => podNames.has(metric.metadata?.name));
  }, [childPods, podMetrics]);

  const metricsLookup = getPodMetricLookup(metricsForChildPods);
  const aggregatedMetricSummary = inferPodMetricSummary(metricsForChildPods);
  const runtimePatchPreview = buildRuntimePatchPreview(runtime, job?.runtimePatches ?? []);

  return (
    <SectionPage title="TrainJob Detail" apiPath="/apis/trainer.kubeflow.org/v1alpha1/trainjobs">
      <DetailsGrid
        resourceType={TrainJobClass}
        name={name as string}
        namespace={namespace}
        extraInfo={item =>
          item && [
            { name: 'Status', value: <TrainJobStatusBadge job={item} /> },
            { name: 'Runtime Ref', value: formatRuntimeRef(item) },
            { name: 'Suspended', value: item.suspended ? 'Yes' : 'No' },
            { name: 'Managed By', value: item.managedBy || '-' },
            { name: 'Num Nodes', value: item.numNodes ?? runtime?.defaultNumNodes ?? '-' },
            { name: 'Num Proc / Node', value: item.numProcPerNode || '-' },
            { name: 'Progress', value: formatPercent(item.progress) },
            { name: 'Last Updated', value: item.lastUpdatedTime || '-' },
          ]
        }
        actions={item =>
          item && [
            {
              id: 'kubeflow.trainjob-logs',
              action: (
                <ActionButton
                  description="View Primary Pod Logs"
                  icon="mdi:text-box-outline"
                  onClick={() =>
                    launchTrainJobLogs({
                      jobName: item.metadata.name,
                      namespace: item.metadata.namespace,
                      cluster: item.cluster,
                    })
                  }
                />
              ),
            },
            {
              id: 'kubeflow.trainjob-runtime-patches',
              action:
                item.runtimePatches.length > 0 && runtime ? (
                  <KubeflowDiffViewerAction
                    title="Preview Runtime Patches"
                    activityId={`trainjob-runtime-patches-${item.metadata.namespace}-${item.metadata.name}`}
                    original={yaml.dump(runtimePatchPreview.baseSpec)}
                    modified={yaml.dump(runtimePatchPreview.mergedSpec)}
                    originalLabel={`Base ${runtime.kind}`}
                    modifiedLabel="Patched Runtime Preview"
                  />
                ) : null,
            },
            {
              id: 'kubeflow.trainjob-json',
              action: (
                <KubeflowJsonViewerAction
                  title="View Raw JSON"
                  value={item.jsonData}
                  activityId={`json-trainjob-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
            {
              id: 'kubeflow.trainjob-suspend',
              action: <TrainJobSuspendButton item={item} />,
            },
            {
              id: 'kubeflow.trainjob-delete',
              action: <DeleteButton item={item} />,
            },
          ]
        }
        extraSections={item => {
          if (!item) {
            return [];
          }

          return [
            {
              id: 'trainjob-tabs',
              section: (
                <SectionBox title="TrainJob Workspace">
                  <Tabs
                    ariaLabel="TrainJob detail tabs"
                    tabs={[
                      {
                        label: 'Overview',
                        component: (
                          <Stack spacing={2}>
                            <WarningBanner warnings={warnings} />
                            <SectionBox title="Runtime & Scheduling">
                              <NameValueTable
                                rows={[
                                  { name: 'Runtime Ref', value: formatRuntimeRef(item) },
                                  { name: 'Resolved Runtime', value: getRuntimeLabel(runtime) },
                                  {
                                    name: 'Scheduling',
                                    value: getSchedulingSummary(runtime || {}),
                                  },
                                  {
                                    name: 'Template Jobs',
                                    value: getRuntimeTemplateJobNames(runtime) || '-',
                                  },
                                  { name: 'Managed By', value: item.managedBy || '-' },
                                  {
                                    name: 'Suspend Flag',
                                    value: item.suspended ? 'true' : 'false',
                                  },
                                ]}
                              />
                            </SectionBox>
                            <SectionBox title="Trainer">
                              <NameValueTable
                                rows={[
                                  { name: 'Image', value: item.trainerImage || '-' },
                                  {
                                    name: 'Command',
                                    value: item.trainer.command?.join(' ') || '-',
                                  },
                                  { name: 'Args', value: item.trainer.args?.join(' ') || '-' },
                                  {
                                    name: 'Num Nodes',
                                    value: item.numNodes ?? runtime?.defaultNumNodes ?? '-',
                                  },
                                  { name: 'Num Proc / Node', value: item.numProcPerNode || '-' },
                                  {
                                    name: 'Resources / Node',
                                    value: formatResourcesSummary(item.trainer.resourcesPerNode),
                                  },
                                  {
                                    name: 'Environment Variables',
                                    value: item.trainer.env?.length
                                      ? `${item.trainer.env.length}`
                                      : '0',
                                  },
                                ]}
                              />
                            </SectionBox>
                            {(item.spec.initializer?.dataset || item.spec.initializer?.model) && (
                              <SectionBox title="Initializer">
                                <NameValueTable
                                  rows={[
                                    {
                                      name: 'Dataset URI',
                                      value: item.spec.initializer?.dataset?.storageUri || '-',
                                    },
                                    {
                                      name: 'Dataset Secret',
                                      value: item.spec.initializer?.dataset?.secretRef?.name || '-',
                                    },
                                    {
                                      name: 'Model URI',
                                      value: item.spec.initializer?.model?.storageUri || '-',
                                    },
                                    {
                                      name: 'Model Secret',
                                      value: item.spec.initializer?.model?.secretRef?.name || '-',
                                    },
                                  ]}
                                />
                              </SectionBox>
                            )}
                          </Stack>
                        ),
                      },
                      {
                        label: 'Spec',
                        component: (
                          <Stack spacing={2}>
                            <SectionBox title="TrainJob Spec">
                              <NameValueTable
                                rows={[
                                  {
                                    name: 'Runtime Patch Managers',
                                    value: getRuntimePatchManagers(item.runtimePatches) || '-',
                                  },
                                  {
                                    name: 'Runtime Patch Entries',
                                    value: `${item.runtimePatches.length}`,
                                  },
                                  {
                                    name: 'Active Deadline Seconds',
                                    value: item.spec.activeDeadlineSeconds ?? '-',
                                  },
                                ]}
                              />
                            </SectionBox>
                            {runtime && (
                              <SectionBox title="Resolved Runtime">
                                <NameValueTable
                                  rows={[
                                    { name: 'Runtime Kind', value: runtime.kind },
                                    { name: 'Runtime Name', value: runtime.getName() },
                                    { name: 'Framework', value: runtime.framework || '-' },
                                    {
                                      name: 'Default Nodes',
                                      value: runtime.defaultNumNodes ?? '-',
                                    },
                                    {
                                      name: 'Scheduling Policy',
                                      value: getSchedulingSummary(runtime),
                                    },
                                  ]}
                                />
                              </SectionBox>
                            )}
                            {item.runtimePatches.length > 0 && runtime && (
                              <SectionBox title="Runtime Patch Preview">
                                <Stack direction="row" spacing={2}>
                                  <KubeflowDiffViewerAction
                                    title="Preview Runtime Patches"
                                    activityId={`trainjob-runtime-patches-tab-${item.metadata.namespace}-${item.metadata.name}`}
                                    original={yaml.dump(runtimePatchPreview.baseSpec)}
                                    modified={yaml.dump(runtimePatchPreview.mergedSpec)}
                                    originalLabel={`Base ${runtime.kind}`}
                                    modifiedLabel="Patched Runtime Preview"
                                  />
                                  <KubeflowJsonViewerAction
                                    title="View RuntimePatches JSON"
                                    value={item.runtimePatches}
                                    activityId={`runtime-patches-json-${item.metadata.namespace}-${item.metadata.name}`}
                                  />
                                </Stack>
                              </SectionBox>
                            )}
                          </Stack>
                        ),
                      },
                      {
                        label: 'Status',
                        component: (
                          <Stack spacing={2}>
                            <SectionBox title="Progress & Health">
                              <NameValueTable
                                rows={[
                                  {
                                    name: 'Current Phase',
                                    value: (
                                      <KubeflowStatusBadge
                                        statusInfo={getTrainJobStatusInfo(item)}
                                      />
                                    ),
                                  },
                                  { name: 'Progress', value: formatPercent(item.progress) },
                                  {
                                    name: 'Estimated Remaining',
                                    value: formatDurationSeconds(
                                      item.estimatedRemainingTimeSeconds
                                    ),
                                  },
                                  { name: 'Last Updated', value: item.lastUpdatedTime || '-' },
                                  { name: 'CPU Usage (Pods)', value: aggregatedMetricSummary.cpu },
                                  {
                                    name: 'Memory Usage (Pods)',
                                    value: aggregatedMetricSummary.memory,
                                  },
                                  {
                                    name: 'GPU / Node',
                                    value: getGpuQuantity(item.trainer.resourcesPerNode) || '-',
                                  },
                                  {
                                    name: 'GPU Metric',
                                    value:
                                      getMetricValue(item.trainerStatus?.metrics, /gpu/i) ||
                                      'Not reported',
                                  },
                                ]}
                              />
                            </SectionBox>
                            <SectionBox title="Current Metrics">
                              <NameValueTable
                                rows={
                                  formatMetrics(item.trainerStatus?.metrics).length > 0
                                    ? formatMetrics(item.trainerStatus?.metrics)
                                    : [
                                        {
                                          name: 'Metrics',
                                          value: 'No trainer metrics reported yet.',
                                        },
                                      ]
                                }
                              />
                            </SectionBox>
                            <SectionBox title="Child Job Status">
                              <SimpleTable
                                data={item.jobsStatus}
                                columns={[
                                  { label: 'Name', getter: (status: any) => status.name || '-' },
                                  { label: 'Ready', getter: (status: any) => status.ready ?? 0 },
                                  { label: 'Active', getter: (status: any) => status.active ?? 0 },
                                  {
                                    label: 'Succeeded',
                                    getter: (status: any) => status.succeeded ?? 0,
                                  },
                                  { label: 'Failed', getter: (status: any) => status.failed ?? 0 },
                                  {
                                    label: 'Suspended',
                                    getter: (status: any) => status.suspended ?? 0,
                                  },
                                ]}
                                emptyMessage="No child job status has been reported yet."
                              />
                            </SectionBox>
                            <SectionBox title="Conditions">
                              <ConditionsTable resource={item.jsonData} />
                            </SectionBox>
                          </Stack>
                        ),
                      },
                      {
                        label: 'Logs',
                        component: (
                          <SectionBox title="Pod / Container Logs">
                            <SimpleTable
                              data={childPods.flatMap((pod: any) =>
                                getPodContainers(pod).map(entry => ({
                                  pod,
                                  container: entry.container,
                                  status: entry.status,
                                }))
                              )}
                              columns={[
                                {
                                  label: 'Pod',
                                  getter: ({ pod }: any) => pod.metadata?.name || '-',
                                },
                                {
                                  label: 'Phase',
                                  getter: ({ pod }: any) => getPodPhase(pod),
                                },
                                {
                                  label: 'Container',
                                  getter: ({ container }: any) => container.name || '-',
                                },
                                {
                                  label: 'Restarts',
                                  getter: ({ status }: any) => status?.restartCount ?? 0,
                                },
                                {
                                  label: 'Logs',
                                  getter: ({ pod, container }: any) => (
                                    <HeadlampLink
                                      route="#"
                                      onClick={(event: React.MouseEvent) => {
                                        event.preventDefault();
                                        launchPodContainerLogs({
                                          podName: pod.metadata.name,
                                          namespace: pod.metadata.namespace,
                                          cluster: pod.cluster,
                                          containerName: container.name,
                                        });
                                      }}
                                    >
                                      View Logs
                                    </HeadlampLink>
                                  ),
                                },
                              ]}
                              emptyMessage="No child pods found for this TrainJob yet."
                            />
                          </SectionBox>
                        ),
                      },
                      {
                        label: 'Events',
                        component: <ObjectEventList object={item} />,
                      },
                      {
                        label: 'Child Resources',
                        component: (
                          <Stack spacing={2}>
                            <SectionBox title="JobSet">
                              <NameValueTable
                                rows={[
                                  {
                                    name: 'JobSet',
                                    value: jobSet ? (
                                      <HeadlampLink route={jobSet.getDetailsLink()}>
                                        {jobSet.getName()}
                                      </HeadlampLink>
                                    ) : (
                                      'Not found'
                                    ),
                                  },
                                  {
                                    name: 'Namespace',
                                    value: jobSet?.getNamespace() || item.metadata.namespace || '-',
                                  },
                                ]}
                              />
                            </SectionBox>
                            <SectionBox title="Jobs">
                              <SimpleTable
                                data={childJobs}
                                columns={[
                                  {
                                    label: 'Name',
                                    getter: (childJob: any) => (
                                      <HeadlampLink route={childJob.getDetailsLink()}>
                                        {childJob.getName()}
                                      </HeadlampLink>
                                    ),
                                  },
                                  {
                                    label: 'Completions',
                                    getter: (childJob: any) =>
                                      `${childJob.status?.succeeded ?? 0}/${
                                        childJob.spec?.completions ?? '-'
                                      }`,
                                  },
                                  {
                                    label: 'Parallelism',
                                    getter: (childJob: any) => childJob.spec?.parallelism ?? '-',
                                  },
                                  {
                                    label: 'Active',
                                    getter: (childJob: any) => childJob.status?.active ?? 0,
                                  },
                                ]}
                                emptyMessage="No child Jobs found."
                              />
                            </SectionBox>
                            <SectionBox title="Pods & Metrics">
                              <SimpleTable
                                data={childPods}
                                columns={[
                                  {
                                    label: 'Pod',
                                    getter: (pod: any) => (
                                      <HeadlampLink route={pod.getDetailsLink()}>
                                        {pod.getName()}
                                      </HeadlampLink>
                                    ),
                                  },
                                  { label: 'Phase', getter: (pod: any) => getPodPhase(pod) },
                                  {
                                    label: 'CPU',
                                    getter: (pod: any) => metricsLookup[pod.getName()]?.cpu || '-',
                                  },
                                  {
                                    label: 'Memory',
                                    getter: (pod: any) =>
                                      metricsLookup[pod.getName()]?.memory || '-',
                                  },
                                  {
                                    label: 'GPU Req',
                                    getter: (pod: any) =>
                                      getGpuQuantity(pod.spec?.containers?.[0]?.resources) || '-',
                                  },
                                  {
                                    label: 'Container Resources',
                                    getter: (pod: any) =>
                                      getContainerResourceSummary(pod.spec?.containers?.[0]),
                                  },
                                  {
                                    label: 'Scheduling',
                                    getter: (pod: any) => getUnschedulableMessage(pod) || '-',
                                  },
                                ]}
                                emptyMessage="No child Pods found."
                              />
                            </SectionBox>
                          </Stack>
                        ),
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
          ];
        }}
      />
    </SectionPage>
  );
}
