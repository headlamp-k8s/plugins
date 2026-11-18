import { describe, expect, test } from 'vitest';
import {
  backupMapStatus,
  scheduleMapStatus,
  storageMapStatus,
  veleroMapEdges,
} from './relationships';

const schedule = {
  uid: 'schedule-1',
  name: 'nightly',
  namespace: 'velero',
  storageLocation: 'default',
};
const backup = {
  uid: 'backup-1',
  name: 'nightly-1',
  namespace: 'velero',
  scheduleName: 'nightly',
  storageLocation: 'default',
};
const restore = {
  uid: 'restore-1',
  name: 'nightly-restore',
  namespace: 'velero',
  backupName: 'nightly-1',
};
const location = { uid: 'bsl-1', name: 'default', namespace: 'velero' };

describe('veleroMapEdges', () => {
  test('links a schedule, its backup, the restore, and the storage location', () => {
    const edges = veleroMapEdges({
      schedules: [schedule],
      backups: [backup],
      restores: [restore],
      storageLocations: [location],
    });

    expect(edges.map(item => item.label)).toEqual(['creates', 'stores', 'stores', 'restores']);
    expect(edges.map(item => [item.source, item.target])).toEqual([
      ['schedule-1', 'backup-1'],
      ['backup-1', 'bsl-1'],
      ['schedule-1', 'bsl-1'],
      ['backup-1', 'restore-1'],
    ]);
  });

  test('does not link objects from another namespace or a missing name', () => {
    const edges = veleroMapEdges({
      schedules: [{ ...schedule, namespace: 'other' }],
      backups: [{ ...backup, scheduleName: undefined, storageLocation: 'missing' }],
      restores: [{ ...restore, backupName: 'gone', scheduleName: 'nightly' }],
      storageLocations: [location],
    });

    expect(edges).toEqual([]);
  });
});

describe('map status', () => {
  test('uses success, warning, and error for Velero phases', () => {
    expect(backupMapStatus('Completed')).toBe('success');
    expect(backupMapStatus('InProgress')).toBe('warning');
    expect(backupMapStatus('Failed')).toBe('error');
    expect(scheduleMapStatus('Paused')).toBe('warning');
    expect(storageMapStatus('Unavailable')).toBe('error');
    expect(backupMapStatus('SomethingElse')).toBeUndefined();
  });
});
