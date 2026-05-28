import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
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
  const { t } = useTranslation('kubeflow');
  if (warnings.length === 0) {
    return null;
  }

  return (
    <Stack spacing={1}>
      {warnings.map(warning => (
        <Alert key={`${warning.severity}-${warning.title}`} severity={warning.severity}>
          <strong>{t(warning.title)}:</strong> {warning.message}
        </Alert>
      ))}
    </Stack>
  );
}

/**
 * Renders the TrainJob operator view with status, logs, events, and child resources.
 */
export function TrainJobsDetail(props: { namespace?: string; name?: string; node?: any }) {
  const { t } = useTranslation('kubeflow');
  const params = useParams<{ namespace: string; name: string }>();
  const {
    namespace = params.namespace || props.node?.kubeObject?.metadata?.namespace,
    name = params.name || props.node?.kubeObject?.metadata?.name,
  } = props;

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
  const aggregatedMetricSummary = inferPodMetricSummary(metricsForChildPods, t);
  const runtimePatchPreview = buildRuntimePatchPreview(runtime, job?.runtimePatches ?? []);

  return (
    <SectionPage
      title={t('TrainJob Detail')}
      apiPath="/apis/trainer.kubeflow.org/v1alpha1/trainjobs"
    >
      <DetailsGrid
        resourceType={TrainJobClass}
        name={name as string}
        namespace={namespace}
        extraInfo={item =>
          item && [
            { name: t('Status'), value: <TrainJobStatusBadge job={item} /> },
            { name: t('Runtime Ref'), value: formatRuntimeRef(item, t) },
            { name: t('Suspended'), value: item.suspended ? t('Yes') : t('No') },
            { name: t('Managed By'), value: item.managedBy || '-' },
            { name: t('Num Nodes'), value: item.numNodes ?? runtime?.defaultNumNodes ?? '-' },
            { name: t('Num Proc / Node'), value: item.numProcPerNode || '-' },
            { name: t('Progress'), value: formatPercent(item.progress) },
            { name: t('Last Updated'), value: item.lastUpdatedTime || '-' },
          ]
        }
        actions={item =>
          item && [
            {
              id: 'kubeflow.trainjob-logs',
              action: (
                <ActionButton
                  description={t('View Primary Pod Logs')}
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
                    title={t('Preview Runtime Patches')}
                    activityId={`trainjob-runtime-patches-${item.metadata.namespace}-${item.metadata.name}`}
                    original={yaml.dump(runtimePatchPreview.baseSpec)}
                    modified={yaml.dump(runtimePatchPreview.mergedSpec)}
                    originalLabel={t('Base {{kind}}', { kind: runtime.kind })}
                    modifiedLabel={t('Patched Runtime Preview')}
                  />
                ) : null,
            },
            {
              id: 'kubeflow.trainjob-json',
              action: (
                <KubeflowJsonViewerAction
                  title={t('View Raw JSON')}
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
                <SectionBox title={t('TrainJob Workspace')}>
                  <Tabs
                    ariaLabel={t('TrainJob detail tabs')}
                    tabs={[
                      {
                        label: t('Overview'),
                        component: (
                          <Stack spacing={2}>
                            <WarningBanner warnings={warnings} />
                            <SectionBox title={t('Runtime & Scheduling')}>
                              <NameValueTable
                                rows={[
                                  { name: t('Runtime Ref'), value: formatRuntimeRef(item) },
                                  { name: t('Resolved Runtime'), value: getRuntimeLabel(runtime) },
                                  {
                                    name: t('Scheduling'),
                                    value: getSchedulingSummary(runtime || {}),
                                  },
                                  {
                                    name: t('Template Jobs'),
                                    value: getRuntimeTemplateJobNames(runtime) || '-',
                                  },
                                  { name: t('Managed By'), value: item.managedBy || '-' },
                                  {
                                    name: t('Suspend Flag'),
                                    value: item.suspended ? 'true' : 'false',
                                  },
                                ]}
                              />
                            </SectionBox>
                            <SectionBox title={t('Trainer')}>
                              <NameValueTable
                                rows={[
                                  { name: t('Image'), value: item.trainerImage || '-' },
                                  {
                                    name: t('Command'),
                                    value: item.trainer.command?.join(' ') || '-',
                                  },
                                  { name: t('Args'), value: item.trainer.args?.join(' ') || '-' },
                                  {
                                    name: t('Num Nodes'),
                                    value: item.numNodes ?? runtime?.defaultNumNodes ?? '-',
                                  },
                                  { name: t('Num Proc / Node'), value: item.numProcPerNode || '-' },
                                  {
                                    name: t('Resources / Node'),
                                    value: formatResourcesSummary(item.trainer.resourcesPerNode),
                                  },
                                  {
                                    name: t('Environment Variables'),
                                    value: item.trainer.env?.length
                                      ? `${item.trainer.env.length}`
                                      : '0',
                                  },
                                ]}
                              />
                            </SectionBox>
                            {(item.spec.initializer?.dataset || item.spec.initializer?.model) && (
                              <SectionBox title={t('Initializer')}>
                                <NameValueTable
                                  rows={[
                                    {
                                      name: t('Dataset URI'),
                                      value: item.spec.initializer?.dataset?.storageUri || '-',
                                    },
                                    {
                                      name: t('Dataset Secret'),
                                      value: item.spec.initializer?.dataset?.secretRef?.name || '-',
                                    },
                                    {
                                      name: t('Model URI'),
                                      value: item.spec.initializer?.model?.storageUri || '-',
                                    },
                                    {
                                      name: t('Model Secret'),
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
                        label: t('Spec'),
                        component: (
                          <Stack spacing={2}>
                            <SectionBox title={t('TrainJob Spec')}>
                              <NameValueTable
                                rows={[
                                  {
                                    name: t('Runtime Patch Managers'),
                                    value: getRuntimePatchManagers(item.runtimePatches) || '-',
                                  },
                                  {
                                    name: t('Runtime Patch Entries'),
                                    value: `${item.runtimePatches.length}`,
                                  },
                                  {
                                    name: t('Active Deadline Seconds'),
                                    value: item.spec.activeDeadlineSeconds ?? '-',
                                  },
                                ]}
                              />
                            </SectionBox>
                            {runtime && (
                              <SectionBox title={t('Resolved Runtime')}>
                                <NameValueTable
                                  rows={[
                                    { name: t('Runtime Kind'), value: runtime.kind },
                                    { name: t('Runtime Name'), value: runtime.getName() },
                                    { name: t('Framework'), value: runtime.framework || '-' },
                                    {
                                      name: t('Default Nodes'),
                                      value: runtime.defaultNumNodes ?? '-',
                                    },
                                    {
                                      name: t('Scheduling Policy'),
                                      value: getSchedulingSummary(runtime),
                                    },
                                  ]}
                                />
                              </SectionBox>
                            )}
                            {item.runtimePatches.length > 0 && runtime && (
                              <SectionBox title={t('Runtime Patch Preview')}>
                                <Stack direction="row" spacing={2}>
                                  <KubeflowDiffViewerAction
                                    title={t('Preview Runtime Patches')}
                                    activityId={`trainjob-runtime-patches-tab-${item.metadata.namespace}-${item.metadata.name}`}
                                    original={yaml.dump(runtimePatchPreview.baseSpec)}
                                    modified={yaml.dump(runtimePatchPreview.mergedSpec)}
                                    originalLabel={t('Base {{kind}}', { kind: runtime.kind })}
                                    modifiedLabel={t('Patched Runtime Preview')}
                                  />
                                  <KubeflowJsonViewerAction
                                    title={t('View RuntimePatches JSON')}
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
                        label: t('Status'),
                        component: (
                          <Stack spacing={2}>
                            <SectionBox title={t('Progress & Health')}>
                              <NameValueTable
                                rows={[
                                  {
                                    name: t('Current Phase'),
                                    value: (
                                      <KubeflowStatusBadge
                                        statusInfo={getTrainJobStatusInfo(item)}
                                      />
                                    ),
                                  },
                                  { name: t('Progress'), value: formatPercent(item.progress) },
                                  {
                                    name: t('Estimated Remaining'),
                                    value: formatDurationSeconds(
                                      item.estimatedRemainingTimeSeconds
                                    ),
                                  },
                                  { name: t('Last Updated'), value: item.lastUpdatedTime || '-' },
                                  {
                                    name: t('CPU Usage (Pods)'),
                                    value: aggregatedMetricSummary.cpu,
                                  },
                                  {
                                    name: t('Memory Usage (Pods)'),
                                    value: aggregatedMetricSummary.memory,
                                  },
                                  {
                                    name: t('GPU / Node'),
                                    value: getGpuQuantity(item.trainer.resourcesPerNode) || '-',
                                  },
                                  {
                                    name: t('GPU Metric'),
                                    value:
                                      getMetricValue(item.trainerStatus?.metrics, /gpu/i) ||
                                      t('Not reported'),
                                  },
                                ]}
                              />
                            </SectionBox>
                            <SectionBox title={t('Current Metrics')}>
                              <NameValueTable
                                rows={
                                  formatMetrics(item.trainerStatus?.metrics).length > 0
                                    ? formatMetrics(item.trainerStatus?.metrics)
                                    : [
                                        {
                                          name: t('Metrics'),
                                          value: t('No trainer metrics reported yet.'),
                                        },
                                      ]
                                }
                              />
                            </SectionBox>
                            <SectionBox title={t('Child Job Status')}>
                              <SimpleTable
                                data={item.jobsStatus}
                                columns={[
                                  { label: t('Name'), getter: (status: any) => status.name || '-' },
                                  { label: t('Ready'), getter: (status: any) => status.ready ?? 0 },
                                  {
                                    label: t('Active'),
                                    getter: (status: any) => status.active ?? 0,
                                  },
                                  {
                                    label: t('Succeeded'),
                                    getter: (status: any) => status.succeeded ?? 0,
                                  },
                                  {
                                    label: t('Failed'),
                                    getter: (status: any) => status.failed ?? 0,
                                  },
                                  {
                                    label: t('Suspended'),
                                    getter: (status: any) => status.suspended ?? 0,
                                  },
                                ]}
                                emptyMessage={t('No child job status has been reported yet.')}
                              />
                            </SectionBox>
                            <SectionBox title={t('Conditions')}>
                              <ConditionsTable resource={item.jsonData} />
                            </SectionBox>
                          </Stack>
                        ),
                      },
                      {
                        label: t('Logs'),
                        component: (
                          <SectionBox title={t('Pod / Container Logs')}>
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
                                  label: t('Pod'),
                                  getter: ({ pod }: any) => pod.metadata?.name || '-',
                                },
                                {
                                  label: t('Phase'),
                                  getter: ({ pod }: any) => getPodPhase(pod),
                                },
                                {
                                  label: t('Container'),
                                  getter: ({ container }: any) => container.name || '-',
                                },
                                {
                                  label: t('Restarts'),
                                  getter: ({ status }: any) => status?.restartCount ?? 0,
                                },
                                {
                                  label: t('Logs'),
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
                                      {t('View Logs')}
                                    </HeadlampLink>
                                  ),
                                },
                              ]}
                              emptyMessage={t('No child pods found for this TrainJob yet.')}
                            />
                          </SectionBox>
                        ),
                      },
                      {
                        label: t('Events'),
                        component: <ObjectEventList object={item} />,
                      },
                      {
                        label: t('Child Resources'),
                        component: (
                          <Stack spacing={2}>
                            <SectionBox title={t('JobSet')}>
                              <NameValueTable
                                rows={[
                                  {
                                    name: t('JobSet'),
                                    value: jobSet ? (
                                      <HeadlampLink route={jobSet.getDetailsLink()}>
                                        {jobSet.getName()}
                                      </HeadlampLink>
                                    ) : (
                                      t('Not found')
                                    ),
                                  },
                                  {
                                    name: t('Namespace'),
                                    value: jobSet?.getNamespace() || item.metadata.namespace || '-',
                                  },
                                ]}
                              />
                            </SectionBox>
                            <SectionBox title={t('Jobs')}>
                              <SimpleTable
                                data={childJobs}
                                columns={[
                                  {
                                    label: t('Name'),
                                    getter: (childJob: any) => (
                                      <HeadlampLink route={childJob.getDetailsLink()}>
                                        {childJob.getName()}
                                      </HeadlampLink>
                                    ),
                                  },
                                  {
                                    label: t('Completions'),
                                    getter: (childJob: any) =>
                                      `${childJob.status?.succeeded ?? 0}/${
                                        childJob.spec?.completions ?? '-'
                                      }`,
                                  },
                                  {
                                    label: t('Parallelism'),
                                    getter: (childJob: any) => childJob.spec?.parallelism ?? '-',
                                  },
                                  {
                                    label: t('Active'),
                                    getter: (childJob: any) => childJob.status?.active ?? 0,
                                  },
                                ]}
                                emptyMessage={t('No child Jobs found.')}
                              />
                            </SectionBox>
                            <SectionBox title={t('Pods & Metrics')}>
                              <SimpleTable
                                data={childPods}
                                columns={[
                                  {
                                    label: t('Pod'),
                                    getter: (pod: any) => (
                                      <HeadlampLink route={pod.getDetailsLink()}>
                                        {pod.getName()}
                                      </HeadlampLink>
                                    ),
                                  },
                                  { label: t('Phase'), getter: (pod: any) => getPodPhase(pod) },
                                  {
                                    label: t('CPU'),
                                    getter: (pod: any) => metricsLookup[pod.getName()]?.cpu || '-',
                                  },
                                  {
                                    label: t('Memory'),
                                    getter: (pod: any) =>
                                      metricsLookup[pod.getName()]?.memory || '-',
                                  },
                                  {
                                    label: t('GPU Req'),
                                    getter: (pod: any) =>
                                      getGpuQuantity(pod.spec?.containers?.[0]?.resources) || '-',
                                  },
                                  {
                                    label: t('Container Resources'),
                                    getter: (pod: any) =>
                                      getContainerResourceSummary(pod.spec?.containers?.[0]),
                                  },
                                  {
                                    label: t('Scheduling'),
                                    getter: (pod: any) => getUnschedulableMessage(pod) || '-',
                                  },
                                ]}
                                emptyMessage={t('No child Pods found.')}
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
