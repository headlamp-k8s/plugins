import { describe, expect, test } from 'vitest';
import { backupNameLabelSelector, getValidName, restoreNameLabelSelector } from './veleroLabel';

describe('getValidName', () => {
  test('returns short names unchanged', () => {
    expect(getValidName('shop-csi-move-5')).toBe('shop-csi-move-5');
  });

  test('truncates long names with sha256 suffix (Velero GetValidName)', () => {
    const long = 'a'.repeat(70);
    const valid = getValidName(long);
    expect(valid.length).toBe(63);
    expect(valid.startsWith('a'.repeat(57))).toBe(true);
    // SHA-256 of 70×"a" starts with 6bd5e5…
    expect(valid).toBe(`${'a'.repeat(57)}6bd5e5`);
  });
});

describe('label selectors', () => {
  test('backup and restore selectors use valid names', () => {
    expect(backupNameLabelSelector('short')).toBe('velero.io/backup-name=short');
    expect(restoreNameLabelSelector('short')).toBe('velero.io/restore-name=short');
  });
});
