import { describe, expect, test } from 'vitest';
import { getBackupStatusColor, getDataMovementStatusColor, getScheduleStatusColor } from './status';

/**
 * Phase vocabulary shared by PodVolumeBackup, PodVolumeRestore, DataUpload
 * and DataDownload, from the Velero API types.
 */
const DATAMOVER_PHASES = [
  'New',
  'Accepted',
  'Prepared',
  'InProgress',
  'Canceling',
  'Canceled',
  'Completed',
  'Failed',
];

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

describe('getDataMovementStatusColor', () => {
  test('gives every datamover phase a tone', () => {
    for (const phase of DATAMOVER_PHASES) {
      expect(getDataMovementStatusColor(phase), `${phase} has no tone`).not.toBe('');
    }
  });

  test.each([
    ['New', 'warning'],
    ['Accepted', 'warning'],
    ['Prepared', 'warning'],
    ['InProgress', 'warning'],
    ['Canceling', 'warning'],
    ['Canceled', 'error'],
    ['Completed', 'success'],
    ['Failed', 'error'],
  ])('maps %s to %s', (phase, expected) => {
    expect(getDataMovementStatusColor(phase)).toBe(expected);
  });

  test('returns no tone for a phase outside the vocabulary', () => {
    expect(getDataMovementStatusColor('PartiallyFailed')).toBe('');
    expect(getDataMovementStatusColor('')).toBe('');
  });
});

describe('getScheduleStatusColor', () => {
  test('maps Active and FailedValidation', () => {
    expect(getScheduleStatusColor('Active')).toBe('success');
    expect(getScheduleStatusColor('FailedValidation')).toBe('error');
  });
});
