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

/** Velero schedules and backups loaded from the cluster, plus coverage helpers. */
export interface VeleroDataState {
  /** True while Schedule or Backup lists are still loading. */
  loading: boolean;
  /** Set when either list request fails (for example missing RBAC). */
  error: Error | null;
  schedules: ScheduleCoverageInput[];
  backups: BackupCoverageInput[];
  /** Schedules whose template covers the workload, with last-backup metadata. */
  getCoverageForWorkload: (target: WorkloadTarget) => ScheduleCoverageResult[];
  /** Schedules that include the namespace in their template. */
  getSchedulesForNamespace: (namespace: string) => ScheduleCoverageResult[];
}

/**
 * Loads Velero Schedule and Backup CRs from the configured Velero namespace
 * and exposes helpers to compute coverage for workloads and namespaces.
 */
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
