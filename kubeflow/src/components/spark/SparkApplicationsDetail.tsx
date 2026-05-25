import { K8s } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  ConditionsTable,
  DetailsGrid,
  LightTooltip,
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import yaml from 'js-yaml';
import React from 'react';
import { useParams } from 'react-router-dom';
import { SparkApplicationClass } from '../../resources/sparkApplication';
import { KubeflowDiffViewerAction } from '../common/KubeflowDiffViewerAction';
import { KubeflowJsonViewerAction } from '../common/KubeflowJsonViewerAction';
import { launchPodLogs } from '../common/KubeflowLogsViewer';
import { SectionPage } from '../common/SectionPage';
import { SparkApplicationStatusBadge } from '../common/SparkApplicationStatusBadge';
import { SparkApplicationTypeBadge } from '../common/SparkApplicationTypeBadge';
import {
  describeSparkVolume,
  getLastAppliedSparkSpec,
  getSparkExecutorSummary,
  getSparkPodRows,
  getSparkSecurityWarnings,
} from '../common/sparkUtils';
import { SparkRbacSection } from './SparkRbacSection';

function getPodRoute(cluster: string | undefined, namespace: string, name: string) {
  return `/c/${cluster || 'main'}/namespaces/${namespace}/pods/${name}`;
}

function getServiceRoute(cluster: string | undefined, namespace: string, name: string) {
  return `/c/${cluster || 'main'}/namespaces/${namespace}/services/${name}`;
}

function getVolumeMountRows(sparkApplication: SparkApplicationClass) {
  const volumes = sparkApplication.spec.volumes ?? [];
  const sections = [
    {
      scope: 'Driver',
      mounts: sparkApplication.driverSpec.volumeMounts ?? [],
    },
    {
      scope: 'Executor',
      mounts: sparkApplication.executorSpec.volumeMounts ?? [],
    },
  ];

  return sections.flatMap(section =>
    section.mounts.map((mount: any) => {
      const volume = volumes.find((candidate: any) => candidate.name === mount.name);

      return {
        component: section.scope,
        mount: `${mount.name} -> ${mount.mountPath}`,
        source: `${describeSparkVolume(volume)}${mount.readOnly ? ' (ReadOnly)' : ''}`,
      };
    })
  );
}

