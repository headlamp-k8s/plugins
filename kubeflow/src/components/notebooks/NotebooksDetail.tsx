import { Icon } from '@iconify/react';
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

export function NotebooksDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <SectionPage title="Notebook Detail" apiPath="/apis/kubeflow.org/v1">
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
                  description="View Notebook Logs"
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
              name: 'Status',
              value: <NotebookStatusBadge jsonData={item.jsonData} />,
            },
            {
              name: 'Type',
              value: (() => {
                const image = item.containerImage;
                if (!image) return '-';
                return <NotebookTypeBadge image={image} />;
              })(),
            },
            {
              name: 'Ready Replicas',
              value: item.readyReplicas ?? 0,
            },
            {
              name: 'Container Image',
              value: item.containerImage || '-',
            },
            {
              name: 'Container Port',
              value: (() => {
                const containers = item.containers;
                if (!containers || containers.length === 0) return '-';
                const ports = containers[0]?.ports || [];
                return (
                  ports.map((p: any) => `${p.name || 'unnamed'}:${p.containerPort}`).join(', ') ||
                  '-'
                );
              })(),
            },
            {
              name: 'Service Account',
              value: item.spec?.template?.spec?.serviceAccountName || 'default',
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
                  <SectionBox title="Resource Requirements">
                    <NameValueTable
                      rows={[
                        { name: 'CPU Request', value: requests.cpu || 'Not set' },
                        { name: 'CPU Limit', value: limits.cpu || 'Not set' },
                        { name: 'Memory Request', value: requests.memory || 'Not set' },
                        { name: 'Memory Limit', value: limits.memory || 'Not set' },
                        {
                          name: 'GPU',
                          value: gpuCount || 'None',
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
                  <SectionBox title="Volumes & Mounts">
                    <NameValueTable
                      rows={volumeMounts.map((mount: any) => {
                        const vol = volumes.find((v: any) => v.name === mount.name);
                        let volumeType: React.ReactNode = 'Unknown';
                        if (vol) {
                          if ((vol as any).persistentVolumeClaim) {
                            const claimName = (vol as any).persistentVolumeClaim.claimName;
                            volumeType = (
                              <Box component="span">
                                PVC:{' '}
                                <HeadlampLink
                                  route={`/c/${item.cluster}/persistentvolumeclaims/${item.metadata.namespace}/${claimName}`}
                                >
                                  {claimName}
                                </HeadlampLink>
                              </Box>
                            );
                          } else if ((vol as any).emptyDir !== undefined) {
                            volumeType = 'EmptyDir';
                          } else if ((vol as any).configMap) {
                            volumeType = `ConfigMap: ${(vol as any).configMap.name}`;
                          } else if ((vol as any).secret) {
                            volumeType = `Secret: ${(vol as any).secret.secretName}`;
                          } else if ((vol as any).hostPath) {
                            volumeType = `HostPath: ${(vol as any).hostPath.path}`;
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
                              {mount.readOnly ? ' (ReadOnly)' : ''}
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
                  <SectionBox title="Environment Variables">
                    <NameValueTable
                      rows={envVars.map((env: any) => ({
                        name: env.name,
                        value: (() => {
                          if (env.value !== undefined && env.value !== null) return env.value;
                          if (env.valueFrom) {
                            if (env.valueFrom.secretKeyRef) {
                              return `From: Secret ${env.valueFrom.secretKeyRef.name}/${env.valueFrom.secretKeyRef.key}`;
                            }
                            if (env.valueFrom.configMapKeyRef) {
                              return `From: ConfigMap ${env.valueFrom.configMapKeyRef.name}/${env.valueFrom.configMapKeyRef.key}`;
                            }
                            if (env.valueFrom.fieldRef) {
                              return `From: FieldRef ${env.valueFrom.fieldRef.fieldPath}`;
                            }
                            return 'From: Unknown source';
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
                  <SectionBox title="Additional Containers (Sidecars)">
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
                  <SectionBox title="Tolerations">
                    <NameValueTable
                      rows={tolerations.map((t: any, i: number) => ({
                        name: `Toleration ${i + 1}`,
                        value: `${t.key || '*'}${t.operator ? ` ${t.operator}` : ''} ${
                          t.value || ''
                        } (Effect: ${t.effect || 'Any'})`,
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
                  <SectionBox title="Conditions">
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
