import { Icon } from '@iconify/react';
import {
  NameValueTable,
  SectionBox,
  StatusLabel,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { Chip } from '@mui/material';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import {
  allPodDefaults,
  podDefaultAwsCreds,
  podDefaultEmpty,
  podDefaultGcpCreds,
} from './__fixtures__/mockData';

/**
 * Isolated presentational view of a single PodDefault detail — mirrors
 * what PodDefaultsDetail.tsx renders via Headlamp's DetailsGrid but
 * fully decoupled from the cluster for Storybook.
 */
function PodDefaultDetailContent({ podDefault }: { podDefault: any }) {
  const spec = podDefault?.spec || {};
  const envVars: any[] = spec.env || [];
  const volumes: any[] = spec.volumes || [];
  const mounts: any[] = spec.volumeMounts || [];
  const tolerations: any[] = spec.tolerations || [];
  const annotations: Record<string, string> = spec.annotations || {};
  const matchLabels: Record<string, string> = spec.selector?.matchLabels || {};
  const sa: string | undefined = spec.serviceAccountName;

  return (
    <Box sx={{ padding: '24px 16px' }}>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        {podDefault?.metadata?.name}
      </Typography>
      <Typography variant="body2" sx={{ color: 'text.secondary', mb: 3 }}>
        {podDefault?.metadata?.namespace}
      </Typography>

      <NameValueTable
        rows={[
          { name: 'Description', value: spec.desc || '-' },
          {
            name: 'Selector Labels',
            value:
              Object.keys(matchLabels).length > 0 ? (
                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                  {Object.entries(matchLabels).map(([k, v]) => (
                    <StatusLabel
                      key={k}
                      status=""
                      style={{ backgroundColor: '#f5f5f5', color: '#424242' }}
                    >
                      {k}={v}
                      <Icon aria-hidden icon="mdi:tag-outline" width="1.2rem" height="1.2rem" />
                    </StatusLabel>
                  ))}
                </Box>
              ) : (
                '-'
              ),
          },
          {
            name: 'Injections',
            value: (
              <Box sx={{ display: 'flex', gap: 1 }}>
                {envVars.length > 0 && (
                  <Chip size="small" color="primary" label={`${envVars.length} Env`} />
                )}
                {volumes.length > 0 && (
                  <Chip size="small" color="warning" label={`${volumes.length} Vol`} />
                )}
                {mounts.length > 0 && (
                  <Chip size="small" color="default" label={`${mounts.length} Mount`} />
                )}
                {envVars.length === 0 && volumes.length === 0 && mounts.length === 0 && (
                  <span>None</span>
                )}
              </Box>
            ),
          },
        ]}
      />

      {envVars.length > 0 && (
        <SectionBox title="Environment Variables (Injected)">
          <NameValueTable
            rows={envVars.map((env: any) => ({
              name: env.name,
              value: (() => {
                if (env.value !== undefined && env.value !== null) return env.value;
                if (env.valueFrom?.secretKeyRef) {
                  return `Secret: ${env.valueFrom.secretKeyRef.name}/${env.valueFrom.secretKeyRef.key}`;
                }
                if (env.valueFrom?.configMapKeyRef) {
                  return `ConfigMap: ${env.valueFrom.configMapKeyRef.name}/${env.valueFrom.configMapKeyRef.key}`;
                }
                return '-';
              })(),
            }))}
          />
        </SectionBox>
      )}

      {volumes.length > 0 && (
        <SectionBox title="Volumes (Injected)">
          <NameValueTable
            rows={volumes.map((vol: any) => {
              let volumeType = 'Unknown';
              if (vol.secret) volumeType = `Secret: ${vol.secret.secretName}`;
              else if (vol.configMap) volumeType = `ConfigMap: ${vol.configMap.name}`;
              else if (vol.emptyDir !== undefined) volumeType = 'EmptyDir';
              else if (vol.persistentVolumeClaim)
                volumeType = `PVC: ${vol.persistentVolumeClaim.claimName}`;
              return { name: vol.name, value: volumeType };
            })}
          />
        </SectionBox>
      )}

      {mounts.length > 0 && (
        <SectionBox title="Volume Mounts (Injected)">
          <NameValueTable
            rows={mounts.map((mount: any) => ({
              name: mount.name,
              value: `${mount.mountPath}${mount.readOnly ? ' (ReadOnly)' : ''}`,
            }))}
          />
        </SectionBox>
      )}

      {tolerations.length > 0 && (
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
      )}

      {Object.keys(annotations).length > 0 && (
        <SectionBox title="Annotations (Injected on Pods)">
          <NameValueTable
            rows={Object.entries(annotations).map(([key, val]) => ({
              name: key,
              value: String(val),
            }))}
          />
        </SectionBox>
      )}

      {sa && (
        <SectionBox title="Service Account Override">
          <NameValueTable rows={[{ name: 'Service Account', value: sa }]} />
        </SectionBox>
      )}
    </Box>
  );
}

const meta: Meta<typeof PodDefaultDetailContent> = {
  title: 'Kubeflow/PodDefaults/PodDefaultDetail',
  component: PodDefaultDetailContent,
  parameters: {
    docs: {
      description: {
        component:
          'Detail view for a Kubeflow PodDefault showing selector, injected env vars, volumes, mounts, tolerations, and annotations.',
      },
    },
  },
};
export default meta;

type Story = StoryObj<typeof PodDefaultDetailContent>;

/** PodDefault injecting AWS credentials via secret refs. */
export const AwsCredentials: Story = {
  args: { podDefault: podDefaultAwsCreds },
};

/** PodDefault injecting GCP credentials with volume + service account. */
export const GcpCredentials: Story = {
  args: { podDefault: podDefaultGcpCreds },
};

/** PodDefault with no injections at all. */
export const NoInjections: Story = {
  args: { podDefault: podDefaultEmpty },
};

/** All PodDefaults rendered for comparison. */
export const All: Story = {
  render: () => (
    <>
      {allPodDefaults.map(pd => (
        <PodDefaultDetailContent key={pd.metadata.uid} podDefault={pd} />
      ))}
    </>
  ),
};
