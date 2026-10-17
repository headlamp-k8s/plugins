import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import { useMemo } from 'react';
import { useVeleroNamespace } from '../config';
import {
  type BackupCoverageInput,
  buildLatestBackupBySchedule,
  getCoveringSchedules,
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
    cluster: schedule.cluster,
    cronSchedule: schedule.cronSchedule,
    paused: schedule.paused,
    phase: schedule.phase,
    template: schedule.template,
    creationTimestamp: schedule.metadata.creationTimestamp,
    lastBackupTime: schedule.lastBackupTime,
    lastSkippedTime: schedule.lastSkippedTime,
  };
}

function toBackupInput(backup: VeleroBackup): BackupCoverageInput {
  return {
    name: backup.metadata.name,
    cluster: backup.cluster,
    scheduleName: backup.scheduleName,
    phase: backup.phase,
    startTimestamp: backup.startTimestamp,
    completionTimestamp: backup.completionTimestamp,
    creationTimestamp: backup.metadata.creationTimestamp,
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
  /**
   * O(1) lookup of latest Backup by {@link scheduleBackupLookupKey}
   * (cluster + schedule name).
   */
  latestBackupBySchedule: Map<string, BackupCoverageInput>;
  /** Schedules whose template covers the workload, with last-backup metadata. */
  getCoverageForWorkload: (target: WorkloadTarget) => ScheduleCoverageResult[];
  /** Schedules whose template targets the namespace (namespace filters only). */
  getSchedulesForNamespace: (namespace: string) => ScheduleCoverageResult[];
}

/**
 * Loads Velero Schedule CRs and schedule-scoped Backup CRs from the configured
 * Velero namespace, and exposes helpers to compute coverage for workloads and
 * namespaces.
 *
 * Pass `namespaceOverride` (e.g. Schedule detail route namespace) so related
 * Backup lookups use the same scope as the resource being viewed. Detail
 * queries are also pinned to the current Headlamp cluster so multi-cluster
 * selection cannot mix another cluster's Backup history into this page.
 *
 * Backups are fetched with a `velero.io/schedule-name` labelSelector (excludes
 * manual Backups). Results are reduced client-side to the latest Backup per
 * (cluster, schedule) for coverage panels. Long TTLs can still return large
 * histories for those schedules. The cluster-wide Backups page uses
 * ResourceListView / VeleroBackup.useList separately for the full table.
 */
export function useVeleroData(namespaceOverride?: string): VeleroDataState {
  const configuredNamespace = useVeleroNamespace();
  const veleroNamespace = namespaceOverride || configuredNamespace;
  // Detail pages pass namespaceOverride — pin to the viewed cluster as well.
  const detailCluster = namespaceOverride ? getCluster() || undefined : undefined;
  const listOpts = detailCluster
    ? { namespace: veleroNamespace, cluster: detailCluster }
    : { namespace: veleroNamespace };

  const [schedules, schedulesError] = VeleroSchedule.useList(listOpts);

  const scheduleNames = useMemo(
    () => (schedules ?? []).map(schedule => schedule.metadata.name).filter(Boolean),
    [schedules]
  );
  const backupLabelSelector = useMemo(
    () => buildScheduleBackupLabelSelector(scheduleNames),
    [scheduleNames]
  );

  const [backups, backupsError] = VeleroBackup.useList({
    ...listOpts,
    labelSelector: backupLabelSelector,
  });

  const scheduleInputs = useMemo(() => (schedules ?? []).map(toScheduleInput), [schedules]);

  // One pass over Backup history → latest per (cluster, schedule).
  const latestBackupBySchedule = useMemo(
    () => buildLatestBackupBySchedule((backups ?? []).map(toBackupInput)),
    [backups]
  );

  const backupInputs = useMemo(
    () => Array.from(latestBackupBySchedule.values()),
    [latestBackupBySchedule]
  );

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
    latestBackupBySchedule,
    getCoverageForWorkload,
    getSchedulesForNamespace: getSchedulesForNamespaceFn,
  };
}
