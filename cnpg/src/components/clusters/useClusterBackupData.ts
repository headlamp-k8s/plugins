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

import { BackupClass, ScheduledBackupClass } from '../../resources/backup';
import { ClusterClass } from '../../resources/cluster';
import {
  BackupRecord,
  backupsForCluster,
  ScheduledBackupRecord,
  scheduledBackupsForCluster,
} from '../../utils/backupFacts';
import { MaybeApiError } from '../../utils/permissions';

export interface ClusterBackupData {
  backups: BackupRecord[];
  schedules: ScheduledBackupRecord[];
  /**
   * Whether `backups` is an answer or a placeholder.
   *
   * False while the list is still loading and false when the read failed, so
   * `backups: []` only means "this cluster has none" when this is true. The
   * distinction matters because the rules engine will otherwise report a
   * cluster as never backed up on the strength of a list nobody managed to
   * read — see LastBackupState, which draws the same line for the list view.
   */
  backupsReadable: boolean;
  schedulesReadable: boolean;
  backupsError: MaybeApiError | null;
  schedulesError: MaybeApiError | null;
}

/**
 * Reads the Backup and ScheduledBackup objects belonging to one cluster.
 *
 * Fetched once by the detail view and passed down, so that the backup facts
 * section and the insights panel cannot disagree with each other and an RBAC
 * denial is reported in one place rather than repeated per section.
 */
export function useClusterBackupData(cluster: ClusterClass): ClusterBackupData {
  // Undefined rather than '' when the namespace is missing: Headlamp normalizes
  // a string namespace to [namespace], so '' becomes [''] and is then treated as
  // a real namespace to query rather than as "no filter given". Undefined is the
  // value that falls back to the allowed namespaces.
  const namespace = cluster.metadata.namespace || undefined;
  const name = cluster.metadata.name;

  // useList returns null for the list until the first response arrives, and
  // keeps returning null when the read fails. Both are "not known", and neither
  // is "empty" — flattening them here is what fed a fabricated critical to the
  // insights panel, so the null is turned into a flag rather than into [].
  const [backups, backupsError] = BackupClass.useList({ namespace });
  const [scheduledBackups, schedulesError] = ScheduledBackupClass.useList({ namespace });

  return {
    backups: backupsForCluster(
      backups?.map(backup => backup.jsonData),
      name
    ),
    schedules: scheduledBackupsForCluster(
      scheduledBackups?.map(scheduled => scheduled.jsonData),
      name
    ),
    backupsReadable: backups !== null && !backupsError,
    schedulesReadable: scheduledBackups !== null && !schedulesError,
    backupsError: backupsError ?? null,
    schedulesError: schedulesError ?? null,
  };
}
