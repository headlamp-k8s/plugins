import { Icon } from '@iconify/react';
import { ApiProxy, K8s } from '@kinvolk/headlamp-plugin/lib';
import { Link, ResourceListView, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button } from '@mui/material';
import { useState } from 'react';
import { useVeleroNamespace } from '../../config';
import { resolveEveryRunAnchor, scheduleBackupLookupKey } from '../../coverage';
import { formatNextScheduledRun } from '../../cron';
import { useVeleroAccess } from '../../hooks/useVeleroAccess';
import { useVeleroData } from '../../hooks/useVeleroData';
import { VeleroSchedule } from '../../resources/velero';
import { getBackupStatusColor, getScheduleStatusColor } from '../../utils/status';
import { veleroListFilterFunction } from '../../utils/veleroListFilter';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';
import ScheduleCreateForm from './CreateForm';
import type { ScheduleCreateInput } from './createTypes';

function ScheduleListContent() {
  const veleroNamespace = useVeleroNamespace();
  const { loading: accessLoading, canCreateSchedule } = useVeleroAccess();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const { latestBackupBySchedule, loading: backupsLoading, error: backupsError } = useVeleroData();
  const [schedules, schedulesError] = VeleroSchedule.useList({ namespace: veleroNamespace });
  const [namespacesList] = K8s.ResourceClasses.Namespace.useList();
  const namespaces = namespacesList ? namespacesList.map(ns => ns.getName()) : [];

  const errorMessage = schedulesError?.message ?? backupsError?.message;
  const tableData = backupsLoading || schedules === null ? null : schedules;

  const handleCreateSchedule = async (values: ScheduleCreateInput) => {
    const body = {
      apiVersion: 'velero.io/v1',
      kind: 'Schedule',
      metadata: {
        name: values.name,
        namespace: veleroNamespace,
      },
      spec: {
        schedule: values.schedule,
        paused: values.paused || undefined,
        template: {
          includedNamespaces:
            values.includedNamespaces.length > 0 ? values.includedNamespaces : undefined,
          excludedNamespaces:
            values.excludedNamespaces.length > 0 ? values.excludedNamespaces : undefined,
          ttl: values.ttl || undefined,
        },
      },
    };

    // POST only so duplicate names surface as AlreadyExists instead of silent apply/update.
    await ApiProxy.post(`/apis/velero.io/v1/namespaces/${veleroNamespace}/schedules`, body);
    setShowCreateForm(false);
  };

  if (showCreateForm) {
    return (
      <Box padding={2}>
        <ScheduleCreateForm
          namespaces={namespaces}
          onSubmit={handleCreateSchedule}
          onCancel={() => setShowCreateForm(false)}
        />
      </Box>
    );
  }

  return (
    <ResourceListView
      title="Velero Schedules"
      data={tableData}
      errorMessage={errorMessage}
      enableRowActions={false}
      enableRowSelection={false}
      filterFunction={veleroListFilterFunction}
      headerProps={{
        noNamespaceFilter: true,
        titleSideActions: [],
        actions:
          !accessLoading && canCreateSchedule
            ? [
                <Button
                  key="create-schedule"
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => setShowCreateForm(true)}
                  startIcon={<Icon icon="mdi:plus" />}
                >
                  Create Schedule
                </Button>,
              ]
            : [],
      }}
      columns={[
        'name',
        'namespace',
        {
          id: 'cron',
          label: 'Cron',
          getValue: (schedule: VeleroSchedule) => schedule.cronSchedule || 'N/A',
        },
        {
          id: 'status',
          label: 'Status',
          getValue: (schedule: VeleroSchedule) => schedule.statusDisplay,
          render: (schedule: VeleroSchedule) => (
            <StatusLabel status={getScheduleStatusColor(schedule.statusDisplay)}>
              {schedule.statusDisplay}
            </StatusLabel>
          ),
        },
        {
          id: 'namespaces',
          label: 'Namespaces',
          getValue: (schedule: VeleroSchedule) => schedule.includedNamespacesDisplay,
        },
        {
          id: 'next-run',
          label: 'Next run',
          getValue: (schedule: VeleroSchedule) => {
            const last = latestBackupBySchedule.get(
              scheduleBackupLookupKey(schedule.cluster, schedule.getName())
            );
            return schedule.isActivelyScheduling
              ? formatNextScheduledRun(
                  schedule.cronSchedule,
                  new Date(),
                  resolveEveryRunAnchor({
                    lastBackupTime: schedule.lastBackupTime,
                    lastSkippedTime: schedule.lastSkippedTime,
                    creationTimestamp: schedule.metadata.creationTimestamp,
                    lastBackup: last,
                  })
                )
              : 'N/A';
          },
        },
        {
          id: 'last-backup',
          label: 'Last backup',
          getValue: (schedule: VeleroSchedule) =>
            latestBackupBySchedule.get(
              scheduleBackupLookupKey(schedule.cluster, schedule.getName())
            )?.name ?? 'None',
          render: (schedule: VeleroSchedule) => {
            const last = latestBackupBySchedule.get(
              scheduleBackupLookupKey(schedule.cluster, schedule.getName())
            );
            if (!last) {
              return 'None';
            }
            return (
              <Link
                routeName={veleroRouteNames.backupDetail}
                params={{ namespace: veleroNamespace, name: last.name }}
                activeCluster={schedule.cluster}
              >
                {last.name}
              </Link>
            );
          },
        },
        {
          id: 'last-status',
          label: 'Last status',
          getValue: (schedule: VeleroSchedule) =>
            latestBackupBySchedule.get(
              scheduleBackupLookupKey(schedule.cluster, schedule.getName())
            )?.phase ?? 'N/A',
          render: (schedule: VeleroSchedule) => {
            const phase = latestBackupBySchedule.get(
              scheduleBackupLookupKey(schedule.cluster, schedule.getName())
            )?.phase;
            if (!phase) {
              return 'N/A';
            }
            return <StatusLabel status={getBackupStatusColor(phase)}>{phase}</StatusLabel>;
          },
        },
        'age',
      ]}
    />
  );
}

/** Cluster-wide Velero Schedule list — Phase 2 views + Phase 4 create. */
export default function ScheduleList() {
  return (
    <VeleroInstallCheck>
      <ScheduleListContent />
    </VeleroInstallCheck>
  );
}
