import { describe, expect, test } from 'vitest';
import { formatNextScheduledRun, getNextScheduledRun } from './cron';

describe('getNextScheduledRun', () => {
  test('returns the next occurrence for a standard cron', () => {
    const from = new Date('2026-07-05T06:00:00Z');
    const next = getNextScheduledRun('0 7 * * *', from);

    expect(next?.toISOString()).toBe('2026-07-05T07:00:00.000Z');
  });

  test('returns undefined for invalid cron expressions', () => {
    expect(getNextScheduledRun('not-a-cron')).toBeUndefined();
    expect(getNextScheduledRun('')).toBeUndefined();
  });
});

describe('formatNextScheduledRun', () => {
  test('formats the next run time in local timezone', () => {
    const from = new Date('2026-07-05T06:00:00Z');
    const formatted = formatNextScheduledRun('0 7 * * *', from);

    expect(formatted).toBe(new Date('2026-07-05T07:00:00.000Z').toLocaleString());
  });

  test('returns N/A when cron is missing or invalid', () => {
    expect(formatNextScheduledRun(undefined)).toBe('N/A');
    expect(formatNextScheduledRun('bad cron')).toBe('N/A');
  });
});
