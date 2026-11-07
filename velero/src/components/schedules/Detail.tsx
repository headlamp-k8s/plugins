import { DetailsGrid, Link, StatusLabel } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { Box, Button } from '@mui/material';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { resolveEveryRunAnchor, scheduleBackupLookupKey } from '../../coverage';
import { formatNextScheduledRun } from '../../cron';
import { useVeleroAccess } from '../../hooks/useVeleroAccess';
import { useVeleroData } from '../../hooks/useVeleroData';
import { VeleroSchedule } from '../../resources/velero';
import { getBackupStatusColor, getScheduleStatusColor } from '../../utils/status';
import { veleroRouteNames } from '../../utils/veleroRoutes';
import { VeleroInstallCheck } from '../common/VeleroInstallCheck';

function ScheduleDetailContent() {
  const { namespace, name } = useParams<{ namespace: string; name: string }>();
  const { canUpdateSchedule } = useVeleroAccess();
  const [pauseBusy, setPauseBusy] = useState(false);
  const [pauseError, setPauseError] = useState<string | null>(null);
  const {
    latestBackupBySchedule,
    loading: backupsLoading,
    error: backupsError,
  } = useVeleroData(namespace);

  return (
    <DetailsGrid
      resourceType={VeleroSchedule}
      name={name}
      namespace={namespace}
      withEvents
      noDefaultActions
      actions={schedule => {
        if (!schedule || !canUpdateSchedule) {
          return [];
        }
        const paused = schedule.paused;
        return [
          <Button
            key="pause-toggle"
            variant="outlined"
            size="small"
            disabled={pauseBusy}
            onClick={async () => {
              setPauseError(null);
              setPauseBusy(true);
              try {
                await schedule.patch({ spec: { paused: !paused } });
              } catch (err: unknown) {
                setPauseError(err instanceof Error ? err.message : 'Failed to update schedule');
              } finally {
                setPauseBusy(false);
              }
            }}
          >
            {pauseBusy ? 'Updating…' : paused ? 'Unpause' : 'Pause'}
          </Button>,
        ];
      }}
      extraInfo={schedule => {
        if (!schedule) {
          return [];
        }

        const last = latestBackupBySchedule.get(
          scheduleBackupLookupKey(schedule.cluster, schedule.getName())
        );
        const nextRun = schedule.isActivelyScheduling
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

        let lastBackupValue: ReactNode;
        let lastStatusValue: ReactNode;
        if (backupsError) {
          lastBackupValue = `Unavailable (${backupsError.message})`;
          lastStatusValue = 'Unavailable';
        } else if (backupsLoading) {
          lastBackupValue = 'Loading…';
          lastStatusValue = 'Loading…';
        } else if (last) {
          lastBackupValue = (
            <Link
              routeName={veleroRouteNames.backupDetail}
              params={{ namespace: schedule.getNamespace(), name: last.name }}
              activeCluster={schedule.cluster}
            >
              {last.name}
            </Link>
          );
          lastStatusValue = (
            <StatusLabel status={getBackupStatusColor(last.phase ?? 'Unknown')}>
              {last.phase ?? 'Unknown'}
            </StatusLabel>
          );
        } else {
          lastBackupValue = 'None';
          lastStatusValue = 'N/A';
        }

        return [
          {
            name: 'Status',
            value: (
              <StatusLabel status={getScheduleStatusColor(schedule.statusDisplay)}>
                {schedule.statusDisplay}
              </StatusLabel>
            ),
          },
          {
            name: 'Cron',
            value: schedule.cronSchedule || 'N/A',
          },
          {
            name: 'Next run',
            value: nextRun,
          },
          {
            name: 'Namespaces',
            value: schedule.includedNamespacesDisplay,
          },
          ...(schedule.validationErrors.length > 0
            ? [
                {
                  name: 'Validation errors',
                  value: schedule.validationErrors.join('; '),
                },
              ]
            : []),
          {
            name: 'Last backup',
            value: lastBackupValue,
          },
          {
            name: 'Last status',
            value: lastStatusValue,
          },
          ...(pauseError
            ? [
                {
                  name: 'Pause error',
                  value: (
                    <Box component="span" sx={{ color: 'error.main' }}>
                      {pauseError}
                    </Box>
                  ),
                },
              ]
            : []),
        ];
      }}
    />
  );
}

/** Velero Schedule detail — Phase 2 fields + Phase 4 pause/unpause. */
export default function ScheduleDetail() {
  return (
    <VeleroInstallCheck>
      <ScheduleDetailContent />
    </VeleroInstallCheck>
  );
}
