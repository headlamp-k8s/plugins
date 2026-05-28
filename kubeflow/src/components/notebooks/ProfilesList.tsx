import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { ProfileClass } from '../../resources/profile';
import { getProfileStatus } from '../common/notebookUtils';
import { ProfileStatusBadge } from '../common/ProfileStatusBadge';
import { SectionPage } from '../common/SectionPage';

export function ProfilesList() {
  const { t } = useTranslation();

  return (
    <SectionPage title={t('Profiles')} apiPath="/apis/kubeflow.org/v1">
      <ResourceListView
        title={t('Profiles')}
        resourceClass={ProfileClass}
        columns={[
          'name',
          {
            id: 'owner',
            label: t('Owner'),
            getValue: item => {
              const owner = item?.jsonData?.spec?.owner;
              if (!owner) return '-';
              return `${owner.kind || ''}/${owner.name || '-'}`;
            },
            render: item => {
              const owner = item?.jsonData?.spec?.owner;
              if (!owner) return <>-</>;
              const icon =
                owner.kind === 'User'
                  ? 'mdi:account'
                  : owner.kind === 'Group'
                  ? 'mdi:account-group'
                  : 'mdi:account-question';
              return (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <Icon icon={icon} width="16" height="16" />
                  {owner.name || '-'}
                </Box>
              );
            },
          },
          {
            id: 'cpu-quota',
            label: t('CPU Quota'),
            getValue: item => {
              return item?.jsonData?.spec?.resourceQuotaSpec?.hard?.cpu || t('Unlimited');
            },
          },
          {
            id: 'memory-quota',
            label: t('Memory Quota'),
            getValue: item => {
              return item?.jsonData?.spec?.resourceQuotaSpec?.hard?.memory || t('Unlimited');
            },
          },
          {
            id: 'gpu-quota',
            label: t('GPU Quota'),
            getValue: item => {
              const hard = item?.jsonData?.spec?.resourceQuotaSpec?.hard || {};
              return (
                hard['requests.nvidia.com/gpu'] ||
                hard['limits.nvidia.com/gpu'] ||
                hard['nvidia.com/gpu'] ||
                t('None')
              );
            },
          },
          {
            id: 'status',
            label: t('Status'),
            getValue: item => getProfileStatus(item?.jsonData).label,
            render: item => <ProfileStatusBadge jsonData={item?.jsonData} />,
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
