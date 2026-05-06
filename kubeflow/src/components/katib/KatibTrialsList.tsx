import { Icon } from '@iconify/react';
import {
  Link as HeadlampLink,
  ResourceListView,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { ListItemIcon, ListItemText, MenuItem } from '@mui/material';
import { KatibTrialClass } from '../../resources/katibTrial';
import { getKatibConditionStatus } from '../common/katibUtils';
import { launchKatibTrialLogs } from '../common/KubeflowLogsViewer';
import { KubeflowStatusBadge } from '../common/KubeflowStatusBadge';
import { SectionPage } from '../common/SectionPage';

/**
 * Renders the Katib Trial list view with core trial status and metrics columns.
 */
export function KatibTrialsList() {
  return (
    <SectionPage title="Katib Trials" apiPath="/apis/kubeflow.org/v1beta1/trials">
      <ResourceListView
        title="Katib Trials"
        resourceClass={KatibTrialClass}
        enableRowActions
        actions={[
          {
            id: 'kubeflow.katib-trial-logs',
            action: ({ item, closeMenu }: { item: KatibTrialClass; closeMenu: () => void }) => (
              <MenuItem
                onClick={() => {
                  closeMenu();
                  launchKatibTrialLogs({
                    trialName: item.metadata.name,
                    namespace: item.metadata.namespace,
                    cluster: item.cluster,
                  });
                }}
              >
                <ListItemIcon>
                  <Icon icon="mdi:text-box-outline" width={20} />
                </ListItemIcon>
                <ListItemText>View Worker Logs</ListItemText>
              </MenuItem>
            ),
          },
        ]}
        columns={[
          {
            id: 'name',
            label: 'Name',
            getValue: (item: KatibTrialClass) => item.metadata.name,
            render: (item: KatibTrialClass) => (
              <HeadlampLink
                routeName="kubeflow-katib-trials-detail"
                params={{ namespace: item.metadata.namespace, name: item.metadata.name }}
              >
                {item.metadata.name}
              </HeadlampLink>
            ),
          },
          'namespace',
          {
            id: 'experiment',
            label: 'Experiment',
            getValue: (item: KatibTrialClass) => item.ownerExperiment || '-',
            render: (item: KatibTrialClass) =>
              item.ownerExperiment ? (
                <HeadlampLink
                  routeName="kubeflow-katib-experiments-detail"
                  params={{ namespace: item.metadata.namespace, name: item.ownerExperiment }}
                >
                  {item.ownerExperiment}
                </HeadlampLink>
              ) : (
                '-'
              ),
          },
          {
            id: 'status',
            label: 'Status',
            getValue: (item: KatibTrialClass) =>
              getKatibConditionStatus(item.latestCondition).label,
            render: (item: KatibTrialClass) => (
              <KubeflowStatusBadge statusInfo={getKatibConditionStatus(item.latestCondition)} />
            ),
          },
          {
            id: 'metric',
            label: 'Metric Result',
            getValue: (item: KatibTrialClass) => item.objectiveMetricValue || '-',
          },
          {
            id: 'start-time',
            label: 'Start Time',
            getValue: (item: KatibTrialClass) => item.startTime || '-',
          },
          {
            id: 'end-time',
            label: 'End Time',
            getValue: (item: KatibTrialClass) => item.completionTime || '-',
          },
          {
            id: 'reason',
            label: 'Reason',
            getValue: (item: KatibTrialClass) => item.failureReason || '-',
          },
          'age',
        ]}
      />
    </SectionPage>
  );
}
