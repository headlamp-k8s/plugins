import { useMemo } from 'react';
import { useVeleroNamespace } from '../config';
import {
  type BackupCoverageInput,
  getCoveringSchedules,
  getLatestBackupForSchedule,
  getSchedulesForNamespace,
  type ScheduleCoverageInput,
  type ScheduleCoverageResult,
  type WorkloadTarget,
} from '../coverage';
import { VeleroBackup, VeleroSchedule } from '../resources/velero';
import { buildScheduleBackupLabelSelector } from '../utils/backupQuery';

function toScheduleInput(schedule: VeleroSchedule): ScheduleCoverageInput {
  return {
    name: schedule.metadata.name,
    cronSchedule: schedule.cronSchedule,
    paused: schedule.paused,
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
  /** Latest backup per schedule (not the full Backup list). */
  backups: BackupCoverageInput[];
  /** Schedules whose template covers the workload, with last-backup metadata. */
  getCoverageForWorkload: (target: WorkloadTarget) => ScheduleCoverageResult[];
  /** Schedules that include the namespace in their template. */
  getSchedulesForNamespace: (namespace: string) => ScheduleCoverageResult[];
}

/**
 * Loads Velero Schedule CRs and schedule-scoped Backup CRs from the configured
 * Velero namespace, and exposes helpers to compute coverage for workloads and
 * namespaces.
 *
 * Backups are fetched with a `velero.io/schedule-name` labelSelector (excludes
 * manual Backups). Results are reduced client-side to the latest Backup per
 * schedule for coverage panels. Long TTLs can still return large histories for
 * those schedules. The cluster-wide Backups page uses ResourceListView /
 * VeleroBackup.useList separately for the full table.
 */
export function useVeleroData(): VeleroDataState {
  const veleroNamespace = useVeleroNamespace();
  const [schedules, schedulesError] = VeleroSchedule.useList({ namespace: veleroNamespace });

  const scheduleNames = useMemo(
    () => (schedules ?? []).map(schedule => schedule.metadata.name).filter(Boolean),
    [schedules]
  );
  const backupLabelSelector = useMemo(
    () => buildScheduleBackupLabelSelector(scheduleNames),
    [scheduleNames]
  );

  const [backups, backupsError] = VeleroBackup.useList({
    namespace: veleroNamespace,
    labelSelector: backupLabelSelector,
  });

  const scheduleInputs = useMemo(() => (schedules ?? []).map(toScheduleInput), [schedules]);

  // Keep only the latest backup per schedule for coverage / schedule views.
  const backupInputs = useMemo(() => {
    const inputs = (backups ?? []).map(toBackupInput);
    return scheduleInputs
      .map(schedule => getLatestBackupForSchedule(inputs, schedule.name))
      .filter((backup): backup is BackupCoverageInput => !!backup);
  }, [backups, scheduleInputs]);

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
