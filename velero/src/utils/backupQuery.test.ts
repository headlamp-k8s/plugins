import { describe, expect, test } from 'vitest';
import {
  buildScheduleBackupLabelSelector,
  NO_MATCH_SCHEDULE_BACKUP_SELECTOR,
  VELERO_SCHEDULE_NAME_LABEL,
} from './backupQuery';

describe('buildScheduleBackupLabelSelector', () => {
  test('returns a valid contradictory no-match selector when there are no schedules', () => {
    expect(buildScheduleBackupLabelSelector([])).toBe(NO_MATCH_SCHEDULE_BACKUP_SELECTOR);
    expect(buildScheduleBackupLabelSelector(['', ''])).toBe(NO_MATCH_SCHEDULE_BACKUP_SELECTOR);
    expect(NO_MATCH_SCHEDULE_BACKUP_SELECTOR).toContain(`${VELERO_SCHEDULE_NAME_LABEL}=`);
    expect(NO_MATCH_SCHEDULE_BACKUP_SELECTOR).toContain(',');
    // Label values must be valid Kubernetes tokens (no leading/trailing underscores).
    expect(NO_MATCH_SCHEDULE_BACKUP_SELECTOR).toMatch(
      /=headlamp-none-a,velero\.io\/schedule-name=headlamp-none-b$/
    );
  });

  test('builds an in() selector for schedule names', () => {
    expect(buildScheduleBackupLabelSelector(['daily', 'weekly'])).toBe(
      `${VELERO_SCHEDULE_NAME_LABEL} in (daily,weekly)`
    );
  });

  test('dedupes and sorts schedule names for a stable selector', () => {
    expect(buildScheduleBackupLabelSelector(['weekly', 'daily', 'daily'])).toBe(
      `${VELERO_SCHEDULE_NAME_LABEL} in (daily,weekly)`
    );
  });

  test('quotes unusual schedule names', () => {
    expect(buildScheduleBackupLabelSelector(['weird name'])).toBe(
      `${VELERO_SCHEDULE_NAME_LABEL} in ("weird name")`
    );
  });
});
