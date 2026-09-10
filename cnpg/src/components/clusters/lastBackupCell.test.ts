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

import { describe, expect, it } from 'vitest';
import { BackupRecord } from '../../utils/backupFacts';
import { lastBackupSortValue, LastBackupState, lastBackupState } from './lastBackupCell';

function record(overrides: Partial<BackupRecord> = {}): BackupRecord {
  return {
    name: 'backup-1',
    namespace: 'db',
    phase: 'completed',
    method: 'plugin',
    startedAt: '2026-08-10T02:59:00Z',
    completedAt: '2026-08-10T03:00:00Z',
    error: null,
    backupId: null,
    ...overrides,
  };
}

describe('lastBackupState', () => {
  it('reports denied when the Backup list could not be read', () => {
    expect(lastBackupState({ hasError: true, loaded: false, record: undefined })).toEqual({
      kind: 'denied',
    });
  });

  it('prefers denied over a record left over from an earlier read', () => {
    expect(lastBackupState({ hasError: true, loaded: true, record: record() })).toEqual({
      kind: 'denied',
    });
  });

  it('reports loading until the Backup list has resolved', () => {
    expect(lastBackupState({ hasError: false, loaded: false, record: undefined })).toEqual({
      kind: 'loading',
    });
  });

  it('reports none when the Backups were read and none succeeded', () => {
    expect(lastBackupState({ hasError: false, loaded: true, record: undefined })).toEqual({
      kind: 'none',
    });
  });

  it('reports the record when one succeeded', () => {
    const found = record();
    expect(lastBackupState({ hasError: false, loaded: true, record: found })).toEqual({
      kind: 'record',
      record: found,
      completedAt: found.completedAt,
    });
  });

  it('treats a record without a completion time as nothing to show', () => {
    expect(
      lastBackupState({ hasError: false, loaded: true, record: record({ completedAt: null }) })
    ).toEqual({ kind: 'none' });
  });
});

describe('lastBackupSortValue', () => {
  function recorded(completedAt = '2026-08-10T03:00:00Z'): LastBackupState {
    return { kind: 'record', record: record({ completedAt }), completedAt };
  }

  // Headlamp's table memoizes each cell on its column's getValue() output
  // (MemoCell in components/common/Table/Table.js compares
  // `a.cell.getValue() === b.cell.getValue()`), so two states that share a sort
  // value are two states the table will not repaint between. A denial arriving
  // after the first paint has to change this string or the column stays stuck
  // on whatever it rendered first.
  it('gives every distinct state a distinct value', () => {
    const values = [
      lastBackupSortValue({ kind: 'loading' }),
      lastBackupSortValue({ kind: 'denied' }),
      lastBackupSortValue({ kind: 'none' }),
      lastBackupSortValue(recorded()),
    ];

    expect(new Set(values).size).toBe(values.length);
  });

  it('sorts backups oldest first', () => {
    const older = lastBackupSortValue(recorded('2026-08-09T03:00:00Z'));
    const newer = lastBackupSortValue(recorded('2026-08-10T03:00:00Z'));

    expect(older < newer).toBe(true);
  });

  it('sorts clusters that report nothing after clusters that report a backup', () => {
    const backed = lastBackupSortValue(recorded());

    expect(backed < lastBackupSortValue({ kind: 'none' })).toBe(true);
    expect(backed < lastBackupSortValue({ kind: 'denied' })).toBe(true);
  });
});
