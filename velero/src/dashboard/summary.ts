/** Phase 5 — pure health summary helpers (no React / k8s). */

export const FAILED_BACKUP_PHASES = new Set([
  'Failed',
  'PartiallyFailed',
  'FailedValidation',
  'WaitingForPluginOperationsPartiallyFailed',
  'FinalizingPartiallyFailed',
]);

export const IN_PROGRESS_BACKUP_PHASES = new Set([
  'New',
  'InProgress',
  'WaitingForPluginOperations',
  'Finalizing',
  'Deleting',
  'Queued',
  'ReadyToStart',
]);

export type PhaseCountedItem = {
  name: string;
  namespace: string;
  cluster?: string;
  phase: string;
  /** Prefer start/completion; fall back to creation for sorting. */
  timestamp?: string;
};

export type ScheduleHealthItem = {
  name: string;
  namespace: string;
  cluster?: string;
  statusDisplay: string;
  isActivelyScheduling: boolean;
  paused: boolean;
  isFailedValidation: boolean;
};

export type StorageHealthItem = {
  name: string;
  namespace: string;
  cluster?: string;
  phase: string;
  provider?: string;
  bucket?: string;
};

export type BackupPhaseCounts = {
  total: number;
  completed: number;
  failed: number;
  inProgress: number;
  other: number;
};

export type ScheduleHealthCounts = {
  total: number;
  active: number;
  paused: number;
  failedValidation: number;
  other: number;
};

export type StorageHealthCounts = {
  total: number;
  available: number;
  unavailable: number;
  other: number;
};

export type RestorePhaseCounts = BackupPhaseCounts;

export function countBackupPhases(items: PhaseCountedItem[]): BackupPhaseCounts {
  const counts: BackupPhaseCounts = {
    total: items.length,
    completed: 0,
    failed: 0,
    inProgress: 0,
    other: 0,
  };
  for (const item of items) {
    if (item.phase === 'Completed') {
      counts.completed += 1;
    } else if (FAILED_BACKUP_PHASES.has(item.phase)) {
      counts.failed += 1;
    } else if (IN_PROGRESS_BACKUP_PHASES.has(item.phase)) {
      counts.inProgress += 1;
    } else {
      counts.other += 1;
    }
  }
  return counts;
}

export function countRestorePhases(items: PhaseCountedItem[]): RestorePhaseCounts {
  return countBackupPhases(items);
}

export function countScheduleHealth(items: ScheduleHealthItem[]): ScheduleHealthCounts {
  const counts: ScheduleHealthCounts = {
    total: items.length,
    active: 0,
    paused: 0,
    failedValidation: 0,
    other: 0,
  };
  for (const item of items) {
    if (item.isFailedValidation) {
      counts.failedValidation += 1;
    } else if (item.paused) {
      counts.paused += 1;
    } else if (item.isActivelyScheduling) {
      counts.active += 1;
    } else {
      counts.other += 1;
    }
  }
  return counts;
}

export function countStorageHealth(items: StorageHealthItem[]): StorageHealthCounts {
  const counts: StorageHealthCounts = {
    total: items.length,
    available: 0,
    unavailable: 0,
    other: 0,
  };
  for (const item of items) {
    if (item.phase === 'Available') {
      counts.available += 1;
    } else if (item.phase === 'Unavailable') {
      counts.unavailable += 1;
    } else {
      counts.other += 1;
    }
  }
  return counts;
}

function timestampMs(value?: string): number {
  if (!value) {
    return 0;
  }
  const ms = Date.parse(value);
  return Number.isNaN(ms) ? 0 : ms;
}

/** Newest-first failed / partially-failed backups (or restores). */
export function recentFailedItems(items: PhaseCountedItem[], limit = 8): PhaseCountedItem[] {
  return items
    .filter(item => FAILED_BACKUP_PHASES.has(item.phase))
    .sort((a, b) => timestampMs(b.timestamp) - timestampMs(a.timestamp))
    .slice(0, limit);
}
