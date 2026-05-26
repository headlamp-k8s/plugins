import { Icon } from '@iconify/react';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/components/common';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import MenuItem from '@mui/material/MenuItem';
import { TrainJobClass } from '../../resources/trainJob';
import { launchTrainJobLogs } from '../common/KubeflowLogsViewer';
import { SectionPage } from '../common/SectionPage';
import { formatPercent, formatRuntimeRef } from './trainerUtils';
import { TrainJobStatusBadge } from './TrainJobStatusBadge';

/**
 * Lists Kubeflow TrainJobs with runtime, progress, and suspend-state columns.
 */
export function TrainJobsList() {
  return (
    <SectionPage title="TrainJobs" apiPath="/apis/trainer.kubeflow.org/v1alpha1/trainjobs">
      <ResourceListView
        title="TrainJobs"
        resourceClass={TrainJobClass}
        enableRowActions
        actions={[
          {
            id: 'kubeflow.trainjob-logs',
            action: ({ item, closeMenu }: { item: TrainJobClass; closeMenu: () => void }) => (
              <MenuItem
                onClick={() => {
                  closeMenu();
                  launchTrainJobLogs({
                    jobName: item.metadata.name,
                    namespace: item.metadata.namespace,
                    cluster: item.cluster,
                  });
                }}
              >
                <ListItemIcon>
                  <Icon icon="mdi:text-box-outline" width={20} />
                </ListItemIcon>
                <ListItemText>View Primary Pod Logs</ListItemText>
              </MenuItem>
            ),
          },
        ]}
        columns={[
          'name',
          'namespace',
          {
            id: 'runtimeRef',
            label: 'Runtime Ref',
            getValue: (item: TrainJobClass) => formatRuntimeRef(item),
            render: (item: TrainJobClass) => formatRuntimeRef(item),
          },
          {
            id: 'status',
            label: 'Phase / Conditions',
            getValue: (item: TrainJobClass) => item.phase || 'Pending',
            render: (item: TrainJobClass) => <TrainJobStatusBadge job={item} />,
          },
          {
            id: 'progress',
            label: 'Progress',
            getValue: (item: TrainJobClass) => item.progress || '-',
            render: (item: TrainJobClass) => formatPercent(item.progress),
          },
          {
            id: 'suspend',
            label: 'Suspended',
            getValue: (item: TrainJobClass) => (item.suspended ? 'Yes' : 'No'),
            render: (item: TrainJobClass) => (item.suspended ? 'Yes' : 'No'),
          },
          {
            id: 'managedBy',
            label: 'Managed By',
            getValue: (item: TrainJobClass) => item.managedBy || '-',
            render: (item: TrainJobClass) => item.managedBy || '-',
          },
          {
            id: 'jobs',
            label: 'Child Jobs',
            getValue: (item: TrainJobClass) => `${item.jobsStatus.length}`,
            render: (item: TrainJobClass) =>
              item.jobsStatus.length > 0
                ? item.jobsStatus
                    .map(
                      status => `${status.name || 'job'}:${status.ready ?? 0}/${status.active ?? 0}`
                    )
                    .join(', ')
                : '-',
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
