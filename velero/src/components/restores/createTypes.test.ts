import { describe, expect, test } from 'vitest';
import { restorableBackupNames } from './createTypes';

describe('restorableBackupNames', () => {
  test('keeps Completed and PartiallyFailed backups only', () => {
    expect(
      restorableBackupNames([
        { name: 'ok', phase: 'Completed' },
        { name: 'partial', phase: 'PartiallyFailed' },
        { name: 'running', phase: 'InProgress' },
        { name: 'bad', phase: 'Failed' },
        { name: 'gone', phase: 'Deleting' },
      ])
    ).toEqual(['ok', 'partial']);
  });
});
