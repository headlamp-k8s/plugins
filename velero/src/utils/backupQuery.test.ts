import { describe, expect, test } from 'vitest';
import {
  buildScheduleBackupLabelSelector,
  NO_MATCH_SCHEDULE_BACKUP_SELECTOR,
  VELERO_SCHEDULE_NAME_LABEL,
} from './backupQuery';

describe('buildScheduleBackupLabelSelector', () => {
  test('returns a no-match sentinel when there are no schedules', () => {
    expect(buildScheduleBackupLabelSelector([])).toBe(NO_MATCH_SCHEDULE_BACKUP_SELECTOR);
    expect(buildScheduleBackupLabelSelector(['', ''])).toBe(NO_MATCH_SCHEDULE_BACKUP_SELECTOR);
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
