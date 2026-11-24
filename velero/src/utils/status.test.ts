import { describe, expect, test } from 'vitest';
import { getBackupStatusColor, getScheduleStatusColor } from './status';

describe('getBackupStatusColor', () => {
  test('maps nonterminal phases to warning', () => {
    for (const phase of [
      'Queued',
      'ReadyToStart',
      'WaitingForPluginOperations',
      'Finalizing',
      'InProgress',
      'New',
    ]) {
      expect(getBackupStatusColor(phase)).toBe('warning');
    }
  });

  test('maps partially-failed plugin/finalizing phases to error', () => {
    expect(getBackupStatusColor('WaitingForPluginOperationsPartiallyFailed')).toBe('error');
    expect(getBackupStatusColor('FinalizingPartiallyFailed')).toBe('error');
    expect(getBackupStatusColor('PartiallyFailed')).toBe('error');
  });
});

describe('getScheduleStatusColor', () => {
  test('maps Active and FailedValidation', () => {
    expect(getScheduleStatusColor('Active')).toBe('success');
    expect(getScheduleStatusColor('FailedValidation')).toBe('error');
  });
});
