import { formatDeletionTimeout, getCondition } from '../../resources/common';
import { getPhaseStatus, rowsToDict, toNameValueRows } from './util';

describe('util helpers (node tests)', () => {
  test('getPhaseStatus maps states correctly', () => {
    expect(getPhaseStatus('Running')).toBe('success');
    expect(getPhaseStatus('ready')).toBe('success');
    expect(getPhaseStatus('pending')).toBe('warning');
    expect(getPhaseStatus('FAILED')).toBe('error');
    expect(getPhaseStatus(undefined)).toBe('');
  });

  test('toNameValueRows handles input forms', () => {
    const obj = { a: 1, b: null };
    const rows = toNameValueRows(obj);
    expect(rows).toEqual(
      expect.arrayContaining([
        { name: 'a', value: '1' },
        { name: 'b', value: '' },
      ])
    );

    const arr = [{ name: 'x', value: 'y' }];
    expect(toNameValueRows(arr)).toEqual([{ name: 'x', value: 'y' }]);
    expect(toNameValueRows(undefined)).toEqual([]);
  });

  test('rowsToDict reverses rows', () => {
    const rows = [{ name: 'k', value: 'v' }];
    expect(rowsToDict(rows)).toEqual({ k: 'v' });
  });

  test('getCondition finds a condition by exact type', () => {
    const conditions: any = [
      { type: 'Ready', status: 'False' },
      { type: 'Available', status: 'True' },
    ];

    expect(getCondition(conditions, 'Available')).toEqual({ type: 'Available', status: 'True' });
    expect(getCondition(conditions, 'available')).toBeUndefined();
    expect(getCondition(undefined, 'Ready')).toBeUndefined();
  });

  test('formatDeletionTimeout prefers v1beta2 seconds and falls back to v1beta1 values', () => {
    expect(formatDeletionTimeout(30, '5m')).toBe('30s');
    expect(formatDeletionTimeout(undefined, '5m')).toBe('5m');
    expect(formatDeletionTimeout(undefined, 45)).toBe('45');
    expect(formatDeletionTimeout(undefined, undefined)).toBeUndefined();
  });
});
