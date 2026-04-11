import { Icon } from '@iconify/react';
import { LightTooltip, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip } from '@mui/material';
import { PodDefaultClass } from '../../resources/podDefault';
import { SectionPage } from '../common/SectionPage';

export function PodDefaultsList() {
  return (
    <SectionPage title="PodDefaults" apiPath="/apis/kubeflow.org/v1alpha1">
      <ResourceListView
        title="PodDefaults"
        resourceClass={PodDefaultClass}
        columns={[
          'name',
          'namespace',
          {
            id: 'description',
            label: 'Description',
            getValue: item => item?.jsonData?.spec?.desc || '-',
          },
          {
            id: 'selector',
            label: 'Selector Labels',
            getValue: item => {
              const matchLabels = item?.jsonData?.spec?.selector?.matchLabels;
              if (!matchLabels) return '-';
              return Object.entries(matchLabels)
                .map(([k, v]) => `${k}=${v}`)
                .join(', ');
            },
            render: item => {
              const matchLabels = item?.jsonData?.spec?.selector?.matchLabels;
              if (!matchLabels) return <>-</>;
              const labels = Object.entries(matchLabels).map(([k, v]) => `${k}=${v}`);
              return (
                <LightTooltip title={labels.join('\n')} interactive>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, flexWrap: 'wrap' }}>
                    <Icon icon="mdi:tag-outline" aria-hidden />
                    <span>{labels.length} label(s)</span>
                  </Box>
                </LightTooltip>
              );
            },
          },
          {
            id: 'env-count',
            label: 'Injections',
            getValue: item => {
              const envVars = item?.jsonData?.spec?.env || [];
              const volumes = item?.jsonData?.spec?.volumes || [];
              const mounts = item?.jsonData?.spec?.volumeMounts || [];
              return `${envVars.length} Env, ${volumes.length} Vol, ${mounts.length} Mnt`;
            },
            render: item => {
              const envVars = item?.jsonData?.spec?.env || [];
              const volumes = item?.jsonData?.spec?.volumes || [];
              const mounts = item?.jsonData?.spec?.volumeMounts || [];
              return (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {envVars.length > 0 && (
                    <Chip size="small" color="primary" label={`${envVars.length} Env`} />
                  )}
                  {(volumes.length > 0 || mounts.length > 0) && (
                    <Chip
                      size="small"
                      color="warning"
                      label={`${volumes.length} Vol / ${mounts.length} Mnt`}
                    />
                  )}
                  {envVars.length === 0 && volumes.length === 0 && mounts.length === 0 && (
                    <span>None</span>
                  )}
                </Box>
              );
            },
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
