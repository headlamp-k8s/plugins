import { formatDeletionTimeout, getCondition } from './common';

describe('common resource helpers', () => {
  test('finds a condition by exact type', () => {
    const conditions: any = [
      { type: 'Ready', status: 'False' },
      { type: 'Available', status: 'True' },
    ];

    expect(getCondition(conditions, 'Available')).toEqual({ type: 'Available', status: 'True' });
    expect(getCondition(conditions, 'available')).toBeUndefined();
    expect(getCondition(undefined, 'Ready')).toBeUndefined();
  });

  test('formats deletion timeout values across API versions', () => {
    expect(formatDeletionTimeout(30, '5m')).toBe('30s');
    expect(formatDeletionTimeout(undefined, '5m')).toBe('5m');
    expect(formatDeletionTimeout(undefined, 45)).toBe('45');
    expect(formatDeletionTimeout(undefined, undefined)).toBeUndefined();
  });
});
