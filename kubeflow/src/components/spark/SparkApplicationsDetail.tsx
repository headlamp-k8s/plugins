import { K8s, useTranslation } from '@kinvolk/headlamp-plugin/lib';
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

export function SparkApplicationsDetail(props: { namespace?: string; name?: string; node?: any }) {
  const { t } = useTranslation();
  const params = useParams<{ namespace: string; name: string }>();
  const {
    namespace = params.namespace || props.node?.kubeObject?.metadata?.namespace,
    name = params.name || props.node?.kubeObject?.metadata?.name,
  } = props;

  function getVolumeMountRows(sparkApplication: SparkApplicationClass) {
    const volumes = sparkApplication.spec.volumes ?? [];
    const sections = [
      {
        scope: t('Driver'),
        mounts: sparkApplication.driverSpec.volumeMounts ?? [],
      },
      {
        scope: t('Executor'),
        mounts: sparkApplication.executorSpec.volumeMounts ?? [],
      },
    ];

    return sections.flatMap(section =>
      section.mounts.map((mount: any) => {
        const volume = volumes.find((candidate: any) => candidate.name === mount.name);

        return {
          component: section.scope,
          mount: `${mount.name} -> ${mount.mountPath}`,
          source: `${describeSparkVolume(volume)}${mount.readOnly ? t(' (ReadOnly)') : ''}`,
        };
      })
    );
  }

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
    <SectionPage title={t('Spark Application Detail')} apiPath="/apis/sparkoperator.k8s.io/v1beta2">
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
                        description={t('View Driver Logs')}
                        icon="mdi:text-box-outline"
                        onClick={() =>
                          launchPodLogs({
                            podName: item.driverPodName,
                            namespace: item.metadata.namespace,
                            cluster: item.cluster,
                            title: t('Driver Logs: {{name}}', { name: item.metadata.name }),
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
                  title={t('View Raw JSON')}
                  value={item.jsonData}
                  activityId={`json-spark-${item.metadata.namespace}-${item.metadata.name}`}
                />
              ),
            },
            {
              id: 'kubeflow.spark-raw-yaml',
              action: (
                <KubeflowJsonViewerAction
                  title={t('View Raw YAML')}
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
                        title={t('Compare Live vs Last Applied Spec')}
                        original={yaml.dump(lastAppliedSpec)}
                        modified={yaml.dump(item.spec)}
                        originalLabel={t('Last Applied')}
                        modifiedLabel={t('Live Spec')}
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
              name: t('Status'),
              value: <SparkApplicationStatusBadge sparkApplication={item} />,
            },
            {
              name: t('Type'),
              value: <SparkApplicationTypeBadge type={item.applicationType} />,
            },
            {
              name: t('Spark Version'),
              value: item.sparkVersion || '-',
            },
            {
              name: t('Mode'),
              value: item.mode || '-',
            },
            {
              name: t('Spark UI'),
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
              name: t('Driver Pod'),
              value: item.driverPodName || '-',
            },
            {
              name: t('Executors'),
              value: getSparkExecutorSummary(item),
            },
            {
              name: t('Service Account'),
              value: item.serviceAccountName || t('default'),
            },
            {
              name: t('Main File'),
              value: item.spec.mainApplicationFile || '-',
            },
            {
              name: t('Main Class'),
              value: item.spec.mainClass || '-',
            },
            {
              name: t('Submission Attempts'),
              value: item.submissionAttempts || '-',
            },
            {
              name: t('Execution Attempts'),
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
                <SectionBox title={t('Health Summary')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('Application State'),
                        value: <SparkApplicationStatusBadge sparkApplication={item} />,
                      },
                      {
                        name: t('Driver State Source'),
                        value: item.applicationStateLabel || '-',
                      },
                      {
                        name: t('Submission ID'),
                        value: item.status?.submissionID || '-',
                      },
                      {
                        name: t('Spark Application ID'),
                        value: item.status?.sparkApplicationId || '-',
                      },
                      {
                        name: t('Last Submission Attempt'),
                        value: item.lastSubmissionAttemptTime || '-',
                      },
                      {
                        name: t('Termination Time'),
                        value: item.terminationTime || '-',
                      },
                      {
                        name: t('Error Message'),
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
                <SectionBox title={t('Driver & Executor Topology')}>
                  <SimpleTable
                    data={podRows}
                    columns={[
                      { label: t('Role'), getter: row => row.role },
                      {
                        label: t('Pod'),
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
                        label: t('Phase'),
                        getter: row => row.phase || '-',
                      },
                      {
                        label: t('Restarts'),
                        getter: row => row.restartCount,
                      },
                      {
                        label: t('Node'),
                        getter: row => row.nodeName,
                      },
                      {
                        label: t('Pod IP'),
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
                <SectionBox title={t('Logs')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('Driver'),
                        value: item.driverPodName ? (
                          <ActionButton
                            description={t('Open {{name}}', { name: item.driverPodName })}
                            icon="mdi:text-box-outline"
                            onClick={() =>
                              launchPodLogs({
                                podName: item.driverPodName,
                                namespace: item.metadata.namespace,
                                cluster: item.cluster,
                                title: t('Driver Logs: {{name}}', { name: item.metadata.name }),
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
                              description={t('Open {{name}}', { name: row.name })}
                              icon="mdi:text-box-outline"
                              onClick={() =>
                                launchPodLogs({
                                  podName: row.name,
                                  namespace: item.metadata.namespace,
                                  cluster: item.cluster,
                                  title: t('Executor Logs: {{name}}', { name: row.name }),
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
                <SectionBox title={t('Resources & Scaling')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('Driver CPU'),
                        value: item.driverSpec.cores
                          ? t('{{count}} core(s)', { count: item.driverSpec.cores })
                          : item.driverSpec.coreRequest || '-',
                      },
                      {
                        name: t('Driver CPU Limit'),
                        value: item.driverSpec.coreLimit || '-',
                      },
                      {
                        name: t('Driver Memory'),
                        value: item.driverSpec.memory || '-',
                      },
                      {
                        name: t('Driver Memory Overhead'),
                        value: item.driverSpec.memoryOverhead || '-',
                      },
                      {
                        name: t('Driver GPU'),
                        value: item.driverSpec.gpu
                          ? t('{{count}}x {{name}}', {
                              count: item.driverSpec.gpu.quantity,
                              name: item.driverSpec.gpu.name,
                            })
                          : '-',
                      },
                      {
                        name: t('Executor CPU'),
                        value: item.executorSpec.cores
                          ? t('{{count}} core(s)', { count: item.executorSpec.cores })
                          : item.executorSpec.coreRequest || '-',
                      },
                      {
                        name: t('Executor CPU Limit'),
                        value: item.executorSpec.coreLimit || '-',
                      },
                      {
                        name: t('Executor Memory'),
                        value: item.executorSpec.memory || '-',
                      },
                      {
                        name: t('Executor Memory Overhead'),
                        value: item.executorSpec.memoryOverhead || '-',
                      },
                      {
                        name: t('Executor GPU'),
                        value: item.executorSpec.gpu
                          ? t('{{count}}x {{name}}', {
                              count: item.executorSpec.gpu.quantity,
                              name: item.executorSpec.gpu.name,
                            })
                          : '-',
                      },
                      {
                        name: t('Desired Executors'),
                        value: item.executorSpec.instances ?? '-',
                      },
                      {
                        name: t('Dynamic Allocation'),
                        value: dynamicAllocation?.enabled ? (
                          <Box>
                            {t('Enabled (Min: {{min}}, Max: {{max}})', {
                              min: dynamicAllocation.minExecutors ?? 0,
                              max: dynamicAllocation.maxExecutors ?? '∞',
                            })}
                          </Box>
                        ) : (
                          t('Disabled')
                        ),
                      },
                      {
                        name: t('Batch Scheduler'),
                        value: item.spec.batchScheduler || '-',
                      },
                      {
                        name: t('Queue'),
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
                  value: env.value ?? (env.valueFrom ? t('From: [valueFrom]') : '-'),
                }));
                const allDriverEnv = [...driverEnvVars, ...driverEnv];

                const executorEnvVars = Object.entries(item.executorSpec.envVars ?? {}).map(
                  ([name, value]) => ({ name, value })
                );
                const executorEnv = (item.executorSpec.env ?? []).map((env: any) => ({
                  name: env.name,
                  value: env.value ?? (env.valueFrom ? t('From: [valueFrom]') : '-'),
                }));
                const allExecutorEnv = [...executorEnvVars, ...executorEnv];

                if (allDriverEnv.length === 0 && allExecutorEnv.length === 0) {
                  return null;
                }

                return (
                  <SectionBox title={t('Environment Variables')}>
                    <Box sx={{ display: 'grid', gap: 3 }}>
                      {allDriverEnv.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                            {t('Driver')}
                          </Typography>
                          <NameValueTable rows={allDriverEnv} />
                        </Box>
                      )}
                      {allExecutorEnv.length > 0 && (
                        <Box>
                          <Typography variant="subtitle2" sx={{ mb: 1, color: 'text.secondary' }}>
                            {t('Executor')}
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
                <SectionBox title={t('Scheduling & Placement')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('Driver Node Selector'),
                        value: JSON.stringify(item.driverSpec.nodeSelector) || '-',
                      },
                      {
                        name: t('Executor Node Selector'),
                        value: JSON.stringify(item.executorSpec.nodeSelector) || '-',
                      },
                      {
                        name: t('Driver Affinity'),
                        value: item.driverSpec.affinity ? t('Configured') : '-',
                      },
                      {
                        name: t('Executor Affinity'),
                        value: item.executorSpec.affinity ? t('Configured') : '-',
                      },
                      {
                        name: t('Driver Tolerations'),
                        value: item.driverSpec.tolerations?.length || '-',
                      },
                      {
                        name: t('Executor Tolerations'),
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
                <SectionBox title={t('Config & Mount Inspection')}>
                  <Box sx={{ display: 'grid', gap: 2 }}>
                    <NameValueTable
                      rows={[
                        {
                          name: t('Spark ConfigMap'),
                          value: item.spec.sparkConfigMap || '-',
                        },
                        {
                          name: t('Hadoop ConfigMap'),
                          value: item.spec.hadoopConfigMap || '-',
                        },
                        {
                          name: t('Driver ConfigMaps'),
                          value:
                            item.driverSpec.configMaps
                              ?.map(configMap => configMap.name)
                              .join(', ') || '-',
                        },
                        {
                          name: t('Executor ConfigMaps'),
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
                          { label: t('Component'), getter: row => row.component },
                          { label: t('Mount'), getter: row => row.mount },
                          { label: t('Source'), getter: row => row.source },
                        ]}
                      />
                    )}

                    {(sparkConfEntries.length > 0 || hadoopConfEntries.length > 0) && (
                      <SimpleTable
                        data={[
                          ...sparkConfEntries.map(([key, value]) => ({
                            scope: t('Spark'),
                            key,
                            value,
                          })),
                          ...hadoopConfEntries.map(([key, value]) => ({
                            scope: t('Hadoop'),
                            key,
                            value,
                          })),
                        ]}
                        columns={[
                          { label: t('Scope'), getter: row => row.scope },
                          { label: t('Key'), getter: row => row.key },
                          {
                            label: t('Value'),
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
                <SectionBox title={t('Application Definition')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('Image'),
                        value: item.spec.image || item.driverSpec.image || '-',
                      },
                      {
                        name: t('Image Pull Policy'),
                        value: item.spec.imagePullPolicy || '-',
                      },
                      {
                        name: t('Python Version'),
                        value: item.spec.pythonVersion || '-',
                      },
                      {
                        name: t('Restart Policy'),
                        value: item.spec.restartPolicy?.type || '-',
                      },
                      {
                        name: t('Arguments'),
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
                <SectionBox title={t('Monitoring')}>
                  <NameValueTable
                    rows={[
                      {
                        name: t('Expose Driver Metrics'),
                        value: monitoring.exposeDriverMetrics ? t('Yes') : t('No'),
                      },
                      {
                        name: t('Expose Executor Metrics'),
                        value: monitoring.exposeExecutorMetrics ? t('Yes') : t('No'),
                      },
                      {
                        name: t('Prometheus Monitoring'),
                        value: monitoring.prometheus ? t('Enabled') : t('Disabled'),
                      },
                      {
                        name: t('Metrics Properties File'),
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
                  <SectionBox title={t('Security Notes')}>
                    <Box sx={{ display: 'grid', gap: 2 }}>
                      {securityWarnings.map(warning => (
                        <Alert key={warning} severity="warning" variant="outlined">
                          {t(warning)}
                        </Alert>
                      ))}
                    </Box>
                  </SectionBox>
                ) : null,
            },
            {
              id: 'spark-advanced',
              section: (
                <SectionBox title={t('Advanced')}>
                  <Box sx={{ display: 'grid', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: 'text.secondary' }}>
                      {t(
                        'Use the actions above to inspect the raw JSON/YAML or compare the live spec to the last applied manifest when the cluster stores declarative history.'
                      )}
                    </Typography>
                    <NameValueTable
                      rows={[
                        {
                          name: t('Last Applied Diff Available'),
                          value: item.metadata.annotations?.[
                            'kubectl.kubernetes.io/last-applied-configuration'
                          ]
                            ? t('Yes')
                            : t('No'),
                        },
                        {
                          name: t('TTL Seconds'),
                          value: item.spec.timeToLiveSeconds ?? '-',
                        },
                        {
                          name: t('Submission Mode'),
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
                <SectionBox title={t('Conditions')}>
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
