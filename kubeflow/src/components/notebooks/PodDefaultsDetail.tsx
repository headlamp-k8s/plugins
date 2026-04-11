import { Icon } from '@iconify/react';
import {
  DetailsGrid,
  NameValueTable,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Typography } from '@mui/material';
import { useParams } from 'react-router-dom';
import { PodDefaultClass } from '../../resources/podDefault';
import { SectionPage } from '../common/SectionPage';

export function PodDefaultsDetail(props: { namespace?: string; name?: string }) {
  const params = useParams<{ namespace: string; name: string }>();
  const { namespace = params.namespace, name = params.name } = props;

  return (
    <SectionPage title="PodDefault Detail" apiPath="/apis/kubeflow.org/v1alpha1">
      <DetailsGrid
        resourceType={PodDefaultClass}
        name={name as string}
        namespace={namespace}
        withEvents
        extraInfo={item =>
          item && [
            {
              name: 'Description',
              value: item.desc,
            },
            {
              name: 'Selector Labels',
              value: (() => {
                const matchLabels = item.matchLabels;
                if (!matchLabels) return '-';
                return (
                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                    {Object.entries(matchLabels).map(([k, v]) => (
                      <StatusLabel
                        key={k}
                        status=""
                        style={{ backgroundColor: '#f5f5f5', color: '#424242' }}
                      >
                        {k}={v as string}
                        <Icon aria-hidden icon="mdi:tag-outline" width="1.2rem" height="1.2rem" />
                      </StatusLabel>
                    ))}
                  </Box>
                );
              })(),
            },
          ]
        }
        extraSections={item =>
          item && [
            {
              id: 'env-vars',
              section: (() => {
                const envVars = item.env;
                if (envVars.length === 0) return null;
                return (
                  <SectionBox title="Environment Variables (Injected)">
                    <NameValueTable
                      rows={envVars.map((env: any) => ({
                        name: env.name,
                        value: (() => {
                          if (env.value !== undefined && env.value !== null) return env.value;
                          if (env.valueFrom) {
                            if (env.valueFrom.secretKeyRef) {
                              return (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    color: '#1976d2',
                                  }}
                                >
                                  <Icon icon="mdi:key-outline" />
                                  Secret {env.valueFrom.secretKeyRef.name}/
                                  {env.valueFrom.secretKeyRef.key}
                                </Box>
                              );
                            }
                            if (env.valueFrom.configMapKeyRef) {
                              return (
                                <Box
                                  sx={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 0.5,
                                    color: '#ff9800',
                                  }}
                                >
                                  <Icon icon="mdi:file-document-outline" />
                                  ConfigMap {env.valueFrom.configMapKeyRef.name}/
                                  {env.valueFrom.configMapKeyRef.key}
                                </Box>
                              );
                            }
                            return 'Unknown source';
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
              id: 'volumes',
              section: (() => {
                const volumes = item.volumes;
                if (volumes.length === 0) return null;
                return (
                  <SectionBox title="Volumes (Injected)">
                    <NameValueTable
                      rows={volumes.map((vol: any) => {
                        let volumeType = 'Unknown';
                        let icon = 'mdi:folder-outline';
                        if (vol.secret) {
                          volumeType = `Secret: ${vol.secret.secretName}`;
                          icon = 'mdi:key-outline';
                        } else if (vol.configMap) {
                          volumeType = `ConfigMap: ${vol.configMap.name}`;
                          icon = 'mdi:file-document-outline';
                        } else if (vol.emptyDir !== undefined) {
                          volumeType = 'EmptyDir';
                          icon = 'mdi:folder-open-outline';
                        } else if (vol.persistentVolumeClaim) {
                          volumeType = `PVC: ${vol.persistentVolumeClaim.claimName}`;
                          icon = 'mdi:database-outline';
                        }
                        return {
                          name: (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Icon icon={icon} />
                              <Typography variant="body2">{vol.name}</Typography>
                            </Box>
                          ),
                          value: volumeType,
                        };
                      })}
                    />
                  </SectionBox>
                );
              })(),
            },
            {
              id: 'volume-mounts',
              section: (() => {
                const mounts = item.volumeMounts;
                if (mounts.length === 0) return null;
                return (
                  <SectionBox title="Volume Mounts (Injected)">
                    <NameValueTable
                      rows={mounts.map((mount: any) => ({
                        name: (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <Icon icon="mdi:link-variant" />
                            <Typography variant="body2">{mount.name}</Typography>
                          </Box>
                        ),
                        value: `${mount.mountPath}${mount.readOnly ? ' (ReadOnly)' : ''}`,
                      }))}
                    />
                  </SectionBox>
                );
              })(),
            },
            {
              id: 'tolerations',
              section: (() => {
                const tolerations = item.tolerations;
                if (tolerations.length === 0) return null;
                return (
                  <SectionBox title="Tolerations (Injected)">
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
              id: 'annotations',
              section: (() => {
                const annotations = item.annotations;
                const entries = Object.entries(annotations);
                if (entries.length === 0) return null;
                return (
                  <SectionBox title="Annotations (Injected on Pods)">
                    <NameValueTable
                      rows={entries.map(([key, val]) => ({
                        name: key,
                        value: String(val),
                      }))}
                    />
                  </SectionBox>
                );
              })(),
            },
            {
              id: 'service-account',
              section: (() => {
                const sa = item.serviceAccountName;
                if (!sa) return null;
                return (
                  <SectionBox title="Service Account Override">
                    <NameValueTable
                      rows={[
                        {
                          name: (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Icon icon="mdi:account-key" />
                              <Typography variant="body2">Service Account</Typography>
                            </Box>
                          ),
                          value: sa,
                        },
                      ]}
                    />
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
