import { Icon } from '@iconify/react';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box } from '@mui/material';
import { ProfileClass } from '../../resources/profile';
import { getProfileStatus } from '../common/notebookUtils';
import { ProfileStatusBadge } from '../common/ProfileStatusBadge';
import { SectionPage } from '../common/SectionPage';

export function ProfilesList() {
  return (
    <SectionPage title="Profiles" apiPath="/apis/kubeflow.org/v1">
      <ResourceListView
        title="Profiles"
        resourceClass={ProfileClass}
        columns={[
          'name',
          {
            id: 'owner',
            label: 'Owner',
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
            label: 'CPU Quota',
            getValue: item => {
              return item?.jsonData?.spec?.resourceQuotaSpec?.hard?.cpu || 'Unlimited';
            },
          },
          {
            id: 'memory-quota',
            label: 'Memory Quota',
            getValue: item => {
              return item?.jsonData?.spec?.resourceQuotaSpec?.hard?.memory || 'Unlimited';
            },
          },
          {
            id: 'gpu-quota',
            label: 'GPU Quota',
            getValue: item => {
              const hard = item?.jsonData?.spec?.resourceQuotaSpec?.hard || {};
              return (
                hard['requests.nvidia.com/gpu'] ||
                hard['limits.nvidia.com/gpu'] ||
                hard['nvidia.com/gpu'] ||
                'None'
              );
            },
          },
          {
            id: 'status',
            label: 'Status',
            getValue: item => getProfileStatus(item?.jsonData).label,
            render: item => <ProfileStatusBadge jsonData={item?.jsonData} />,
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
