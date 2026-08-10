/*
 * Copyright 2026 The Kubernetes Authors
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { CnpgBackupLike, CnpgClusterLike, CnpgScheduledBackupLike } from '../resources/types';

/**
 * Backup facts derived from Backup objects rather than from `Cluster.status`.
 *
 * The backup timestamps on `Cluster.status` are annotated upstream
 * "Deprecated: the field is not set for backup plugins", so a cluster archiving
 * through the barman-cloud plugin leaves them empty no matter how many
 * successful backups it has. Backup objects carry no such caveat, so they are
 * what this module reads. The one fact with no Backup-object equivalent is the
 * first recoverability point, which therefore genuinely degrades to unknown.
 */

/** A Backup object flattened to the fields the UI shows. */
export interface BackupRecord {
  name: string;
  namespace: string | null;
  phase: string | null;
  method: string | null;
  startedAt: string | null;
  /** Best available "this backup finished at" time; see completionTime(). */
  completedAt: string | null;
  error: string | null;
  backupId: string | null;
}

export interface BackupSummary {
  total: number;
  lastSuccessful: BackupRecord | null;
  lastFailed: BackupRecord | null;
  inProgress: BackupRecord[];
  methods: string[];
}

/** `Backup.status.phase` values that mean the backup finished successfully. */
const SUCCESS_PHASES = new Set(['completed']);

/**
 * Phases that mean the backup did not and will not produce a restorable copy.
 *
 * `walArchivingFailing` is included because the operator refuses to start a
 * backup while WAL archiving is broken, so it is a failure from the user's
 * point of view even though no backup was attempted.
 */
const FAILURE_PHASES = new Set(['failed', 'walArchivingFailing', 'invalid backup definition']);

/** Phases that mean the backup is still going. */
const IN_PROGRESS_PHASES = new Set(['pending', 'started', 'running', 'finalizing']);

function toBackupRecord(backup: CnpgBackupLike): BackupRecord {
  const status = backup.status ?? {};

  return {
    name: backup.metadata?.name ?? '',
    namespace: backup.metadata?.namespace ?? null,
    phase: status.phase ?? null,
    method: status.method ?? backup.spec?.method ?? null,
    startedAt: status.startedAt ?? null,
    completedAt: status.stoppedAt ?? status.startedAt ?? backup.metadata?.creationTimestamp ?? null,
    error: status.error ?? null,
    backupId: status.backupId ?? null,
  };
}

/** Epoch millis for ordering, with unparseable/absent times sorting oldest. */
function completionTime(record: BackupRecord): number {
  const parsed = record.completedAt ? Date.parse(record.completedAt) : Number.NaN;

  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
}

function latest(records: BackupRecord[]): BackupRecord | null {
  if (records.length === 0) {
    return null;
  }

  return records.reduce((newest, candidate) =>
    completionTime(candidate) >= completionTime(newest) ? candidate : newest
  );
}

/**
 * Returns the Backup objects belonging to the named cluster.
 *
 * A Backup that names no cluster is dropped rather than attributed, so an
 * unrelated or malformed object can never inflate a cluster's backup history.
 */
export function backupsForCluster(
  backups: CnpgBackupLike[] | null | undefined,
  clusterName: string
): BackupRecord[] {
  return (backups ?? [])
    .filter(
      backup => Boolean(backup.spec?.cluster?.name) && backup.spec?.cluster?.name === clusterName
    )
    .map(toBackupRecord);
}

/**
 * Reduces a cluster's Backup objects to the facts the detail view shows.
 *
 * Phases this plugin does not recognise are counted in the total but not
 * classified, so a future CNPG release cannot cause a backup to be silently
 * reported as either a success or a failure.
 */
export function summarizeBackups(records: BackupRecord[]): BackupSummary {
  const successes = records.filter(record => record.phase && SUCCESS_PHASES.has(record.phase));
  const failures = records.filter(record => record.phase && FAILURE_PHASES.has(record.phase));
  const inProgress = records.filter(record => record.phase && IN_PROGRESS_PHASES.has(record.phase));

  const methods = [...new Set(records.map(record => record.method).filter(Boolean))] as string[];

  return {
    total: records.length,
    lastSuccessful: latest(successes),
    lastFailed: latest(failures),
    inProgress,
    methods: methods.sort(),
  };
}

