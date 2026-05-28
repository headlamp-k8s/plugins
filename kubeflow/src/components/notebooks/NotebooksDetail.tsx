import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  ActionButton,
  ConditionsTable,
  DetailsGrid,
  Link as HeadlampLink,
  NameValueTable,
  SectionBox,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { NotebookClass } from '../../resources/notebook';
import { launchNotebookLogs } from '../common/KubeflowLogsViewer';
import { NotebookStatusBadge } from '../common/NotebookStatusBadge';
import { NotebookTypeBadge } from '../common/NotebookTypeBadge';
import { SectionPage } from '../common/SectionPage';

export function NotebooksDetail(props: { namespace?: string; name?: string; node?: any }) {
  const { t } = useTranslation('kubeflow');
  const params = useParams<{ namespace: string; name: string }>();
  const {
    namespace = params.namespace || props.node?.kubeObject?.metadata?.namespace,
    name = params.name || props.node?.kubeObject?.metadata?.name,
  } = props;

  return (
    <SectionPage title={t('kubeflow|Notebook Detail')} apiPath="/apis/kubeflow.org/v1">
      <DetailsGrid
        resourceType={NotebookClass}
        name={name as string}
        namespace={namespace}
        withEvents
        actions={item =>
          item && [
            {
              id: 'kubeflow.notebook-logs',
              action: (
                <ActionButton
                  description={t('kubeflow|View Notebook Logs')}
                  icon="mdi:text-box-outline"
                  onClick={() =>
                    launchNotebookLogs({
                      notebookName: item.metadata.name,
                      namespace: item.metadata.namespace,
                      cluster: item.cluster,
                    })
                  }
                />
              ),
            },
          ]
        }
        extraInfo={item =>
          item && [
            {
              name: t('frequent|Status'),
              value: <NotebookStatusBadge jsonData={item.jsonData} />,
            },
            {
              name: t('frequent|Type'),
              value: (() => {
                const image = item.containerImage;
                if (!image) return '-';
                return <NotebookTypeBadge image={image} />;
              })(),
            },
            {
              name: t('kubeflow|Ready Replicas'),
              value: item.readyReplicas ?? 0,
            },
            {
              name: t('kubeflow|Container Image'),
              value: item.containerImage || '-',
            },
            {
              name: t('kubeflow|Container Port'),
              value: (() => {
                const containers = item.containers;
                if (!containers || containers.length === 0) return '-';
                const ports = containers[0]?.ports || [];
                return (
                  ports
                    .map((p: any) => `${p.name || t('kubeflow|unnamed')}:${p.containerPort}`)
                    .join(', ') || '-'
                );
              })(),
            },
            {
              name: t('kubeflow|Service Account'),
              value: item.spec?.template?.spec?.serviceAccountName || t('frequent|default'),
            },
          ]
        }
        extraSections={item =>
          item && [
            {
              id: 'resource-requirements',
              section: (() => {
                const containers = item.containers;
                if (containers.length === 0) return null;
                const container = containers[0];
                const requests = container?.resources?.requests || {};
                const limits = container?.resources?.limits || {};
                const gpuCount =
                  limits['nvidia.com/gpu'] ||
                  limits['amd.com/gpu'] ||
                  requests['nvidia.com/gpu'] ||
                  requests['amd.com/gpu'];

                return (
                  <SectionBox title={t('kubeflow|Resource Requirements')}>
                    <NameValueTable
                      rows={[
                        {
                          name: t('kubeflow|CPU Request'),
                          value: requests.cpu || t('frequent|Not set'),
                        },
                        {
                          name: t('kubeflow|CPU Limit'),
                          value: limits.cpu || t('frequent|Not set'),
                        },
                        {
                          name: t('kubeflow|Memory Request'),
                          value: requests.memory || t('frequent|Not set'),
                        },
                        {
                          name: t('kubeflow|Memory Limit'),
                          value: limits.memory || t('frequent|Not set'),
                        },
                        {
                          name: t('kubeflow|GPU'),
                          value: gpuCount || t('frequent|None'),
                        },
                      ]}
                    />
                  </SectionBox>
                );
              })(),
            },
            {
              id: 'volumes',
              section: (() => {
                const volumes = item.volumes;
                const volumeMounts = item.containers?.[0]?.volumeMounts || [];
                if (volumeMounts.length === 0) return null;
                return (
                  <SectionBox title={t('frequent|Volumes & Mounts')}>
                    <NameValueTable
                      rows={volumeMounts.map((mount: any) => {
                        const vol = volumes.find((v: any) => v.name === mount.name);
                        let volumeType: React.ReactNode = t('frequent|Unknown');
                        if (vol) {
                          if ((vol as any).persistentVolumeClaim) {
                            const claimName = (vol as any).persistentVolumeClaim.claimName;
                            volumeType = (
                              <Box component="span">
                                {t('kubeflow|PVC:')}{' '}
                                <HeadlampLink
                                  route={`/c/${item.cluster}/persistentvolumeclaims/${item.metadata.namespace}/${claimName}`}
                                >
                                  {claimName}
                                </HeadlampLink>
                              </Box>
                            );
                          } else if ((vol as any).emptyDir !== undefined) {
                            volumeType = t('kubeflow|EmptyDir');
                          } else if ((vol as any).configMap) {
                            volumeType = t('frequent|ConfigMap: {{name}}', {
                              name: (vol as any).configMap.name,
                            });
                          } else if ((vol as any).secret) {
                            volumeType = t('frequent|Secret: {{name}}', {
                              name: (vol as any).secret.secretName,
                            });
                          } else if ((vol as any).hostPath) {
                            volumeType = t('frequent|HostPath: {{path}}', {
                              path: (vol as any).hostPath.path,
                            });
                          }
                        }
                        return {
                          name: (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <Icon icon="mdi:folder-open-outline" />
                              <Typography variant="body2">
                                {mount.name} → {mount.mountPath}
                              </Typography>
                            </Box>
                          ),
                          value: (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              {volumeType}
                              {mount.readOnly ? <> ({t('kubeflow|ReadOnly')})</> : ''}
                            </Box>
                          ),
                        };
                      })}
                    />
                  </SectionBox>
                );
              })(),
            },
            {
              id: 'env-vars',
              section: (() => {
                const containers = item.containers;
                if (containers.length === 0) return null;
                const envVars = containers[0]?.env || [];
                if (envVars.length === 0) return null;
                return (
                  <SectionBox title={t('frequent|Environment Variables')}>
                    <NameValueTable
                      rows={envVars.map((env: any) => ({
                        name: env.name,
                        value: (() => {
                          if (env.value !== undefined && env.value !== null) return env.value;
                          if (env.valueFrom) {
                            if (env.valueFrom.secretKeyRef) {
                              return t('kubeflow|From: Secret {{name}}/{{key}}', {
                                name: env.valueFrom.secretKeyRef.name,
                                key: env.valueFrom.secretKeyRef.key,
                              });
                            }
                            if (env.valueFrom.configMapKeyRef) {
                              return t('kubeflow|From: ConfigMap {{name}}/{{key}}', {
                                name: env.valueFrom.configMapKeyRef.name,
                                key: env.valueFrom.configMapKeyRef.key,
                              });
                            }
                            if (env.valueFrom.fieldRef) {
                              return t('kubeflow|From: FieldRef {{path}}', {
                                path: env.valueFrom.fieldRef.fieldPath,
                              });
                            }
                            return t('kubeflow|From: Unknown source');
                          }
                          return '-';
                        })(),
                      }))}
                    />
                  </SectionBox>
                );
              })(),
            },
            {
              id: 'container-spec',
              section: (() => {
                const containers = item.containers;
                if (containers.length <= 1) return null;
                return (
                  <SectionBox title={t('kubeflow|Additional Containers (Sidecars)')}>
                    <NameValueTable
                      rows={containers.slice(1).map((c: any) => ({
                        name: c.name,
                        value: c.image,
                      }))}
                    />
                  </SectionBox>
                );
              })(),
            },
            {
              id: 'tolerations',
              section: (() => {
                const tolerations = item.spec?.template?.spec?.tolerations || [];
                if (tolerations.length === 0) return null;
                return (
                  <SectionBox title={t('frequent|Tolerations')}>
                    <NameValueTable
                      rows={tolerations.map((t_info: any, i: number) => ({
                        name: t('frequent|Toleration {{index}}', { index: i + 1 }),
                        value: `${t_info.key || '*'}${
                          t_info.operator ? ` ${t_info.operator}` : ''
                        } ${t_info.value || ''} (${t('frequent|Effect: {{effect}}', {
                          effect: t_info.effect || t('frequent|Any'),
                        })})`,
                      }))}
                    />
                  </SectionBox>
                );
              })(),
            },
            {
              id: 'conditions',
              section: (() => {
                const conditions = item.status?.conditions || [];
                if (conditions.length === 0) return null;
                return (
                  <SectionBox title={t('frequent|Conditions')}>
                    <ConditionsTable resource={item.jsonData} />
                  </SectionBox>
                );
              })(),
            },
          ]
        }
      />
    </SectionPage>
  );
}
