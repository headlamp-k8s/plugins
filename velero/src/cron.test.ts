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

  test.each([
    ['@yearly', '2027-01-01T00:00:00.000Z'],
    ['@annually', '2027-01-01T00:00:00.000Z'],
    ['@monthly', '2026-11-01T00:00:00.000Z'],
    ['@weekly', '2026-10-25T00:00:00.000Z'],
    ['@daily', '2026-10-21T00:00:00.000Z'],
    ['@midnight', '2026-10-21T00:00:00.000Z'],
    ['@hourly', '2026-10-20T13:00:00.000Z'],
  ])('resolves the Velero descriptor %s', (descriptor, expected) => {
    const from = new Date('2026-10-20T12:00:00Z');

    expect(getNextScheduledRun(descriptor, from)?.toISOString()).toBe(expected);
  });

  test('treats @midnight as @daily, with and without a CRON_TZ prefix', () => {
    const from = new Date('2026-10-20T12:00:00Z');

    expect(getNextScheduledRun('@midnight', from)?.toISOString()).toBe(
      getNextScheduledRun('@daily', from)?.toISOString()
    );
    expect(getNextScheduledRun('CRON_TZ=Asia/Kolkata @midnight', from)?.toISOString()).toBe(
      getNextScheduledRun('CRON_TZ=Asia/Kolkata @daily', from)?.toISOString()
    );
  });

  test('leaves manual-only descriptors without a next run', () => {
    // Velero accepts these, but they never fire on their own, so N/A is correct.
    expect(getNextScheduledRun('@triggered')).toBeUndefined();
    expect(getNextScheduledRun('@manual')).toBeUndefined();
    expect(getNextScheduledRun('@none')).toBeUndefined();
  });

  test('parses Velero @every interval schedules', () => {
    const from = new Date('2026-07-05T06:00:00Z');
    expect(getNextScheduledRun('@every 5m', from)?.toISOString()).toBe('2026-07-05T06:05:00.000Z');
    expect(getNextScheduledRun('@every 1h30m', from)?.toISOString()).toBe(
      '2026-07-05T07:30:00.000Z'
    );
  });

  test('advances @every from last-backup anchor instead of now', () => {
    const now = new Date('2026-07-05T06:00:00Z');
    const lastBackup = new Date('2026-07-05T05:10:00Z');
    expect(getNextScheduledRun('@every 1h', now, lastBackup)?.toISOString()).toBe(
      '2026-07-05T06:10:00.000Z'
    );
  });

  test('skips missed @every intervals until after now', () => {
    const now = new Date('2026-07-05T06:00:00Z');
    const lastBackup = new Date('2026-07-05T03:00:00Z');
    expect(getNextScheduledRun('@every 1h', now, lastBackup)?.toISOString()).toBe(
      '2026-07-05T07:00:00.000Z'
    );
  });

  test('rounds sub-second @every delays up to 1s and stays O(1)', () => {
    const now = new Date('2026-07-05T06:00:00.000Z');
    const anchor = new Date('2025-07-05T06:00:00.000Z');
    // Velero/robfig: @every 1ms → 1s interval; next is one second after now when on a boundary.
    expect(getNextScheduledRun('@every 1ms', now, anchor)?.toISOString()).toBe(
      '2026-07-05T06:00:01.000Z'
    );
  });

  test('returns undefined for invalid @every durations', () => {
    expect(getNextScheduledRun('@every')).toBeUndefined();
    expect(getNextScheduledRun('@every notaduration')).toBeUndefined();
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