export type ContinuousArchivingState = 'ok' | 'failing' | 'unknown';

export interface ContinuousArchivingStatus {
  state: ContinuousArchivingState;
  reason: string | null;
  message: string | null;
  lastTransitionTime: string | null;
}

/**
 * Reads the operator's own verdict on WAL archiving.
 *
 * Note that CNPG reports this condition as True even on clusters with no backup
 * configuration at all, so "ok" here means "the operator sees nothing wrong",
 * not "this cluster is being archived somewhere". Pair it with
 * describeBackupConfiguration before drawing any conclusion.
 */
export function getContinuousArchivingStatus(
  cluster: CnpgClusterLike | undefined
): ContinuousArchivingStatus {
  const condition = (cluster?.status?.conditions ?? []).find(
    candidate => candidate.type === 'ContinuousArchiving'
  );

  const state: ContinuousArchivingState =
    condition?.status === 'True' ? 'ok' : condition?.status === 'False' ? 'failing' : 'unknown';

  return {
    state,
    reason: condition?.reason ?? null,
    message: condition?.message ?? null,
    lastTransitionTime: condition?.lastTransitionTime ?? null,
  };
}

/**
 * Returns the earliest point in time the cluster could be restored to, or null.
 *
 * Both source fields are deprecated upstream and unset for plugin-based
 * backups, and no Backup object carries this fact, so null must be shown as
 * "unknown" rather than as "no recovery window".
 */
export function getFirstRecoverabilityPoint(cluster: CnpgClusterLike | undefined): string | null {
  const status = cluster?.status;
  if (status?.firstRecoverabilityPoint) {
    return status.firstRecoverabilityPoint;
  }

  const byMethod = Object.values(status?.firstRecoverabilityPointByMethod ?? {}).filter(Boolean);
  if (byMethod.length === 0) {
    return null;
  }

  // Earliest wins: it is the oldest moment any configured method can reach.
  return byMethod.reduce((earliest, current) => (current < earliest ? current : earliest));
}

export interface BackupConfiguration {
  kind: 'barmanObjectStore' | 'plugin' | 'none';
  retentionPolicy: string | null;
  walArchiverPlugins: string[];
}

/**
 * Describes how, if at all, the cluster is configured to archive.
 *
 * This reads spec, so it says what was asked for, not what is working.
 */
export function describeBackupConfiguration(
  cluster: CnpgClusterLike | undefined
): BackupConfiguration {
  const spec = cluster?.spec ?? {};

  const walArchiverPlugins = (spec.plugins ?? [])
    .filter(plugin => plugin.isWALArchiver && plugin.enabled !== false && Boolean(plugin.name))
    .map(plugin => plugin.name as string);

  const hasObjectStore = Boolean(spec.backup?.barmanObjectStore);

  return {
    kind: hasObjectStore ? 'barmanObjectStore' : walArchiverPlugins.length > 0 ? 'plugin' : 'none',
    retentionPolicy: spec.backup?.retentionPolicy ?? null,
    walArchiverPlugins,
  };
}

export interface ScheduledBackupRecord {
  name: string;
  schedule: string | null;
  suspended: boolean;
  nextScheduleTime: string | null;
  error: string | null;
}

/** Returns the schedules that target the named cluster. */
export function scheduledBackupsForCluster(
  scheduledBackups: CnpgScheduledBackupLike[] | null | undefined,
  clusterName: string
): ScheduledBackupRecord[] {
  return (scheduledBackups ?? [])
    .filter(
      scheduled =>
        Boolean(scheduled.spec?.cluster?.name) && scheduled.spec?.cluster?.name === clusterName
    )
    .map(scheduled => ({
      name: scheduled.metadata?.name ?? '',
      schedule: scheduled.spec?.schedule ?? null,
      suspended: scheduled.spec?.suspend === true,
      nextScheduleTime: scheduled.status?.nextScheduleTime ?? null,
      error: scheduled.status?.error ?? null,
    }));
}
