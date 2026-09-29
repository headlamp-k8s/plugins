import { describe, expect, test } from 'vitest';
import { formatNextScheduledRun, getNextScheduledRun, parseVeleroCron } from './cron';

describe('parseVeleroCron', () => {
  test('returns UTC when no CRON_TZ prefix is present', () => {
    expect(parseVeleroCron('0 7 * * *')).toEqual({ cron: '0 7 * * *', tz: 'UTC' });
  });

  test('extracts CRON_TZ prefix and remaining cron fields', () => {
    expect(parseVeleroCron('CRON_TZ=America/New_York 0 12 * * *')).toEqual({
      cron: '0 12 * * *',
      tz: 'America/New_York',
    });
  });
});

describe('getNextScheduledRun', () => {
  test('returns the next occurrence for a standard cron', () => {
    const from = new Date('2026-07-05T06:00:00Z');
    const next = getNextScheduledRun('0 7 * * *', from);

    expect(next?.toISOString()).toBe('2026-07-05T07:00:00.000Z');
  });

  test('parses CRON_TZ= schedules instead of returning undefined', () => {
    const from = new Date('2026-07-05T06:00:00Z');
    const next = getNextScheduledRun('CRON_TZ=UTC 0 8 * * *', from);

    expect(next?.toISOString()).toBe('2026-07-05T08:00:00.000Z');
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
