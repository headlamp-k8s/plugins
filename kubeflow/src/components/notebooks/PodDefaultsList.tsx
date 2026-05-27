import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { LightTooltip, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip } from '@mui/material';
import { PodDefaultClass } from '../../resources/podDefault';
import { SectionPage } from '../common/SectionPage';

export function PodDefaultsList() {
  const { t } = useTranslation();

  return (
    <SectionPage title={t('PodDefaults')} apiPath="/apis/kubeflow.org/v1alpha1">
      <ResourceListView
        title={t('PodDefaults')}
        resourceClass={PodDefaultClass}
        columns={[
          'name',
          'namespace',
          {
            id: 'description',
            label: t('Description'),
            getValue: item => item?.jsonData?.spec?.desc || '-',
          },
          {
            id: 'selector',
            label: t('Selector Labels'),
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
                    <span>{t('{{count}} label(s)', { count: labels.length })}</span>
                  </Box>
                </LightTooltip>
              );
            },
          },
          {
            id: 'env-count',
            label: t('Injections'),
            getValue: item => {
              const envVars = item?.jsonData?.spec?.env || [];
              const volumes = item?.jsonData?.spec?.volumes || [];
              const mounts = item?.jsonData?.spec?.volumeMounts || [];
              return t('{{envCount}} Env, {{volCount}} Vol, {{mntCount}} Mnt', {
                envCount: envVars.length,
                volCount: volumes.length,
                mntCount: mounts.length,
              });
            },
            render: item => {
              const envVars = item?.jsonData?.spec?.env || [];
              const volumes = item?.jsonData?.spec?.volumes || [];
              const mounts = item?.jsonData?.spec?.volumeMounts || [];
              return (
                <Box sx={{ display: 'flex', gap: 1 }}>
                  {envVars.length > 0 && (
                    <Chip
                      size="small"
                      color="primary"
                      label={t('{{count}} Env', { count: envVars.length })}
                    />
                  )}
                  {(volumes.length > 0 || mounts.length > 0) && (
                    <Chip
                      size="small"
                      color="warning"
                      label={t('{{volCount}} Vol / {{mntCount}} Mnt', {
                        volCount: volumes.length,
                        mntCount: mounts.length,
                      })}
                    />
                  )}
                  {envVars.length === 0 && volumes.length === 0 && mounts.length === 0 && (
                    <span>{t('None')}</span>
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
