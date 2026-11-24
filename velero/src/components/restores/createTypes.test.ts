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
  test('uses the first backup only for the initial empty selection', () => {
    expect(nextBackupSelection('', ['ok', 'other'], true)).toEqual({
      next: 'ok',
      allowInitial: false,
    });
  });

  test('keeps a selection that is still available, and a typed name until the list loads', () => {
    expect(nextBackupSelection('ok', ['ok', 'other'], false, true)).toEqual({
      next: 'ok',
      allowInitial: false,
    });
    expect(nextBackupSelection('typed', [], true, false)).toEqual({
      next: 'typed',
      allowInitial: false,
    });
  });

  test('clears a name when the loaded backup list is empty', () => {
    expect(nextBackupSelection('typed', [], false, true)).toEqual({
      next: '',
      allowInitial: false,
    });
  });

  test('clears a missing backup and does not replace it on the next update', () => {
    const cleared = nextBackupSelection('gone', ['ok', 'other'], false);
    expect(cleared).toEqual({ next: '', allowInitial: false });
    expect(nextBackupSelection(cleared.next, ['ok', 'other'], cleared.allowInitial)).toEqual({
      next: '',
      allowInitial: false,
    });
  });
});