export function SparkApplicationsDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;
  const [podsByOperatorLabel] = K8s.ResourceClasses.Pod.useList({
    namespace,
    labelSelector: `sparkoperator.k8s.io/app-name=${name}`,
  });
  const [podsByLegacyLabel] = K8s.ResourceClasses.Pod.useList({
    namespace,
    labelSelector: `spark-app-name=${name}`,
  });

  const relatedPods = React.useMemo(() => {
    const mergedPods = [...(podsByOperatorLabel ?? []), ...(podsByLegacyLabel ?? [])];
    const seen = new Set<string>();

    return mergedPods.filter(pod => {
      const podName = pod.metadata?.name;
      if (!podName || seen.has(podName)) {
        return false;
      }

      seen.add(podName);
      return true;
    });
  }, [podsByLegacyLabel, podsByOperatorLabel]);

  return (
    <SectionPage title="Spark Application Detail" apiPath="/apis/sparkoperator.k8s.io/v1beta2">
      <DetailsGrid
        resourceType={SparkApplicationClass}
        name={name as string}
        namespace={namespace}
        withEvents
        actions={item => {
          if (!item) {
            return [];
          }

          const lastAppliedSpec = getLastAppliedSparkSpec(item);

          return [
            ...(item.driverPodName
              ? [
                  {
                    id: 'kubeflow.spark-driver-logs',
                    action: (
                      <ActionButton
                        description="View Driver Logs"
                        icon="mdi:text-box-outline"
                        onClick={() =>
                          launchPodLogs({
                            podName: item.driverPodName,
                            namespace: item.metadata.namespace,
                            cluster: item.cluster,
                            title: `Driver Logs: ${item.metadata.name}`,
                          })
                        }
                      />
                    ),
                  },
                ]
              : []),
            {
              id: 'kubeflow.spark-raw-json',
              action: (
                <KubeflowJsonViewerAction
                  title="View Raw JSON"
                  value={item.jsonData}
                  activityId={`json-spark-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
            {
              id: 'kubeflow.spark-raw-yaml',
              action: (
                <KubeflowJsonViewerAction
                  title="View Raw YAML"
                  value={yaml.dump(item.jsonData)}
                  language="yaml"
                  activityId={`yaml-spark-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
            ...(lastAppliedSpec
              ? [
                  {
                    id: 'kubeflow.spark-last-applied-diff',
                    action: (
                      <KubeflowDiffViewerAction
                        title="Compare Live vs Last Applied Spec"
                        original={yaml.dump(lastAppliedSpec)}
                        modified={yaml.dump(item.spec)}
                        originalLabel="Last Applied"
                        modifiedLabel="Live Spec"
                        activityId={`diff-spark-${item.metadata.namespace}-${item.metadata.name}`}
                      />
                    ),
                  },
                ]
              : []),
          ];
        }}
        extraInfo={item =>
          item && [
            {
              name: 'Status',
              value: <SparkApplicationStatusBadge sparkApplication={item} />,
            },
            {
              name: 'Type',
              value: <SparkApplicationTypeBadge type={item.applicationType} />,
            },
            {
              name: 'Spark Version',
              value: item.sparkVersion || '-',
            },
            {
              name: 'Mode',
              value: item.mode || '-',
            },
            {
              name: 'Spark UI',
              value: item.driverInfo.webUIServiceName ? (
                <HeadlampLink
                  route={getServiceRoute(
                    item.cluster,
                    item.metadata.namespace,
                    item.driverInfo.webUIServiceName
                  )}
                >
                  {item.driverInfo.webUIServiceName}
                </HeadlampLink>
              ) : (
                '-'
              ),
            },
            {
              name: 'Driver Pod',
              value: item.driverPodName || '-',
            },
            {
              name: 'Executors',
              value: getSparkExecutorSummary(item),
            },
            {
              name: 'Service Account',
              value: item.serviceAccountName || 'default',
            },
            {
              name: 'Main File',
              value: item.spec.mainApplicationFile || '-',
            },
            {
              name: 'Main Class',
              value: item.spec.mainClass || '-',
            },
            {
              name: 'Submission Attempts',
              value: item.submissionAttempts || '-',
            },
            {
              name: 'Execution Attempts',
              value: item.executionAttempts || '-',
            },
          ]
        }
        extraSections={item => {
          if (!item) {
            return [];
          }

          const podRows = getSparkPodRows(relatedPods, item);
          const volumeMountRows = getVolumeMountRows(item);
          const securityWarnings = getSparkSecurityWarnings(item.spec);
          const sparkConfEntries = Object.entries(item.spec.sparkConf ?? {});
          const hadoopConfEntries = Object.entries(item.spec.hadoopConf ?? {});
          const argumentsList = item.spec.arguments ?? [];
          const dynamicAllocation = item.spec.dynamicAllocation;
          const monitoring = item.spec.monitoring;

          return [
            {
              id: 'spark-health-summary',
              section: (
                <SectionBox title="Health Summary">
                  <NameValueTable
                    rows={[
                      {
                        name: 'Application State',
                        value: <SparkApplicationStatusBadge sparkApplication={item} />,
                      },
                      {
                        name: 'Driver State Source',
                        value: item.applicationStateLabel || '-',
                      },
                      {
                        name: 'Submission ID',
                        value: item.status?.submissionID || '-',
                      },
                      {
                        name: 'Spark Application ID',
                        value: item.status?.sparkApplicationId || '-',
                      },
                      {
                        name: 'Last Submission Attempt',
                        value: item.lastSubmissionAttemptTime || '-',
                      },
                      {
                        name: 'Termination Time',
                        value: item.terminationTime || '-',
                      },
                      {
                        name: 'Error Message',
                        value: item.applicationErrorMessage || '-',
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'spark-topology',
              section: podRows.length > 0 && (
                <SectionBox title="Driver & Executor Topology">
                  <SimpleTable
                    data={podRows}
                    columns={[
                      { label: 'Role', getter: row => row.role },
                      {
                        label: 'Pod',
                        getter: row =>
                          row.rawPod ? (
                            <HeadlampLink
                              route={getPodRoute(item.cluster, item.metadata.namespace, row.name)}
                            >
                              {row.name}
                            </HeadlampLink>
                          ) : (
                            row.name
                          ),
                      },
                      {
                        label: 'Phase',
                        getter: row => row.phase || '-',
                      },
                      {
                        label: 'Restarts',
                        getter: row => row.restartCount,
                      },
                      {
                        label: 'Node',
                        getter: row => row.nodeName,
                      },
                      {
                        label: 'Pod IP',
                        getter: row => row.podIP,
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'spark-logs',
              section: (
                <SectionBox title="Logs">
                  <NameValueTable
                    rows={[
                      {
                        name: 'Driver',
                        value: item.driverPodName ? (
                          <ActionButton
                            description={`Open ${item.driverPodName}`}
                            icon="mdi:text-box-outline"
                            onClick={() =>
                              launchPodLogs({
                                podName: item.driverPodName,
                                namespace: item.metadata.namespace,
                                cluster: item.cluster,
                                title: `Driver Logs: ${item.metadata.name}`,
                              })
                            }
                          />
                        ) : (
                          '-'
                        ),
                      },
                      ...podRows
                        .filter(row => row.role === 'Executor')
                        .map(row => ({
                          name: row.name,
                          value: (
                            <ActionButton
                              description={`Open ${row.name}`}
                              icon="mdi:text-box-outline"
                              onClick={() =>
                                launchPodLogs({
                                  podName: row.name,
                                  namespace: item.metadata.namespace,
                                  cluster: item.cluster,
                                  title: `Executor Logs: ${row.name}`,
                                })
                              }
                            />
                          ),
                        })),
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'spark-resources-scaling',
              section: (
                <SectionBox title="Resources & Scaling">
                  <NameValueTable
                    rows={[
                      {
                        name: 'Driver CPU',
                        value: item.driverSpec.cores
                          ? `${item.driverSpec.cores} core(s)`
                          : item.driverSpec.coreRequest || '-',
                      },
                      {
                        name: 'Driver CPU Limit',
                        value: item.driverSpec.coreLimit || '-',
                      },
                      {
                        name: 'Driver Memory',
                        value: item.driverSpec.memory || '-',
                      },
                      {
                        name: 'Driver Memory Overhead',
                        value: item.driverSpec.memoryOverhead || '-',
                      },
                      {
                        name: 'Driver GPU',
                        value: item.driverSpec.gpu
                          ? `${item.driverSpec.gpu.quantity}x ${item.driverSpec.gpu.name}`
                          : '-',
                      },
                      {
                        name: 'Executor CPU',
                        value: item.executorSpec.cores
                          ? `${item.executorSpec.cores} core(s)`
                          : item.executorSpec.coreRequest || '-',
                      },
                      {
                        name: 'Executor CPU Limit',
                        value: item.executorSpec.coreLimit || '-',
                      },
                      {
                        name: 'Executor Memory',
                        value: item.executorSpec.memory || '-',
                      },
                      {
                        name: 'Executor Memory Overhead',
                        value: item.executorSpec.memoryOverhead || '-',
                      },
                      {
                        name: 'Executor GPU',
                        value: item.executorSpec.gpu
                          ? `${item.executorSpec.gpu.quantity}x ${item.executorSpec.gpu.name}`
                          : '-',
                      },
                      {
                        name: 'Desired Executors',
                        value: item.executorSpec.instances ?? '-',
                      },
                      {
                        name: 'Dynamic Allocation',
                        value: dynamicAllocation?.enabled ? (
                          <Box>
                            Enabled (Min: {dynamicAllocation.minExecutors ?? 0}, Max:{' '}
                            {dynamicAllocation.maxExecutors ?? '∞'})
                          </Box>
                        ) : (
                          'Disabled'
                        ),
                      },
                      {
                        name: 'Batch Scheduler',
                        value: item.spec.batchScheduler || '-',
                      },
                      {
                        name: 'Queue',
                        value: item.spec.batchSchedulerOptions?.queue || '-',
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'spark-env-vars',
              section: (() => {
                const driverEnvVars = Object.entries(item.driverSpec.envVars ?? {}).map(
                  ([name, value]) => ({ name, value })
                );
                const driverEnv = (item.driverSpec.env ?? []).map((env: any) => ({
                  name: env.name,
                  value: env.value ?? (env.valueFrom ? 'From: [valueFrom]' : '-'),
                }));
                const allDriverEnv = [...driverEnvVars, ...driverEnv];

                const executorEnvVars = Object.entries(item.executorSpec.envVars ?? {}).map(
                  ([name, value]) => ({ name, value })
                );
                const executorEnv = (item.executorSpec.env ?? []).map((env: any) => ({
                  name: env.name,
                  value: env.value ?? (env.valueFrom ? 'From: [valueFrom]' : '-'),
                }));
                const allExecutorEnv = [...executorEnvVars, ...executorEnv];

                if (allDriverEnv.length === 0 && allExecutorEnv.length === 0) {
                  return null;
                }

                return (
                  <SectionBox title="Environment Variables">
                    <Box sx={{ display: 'grid', gap: 3 }}>
                      {allDriverEnv.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                            Driver
                          </Typography>
                          <NameValueTable rows={allDriverEnv} />
                        </Box>
                      )}
                      {allExecutorEnv.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                            Executor
                          </Typography>
                          <NameValueTable rows={allExecutorEnv} />
                        </Box>
                      )}
                    </Box>
                  </SectionBox>
                );
              })(),
            },
            {
              id: 'spark-placement',
              section: (
                <SectionBox title="Scheduling & Placement">
                  <NameValueTable
                    rows={[
                      {
                        name: 'Driver Node Selector',
                        value: JSON.stringify(item.driverSpec.nodeSelector) || '-',
                      },
                      {
                        name: 'Executor Node Selector',
                        value: JSON.stringify(item.executorSpec.nodeSelector) || '-',
                      },
                      {
                        name: 'Driver Affinity',
                        value: item.driverSpec.affinity ? 'Configured' : '-',
                      },
                      {
                        name: 'Executor Affinity',
                        value: item.executorSpec.affinity ? 'Configured' : '-',
                      },
                      {
                        name: 'Driver Tolerations',
                        value: item.driverSpec.tolerations?.length || '-',
                      },
                      {
                        name: 'Executor Tolerations',
                        value: item.executorSpec.tolerations?.length || '-',
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'spark-config-mounts',
              section: (
                <SectionBox title="Config & Mount Inspection">
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <NameValueTable
                      rows={[
                        {
                          name: 'Spark ConfigMap',
                          value: item.spec.sparkConfigMap || '-',
                        },
                        {
                          name: 'Hadoop ConfigMap',
                          value: item.spec.hadoopConfigMap || '-',
                        },
                        {
                          name: 'Driver ConfigMaps',
                          value:
                            item.driverSpec.configMaps
                              ?.map(configMap => configMap.name)
                              .join(', ') || '-',
                        },
                        {
                          name: 'Executor ConfigMaps',
                          value:
                            item.executorSpec.configMaps
                              ?.map(configMap => configMap.name)
                              .join(', ') || '-',
                        },
                      ]}
                    />

                    {volumeMountRows.length > 0 && (
                      <SimpleTable
                        data={volumeMountRows}
                        columns={[
                          { label: 'Component', getter: row => row.component },
                          { label: 'Mount', getter: row => row.mount },
                          { label: 'Source', getter: row => row.source },
                        ]}
                      />
                    )}

                    {(sparkConfEntries.length > 0 || hadoopConfEntries.length > 0) && (
                      <SimpleTable
                        data={[
                          ...sparkConfEntries.map(([key, value]) => ({
                            scope: 'Spark',
                            key,
                            value,
                          })),
                          ...hadoopConfEntries.map(([key, value]) => ({
                            scope: 'Hadoop',
                            key,
                            value,
                          })),
                        ]}
                        columns={[
                          { label: 'Scope', getter: row => row.scope },
                          { label: 'Key', getter: row => row.key },
                          {
                            label: 'Value',
                            getter: row => (
                              <LightTooltip title={row.value} interactive>
                                <span>{row.value}</span>
                              </LightTooltip>
                            ),
                          },
                        ]}
                      />
                    )}
                  </Box>
                </SectionBox>
              ),
            },
            {
              id: 'spark-application-definition',
              section: (
                <SectionBox title="Application Definition">
                  <NameValueTable
                    rows={[
                      {
                        name: 'Image',
                        value: item.spec.image || item.driverSpec.image || '-',
                      },
                      {
                        name: 'Image Pull Policy',
                        value: item.spec.imagePullPolicy || '-',
                      },
                      {
                        name: 'Python Version',
                        value: item.spec.pythonVersion || '-',
                      },
                      {
                        name: 'Restart Policy',
                        value: item.spec.restartPolicy?.type || '-',
                      },
                      {
                        name: 'Arguments',
                        value: argumentsList.length > 0 ? argumentsList.join(' ') : '-',
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'spark-monitoring',
              section: monitoring && (
                <SectionBox title="Monitoring">
                  <NameValueTable
                    rows={[
                      {
                        name: 'Expose Driver Metrics',
                        value: monitoring.exposeDriverMetrics ? 'Yes' : 'No',
                      },
                      {
                        name: 'Expose Executor Metrics',
                        value: monitoring.exposeExecutorMetrics ? 'Yes' : 'No',
                      },
                      {
                        name: 'Prometheus Monitoring',
                        value: monitoring.prometheus ? 'Enabled' : 'Disabled',
                      },
                      {
                        name: 'Metrics Properties File',
                        value: monitoring.metricsPropertiesFile || '-',
                      },
                    ]}
                  />
                </SectionBox>
              ),
            },
            {
              id: 'spark-rbac',
              section: <SparkRbacSection sparkApplication={item} />,
            },
            {
              id: 'spark-security',
              section:
                securityWarnings.length > 0 ? (
                  <SectionBox title="Security Notes">
                    <Box sx={{ display: 'grid', gap: 2 }}>
                      {securityWarnings.map(warning => (
                        <Alert key={warning} severity="warning" variant="outlined">
                          {warning}
                        </Alert>
                      ))}
                    </Box>
                  </SectionBox>
                ) : null,
            },
            {
              id: 'spark-advanced',
              section: (
                <SectionBox title="Advanced">
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      Use the actions above to inspect the raw JSON/YAML or compare the live spec to
                      the last applied manifest when the cluster stores declarative history.
                    </Typography>
                    <NameValueTable
                      rows={[
                        {
                          name: 'Last Applied Diff Available',
                          value: item.metadata.annotations?.[
                            'kubectl.kubernetes.io/last-applied-configuration'
                          ]
                            ? 'Yes'
                            : 'No',
                        },
                        {
                          name: 'TTL Seconds',
                          value: item.spec.timeToLiveSeconds ?? '-',
                        },
                        {
                          name: 'Submission Mode',
                          value: item.mode || '-',
                        },
                      ]}
                    />
                  </Box>
                </SectionBox>
              ),
            },
            {
              id: 'spark-conditions',
              section: (item.jsonData.status as any)?.conditions?.length > 0 && (
                <SectionBox title="Conditions">
                  <ConditionsTable resource={item.jsonData} />
                </SectionBox>
              ),
            },
          ].filter(section => !!section.section);
        }}
      />
    </SectionPage>
  );
}
