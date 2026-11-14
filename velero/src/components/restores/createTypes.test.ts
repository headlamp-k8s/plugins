import { describe, expect, test } from 'vitest';
import { nextBackupSelection, restorableBackupNames } from './createTypes';

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

describe('nextBackupSelection', () => {
  test('uses the first backup only when nothing is selected yet', () => {
    expect(nextBackupSelection('', ['ok', 'other'])).toBe('ok');
  });

  test('keeps a selection that is still available, including a typed name when the list is empty', () => {
    expect(nextBackupSelection('ok', ['ok', 'other'])).toBe('ok');
    expect(nextBackupSelection('typed', [])).toBe('typed');
  });

  test('clears a selection that disappeared instead of substituting another backup', () => {
    expect(nextBackupSelection('gone', ['ok', 'other'])).toBe('');
  });
});
