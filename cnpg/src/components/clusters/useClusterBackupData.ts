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
  const namespace = cluster.metadata.namespace ?? '';
  const name = cluster.metadata.name;

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
    backupsError: backupsError ?? null,
    schedulesError: schedulesError ?? null,
  };
}
