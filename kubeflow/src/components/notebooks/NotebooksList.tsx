import { Icon } from '@iconify/react';
import { LightTooltip, ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import { Box, Chip, ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import { NotebookClass } from '../../resources/notebook';
import { launchNotebookLogs } from '../common/KubeflowLogsViewer';
import { NotebookStatusBadge } from '../common/NotebookStatusBadge';
import { NotebookTypeBadge } from '../common/NotebookTypeBadge';
import { getNotebookStatus, getNotebookType } from '../common/notebookUtils';
import { SectionPage } from '../common/SectionPage';

export function NotebooksList() {
  return (
    <SectionPage title="Notebook Servers" apiPath="/apis/kubeflow.org/v1">
      <ResourceListView
        title="Notebook Servers"
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
                <ListItemText>View Logs</ListItemText>
              </MenuItem>
            ),
          },
        ]}
        columns={[
          'name',
          'namespace',
          {
            id: 'type',
            label: 'Type',
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
            label: 'Image',
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
            label: 'Resources (Req)',
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
              const tooltip = `Requests: CPU ${requests.cpu || '-'}, Memory ${
                requests.memory || '-'
              }\nLimits: CPU ${limits.cpu || '-'}, Memory ${limits.memory || '-'}${
                gpu ? `\nGPU: ${gpu}` : ''
              }`;
              return (
                <LightTooltip title={tooltip} interactive>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.85em' }}>
                      {requests.cpu || '-'} / {requests.memory || '-'}
                    </span>
                    {gpu && (
                      <Chip
                        label={`GPU:${gpu}`}
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
            label: 'Volumes',
            getValue: (item: NotebookClass) => `${item.volumes.length}`,
            render: (item: NotebookClass) => {
              const volumes = item.volumes;
              const pvcCount = volumes.filter((v: any) => v.persistentVolumeClaim).length;
              const tooltip = volumes
                .map((v: any) => {
                  if (v.persistentVolumeClaim) return `PVC: ${v.persistentVolumeClaim.claimName}`;
                  if (v.emptyDir !== undefined) return `EmptyDir: ${v.name}`;
                  if (v.configMap) return `ConfigMap: ${v.configMap.name}`;
                  if (v.secret) return `Secret: ${v.secret.secretName}`;
                  return v.name;
                })
                .join('\n');
              return (
                <LightTooltip title={tooltip || 'No volumes'} interactive>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <span>{volumes.length}</span>
                    {pvcCount > 0 && (
                      <Chip
                        label={`${pvcCount} PVC`}
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
            label: 'Status',
            getValue: (item: NotebookClass) => getNotebookStatus(item.jsonData).label,
            render: (item: NotebookClass) => <NotebookStatusBadge jsonData={item.jsonData} />,
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
