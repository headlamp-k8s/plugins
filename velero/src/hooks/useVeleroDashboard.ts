import { getCluster } from '@kinvolk/headlamp-plugin/lib/Utils';
import { useMemo } from 'react';
import { useVeleroNamespace } from '../config';
import {
  type BackupPhaseCounts,
  countBackupPhases,
  countRestorePhases,
  countScheduleHealth,
  countStorageHealth,
  type PhaseCountedItem,
  recentFailedItems,
  type RestorePhaseCounts,
  type ScheduleHealthCounts,
  type ScheduleHealthItem,
  type StorageHealthCounts,
  type StorageHealthItem,
} from '../dashboard/summary';
import { VeleroBackupStorageLocation } from '../resources/storage';
import { VeleroBackup, VeleroRestore, VeleroSchedule } from '../resources/velero';

export type VeleroDashboardState = {
  loading: boolean;
  error: Error | null;
  cluster?: string;
  veleroNamespace: string;
  backups: BackupPhaseCounts;
  restores: RestorePhaseCounts;
  schedules: ScheduleHealthCounts;
  storage: StorageHealthCounts;
  recentFailedBackups: PhaseCountedItem[];
  recentFailedRestores: PhaseCountedItem[];
  storageLocations: StorageHealthItem[];
};

/**
 * Loads Schedules / Backups / Restores / BSLs for the current cluster and
 * configured Velero namespace, then builds Phase 5 health summary data.
 */
export function useVeleroDashboard(): VeleroDashboardState {
  const veleroNamespace = useVeleroNamespace();
  const cluster = getCluster() || undefined;
  const listOpts = { namespace: veleroNamespace, cluster };

  const [schedules, schedulesError] = VeleroSchedule.useList(listOpts);
  const [backups, backupsError] = VeleroBackup.useList(listOpts);
  const [restores, restoresError] = VeleroRestore.useList(listOpts);
  const [bslList, bslError] = VeleroBackupStorageLocation.useList(listOpts);

  const backupItems = useMemo<PhaseCountedItem[]>(
    () =>
      (backups ?? []).map(b => ({
        name: b.getName(),
        namespace: b.getNamespace(),
        cluster: b.cluster,
        phase: b.phase,
        timestamp: b.startTimestamp ?? b.completionTimestamp ?? b.metadata.creationTimestamp,
      })),
    [backups]
  );

  const restoreItems = useMemo<PhaseCountedItem[]>(
    () =>
      (restores ?? []).map(r => ({
        name: r.getName(),
        namespace: r.getNamespace(),
        cluster: r.cluster,
        phase: r.phase,
        timestamp: r.startTimestamp ?? r.completionTimestamp ?? r.metadata.creationTimestamp,
      })),
    [restores]
  );

  const scheduleItems = useMemo<ScheduleHealthItem[]>(
    () =>
      (schedules ?? []).map(s => ({
        name: s.getName(),
        namespace: s.getNamespace(),
        cluster: s.cluster,
        statusDisplay: s.statusDisplay,
        isActivelyScheduling: s.isActivelyScheduling,
        paused: s.paused,
        isFailedValidation: s.isFailedValidation,
      })),
    [schedules]
  );

  const storageLocations = useMemo<StorageHealthItem[]>(
    () =>
      (bslList ?? []).map(bsl => ({
        name: bsl.getName(),
        namespace: bsl.getNamespace(),
        cluster: bsl.cluster,
        phase: bsl.phase,
        provider: bsl.provider,
        bucket: bsl.bucket,
      })),
    [bslList]
  );

  const error = schedulesError ?? backupsError ?? restoresError ?? bslError ?? null;
  const loading =
    !error && (schedules === null || backups === null || restores === null || bslList === null);

  return {
    loading,
    error,
    cluster,
    veleroNamespace,
    backups: countBackupPhases(backupItems),
    restores: countRestorePhases(restoreItems),
    schedules: countScheduleHealth(scheduleItems),
    storage: countStorageHealth(storageLocations),
    recentFailedBackups: recentFailedItems(backupItems),
    recentFailedRestores: recentFailedItems(restoreItems),
    storageLocations,
  };
}
