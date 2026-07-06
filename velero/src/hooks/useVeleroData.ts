import { useMemo } from 'react';
import { useVeleroNamespace } from '../config';
import {
  type BackupCoverageInput,
  getCoveringSchedules,
  getSchedulesForNamespace,
  type ScheduleCoverageInput,
  type ScheduleCoverageResult,
  type WorkloadTarget,
} from '../coverage';
import { VeleroBackup, VeleroSchedule } from '../resources/velero';

function toScheduleInput(schedule: VeleroSchedule): ScheduleCoverageInput {
  return {
    name: schedule.metadata.name,
    cronSchedule: schedule.cronSchedule,
    template: schedule.template,
  };
}

function toBackupInput(backup: VeleroBackup): BackupCoverageInput {
  return {
    name: backup.metadata.name,
    scheduleName: backup.scheduleName,
    phase: backup.phase,
    startTimestamp: backup.startTimestamp,
    completionTimestamp: backup.completionTimestamp,
  };
}

export interface VeleroDataState {
  loading: boolean;
  error: Error | null;
  schedules: ScheduleCoverageInput[];
  backups: BackupCoverageInput[];
  getCoverageForWorkload: (target: WorkloadTarget) => ScheduleCoverageResult[];
  getSchedulesForNamespace: (namespace: string) => ScheduleCoverageResult[];
}

export function useVeleroData(): VeleroDataState {
  const veleroNamespace = useVeleroNamespace();
  const [schedules, schedulesError] = VeleroSchedule.useList({ namespace: veleroNamespace });
  const [backups, backupsError] = VeleroBackup.useList({ namespace: veleroNamespace });

  const scheduleInputs = useMemo(() => (schedules ?? []).map(toScheduleInput), [schedules]);
  const backupInputs = useMemo(() => (backups ?? []).map(toBackupInput), [backups]);

  const error = schedulesError ?? backupsError ?? null;
  const loading = !error && (schedules === null || backups === null);

  const getCoverageForWorkload = useMemo(
    () => (target: WorkloadTarget) => getCoveringSchedules(scheduleInputs, backupInputs, target),
    [scheduleInputs, backupInputs]
  );

  const getSchedulesForNamespaceFn = useMemo(
    () => (namespace: string) => getSchedulesForNamespace(scheduleInputs, backupInputs, namespace),
    [scheduleInputs, backupInputs]
  );

  return {
    loading,
    error,
    schedules: scheduleInputs,
    backups: backupInputs,
    getCoverageForWorkload,
    getSchedulesForNamespace: getSchedulesForNamespaceFn,
  };
}
