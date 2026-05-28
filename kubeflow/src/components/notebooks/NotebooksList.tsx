import { Icon } from '@iconify/react';
import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { LightTooltip, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip, ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import { NotebookClass } from '../../resources/notebook';
import { launchNotebookLogs } from '../common/KubeflowLogsViewer';
import { NotebookStatusBadge } from '../common/NotebookStatusBadge';
import { NotebookTypeBadge } from '../common/NotebookTypeBadge';
import { getNotebookStatus, getNotebookType } from '../common/notebookUtils';
import { SectionPage } from '../common/SectionPage';

export function NotebooksList() {
  const { t } = useTranslation();

  return (
    <SectionPage title={t('Notebook Servers')} apiPath="/apis/kubeflow.org/v1">
      <ResourceListView
        title={t('Notebook Servers')}
        resourceClass={NotebookClass}
        enableRowActions
        actions={[
          {
            id: 'kubeflow.notebook-logs',
            action: ({ item, closeMenu }: { item: NotebookClass; closeMenu: () => void }) => (
              <MenuItem
                onClick={() => {
                  closeMenu();
                  launchNotebookLogs({
                    notebookName: item.metadata.name,
                    namespace: item.metadata.namespace,
                    cluster: item.cluster,
                  });
                }}
              >
                <ListItemIcon>
                  <Icon icon="mdi:text-box-outline" width={20} />
                </ListItemIcon>
                <ListItemText>{t('View Logs')}</ListItemText>
              </MenuItem>
            ),
          },
        ]}
        columns={[
          'name',
          'namespace',
          {
            id: 'type',
            label: t('Type'),
            getValue: (item: NotebookClass) => {
              const image = item.containerImage;
              if (!image) return '-';
              return getNotebookType(image).label;
            },
            render: (item: NotebookClass) => {
              const image = item.containerImage;
              if (!image) return <>-</>;
              return <NotebookTypeBadge image={image} />;
            },
          },
          {
            id: 'image',
            label: t('Image'),
            getValue: (item: NotebookClass) => item.containerImage || '-',
            render: (item: NotebookClass) => {
              const image = item.containerImage;
              if (!image) return <>-</>;
              const parts = image.split('/');
              const shortImage = parts[parts.length - 1];
              return (
                <LightTooltip title={image} interactive>
                  <span style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>{shortImage}</span>
                </LightTooltip>
              );
            },
          },
          {
            id: 'resources',
            label: t('Resources (Req)'),
            getValue: (item: NotebookClass) => {
              const containers = item.containers;
              if (containers.length === 0) return '-';
              const requests = containers[0]?.resources?.requests || {};
              return `${requests.cpu || '-'} / ${requests.memory || '-'}`;
            },
            render: (item: NotebookClass) => {
              const containers = item.containers;
              if (containers.length === 0) return <>-</>;
              const requests = containers[0]?.resources?.requests || {};
              const limits = containers[0]?.resources?.limits || {};
              const gpu = limits['nvidia.com/gpu'] || limits['amd.com/gpu'];
              const tooltip = t(
                'Requests: CPU {{cpuReq}}, Memory {{memReq}}\nLimits: CPU {{cpuLim}}, Memory {{memLimit}}{{gpuInfo}}',
                {
                  cpuReq: requests.cpu || '-',
                  memReq: requests.memory || '-',
                  cpuLim: limits.cpu || '-',
                  memLimit: limits.memory || '-',
                  gpuInfo: gpu ? `\n${t('GPU')}: ${gpu}` : '',
                }
              );
              return (
                <LightTooltip title={tooltip} interactive>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
                      {requests.cpu || '-'} / {requests.memory || '-'}
                    </span>
                    {gpu && (
                      <Chip
                        label={t('GPU:{{gpu}}', { gpu })}
                        size="small"
                        color="warning"
                        sx={{ height: '20px', fontSize: '0.7em', fontWeight: 'bold' }}
                      />
                    )}
                  </Box>
                </LightTooltip>
              );
            },
          },
          {
            id: 'volumes',
            label: t('Volumes'),
            getValue: (item: NotebookClass) => `${item.volumes.length}`,
            render: (item: NotebookClass) => {
              const volumes = item.volumes;
              const pvcCount = volumes.filter((v: any) => v.persistentVolumeClaim).length;
              const tooltip = volumes
                .map((v: any) => {
                  if (v.persistentVolumeClaim)
                    return t('PVC: {{name}}', { name: v.persistentVolumeClaim.claimName });
                  if (v.emptyDir !== undefined) return t('EmptyDir: {{name}}', { name: v.name });
                  if (v.configMap) return t('ConfigMap: {{name}}', { name: v.configMap.name });
                  if (v.secret) return t('Secret: {{name}}', { name: v.secret.secretName });
                  return v.name;
                })
                .join('\n');
              return (
                <LightTooltip title={tooltip || t('No volumes')} interactive>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>{volumes.length}</span>
                    {pvcCount > 0 && (
                      <Chip
                        label={t('{{count}} PVC', { count: pvcCount })}
                        size="small"
                        color="primary"
                        sx={{ height: '20px', fontSize: '0.7em' }}
                      />
                    )}
                  </Box>
                </LightTooltip>
              );
            },
          },
          {
            id: 'status',
            label: t('Status'),
            getValue: (item: NotebookClass) => getNotebookStatus(item.jsonData).label,
            render: (item: NotebookClass) => <NotebookStatusBadge jsonData={item.jsonData} />,
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
