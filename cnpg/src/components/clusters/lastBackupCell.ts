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

import { BackupRecord } from '../../utils/backupFacts';

/**
 * What the Last Backup column has to say about one cluster.
 *
 * `denied` and `none` are deliberately different answers: `denied` means the
 * Backup objects could not be read, `none` means they were read and none of
 * them reports a successful backup for this cluster.
 */
export type LastBackupState =
  | { kind: 'denied' }
  | { kind: 'loading' }
  | { kind: 'none' }
  /** `completedAt` is repeated here so callers get it non-null without a cast. */
  | { kind: 'record'; record: BackupRecord; completedAt: string };

export function lastBackupState({
  hasError,
  loaded,
  record,
}: {
  hasError: boolean;
  loaded: boolean;
  record: BackupRecord | undefined;
}): LastBackupState {
  // A failed read wins over anything a previous read left behind: showing a
  // stale time as though it were current would be worse than saying so.
  if (hasError) {
    return { kind: 'denied' };
  }

  if (!loaded) {
    return { kind: 'loading' };
  }

  return record?.completedAt
    ? { kind: 'record', record, completedAt: record.completedAt }
    : { kind: 'none' };
}

/**
 * Sort key for the Last Backup column — and, just as importantly, the value
 * Headlamp's table uses to decide whether the cell needs repainting.
 *
 * MemoCell in the table (components/common/Table/Table.js) compares
 * `a.cell.getValue() === b.cell.getValue()`, so a cell whose sort value did not
 * change is never re-rendered no matter how many times the list re-renders
 * around it. Every state therefore has to produce a distinct string: when a
 * denial lands after the first paint, the column would otherwise stay stuck on
 * the "not read yet" it painted at mount.
 *
 * The prefixes also give the ordering the column wants. Timestamps start with a
 * digit and sort ascending among themselves; `none` and `unknown` start with a
 * letter, so clusters that report nothing sort after clusters that do.
 */
export function lastBackupSortValue(state: LastBackupState): string {
  switch (state.kind) {
    case 'record':
      return state.completedAt;
    case 'none':
      return 'none';
    case 'denied':
      return 'unknown';
    case 'loading':
    default:
      return '';
  }
}
