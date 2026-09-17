import { describe, expect, it } from 'vitest';
import { VeleroBackup } from './backup';
import { VeleroSchedule } from './schedule';

describe('VeleroBackup KubeObject', () => {
  it('parses backup specs, phase, and storage locations correctly', () => {
    const rawBackup = {
      apiVersion: 'velero.io/v1',
      kind: 'Backup',
      metadata: {
        name: 'sample-backup',
        namespace: 'velero',
        uid: '123-abc-456',
        creationTimestamp: '2026-08-06T10:00:00Z',
      },
      spec: {
        includedNamespaces: ['test-app'],
        storageLocation: 'default',
        ttl: '720h0m0s',
      },
      status: {
        phase: 'Completed',
        errors: 0,
        warnings: 1,
        expiration: '2026-09-05T12:00:00Z',
      },
    };

    const backup = new VeleroBackup(rawBackup as any);

    expect(backup.metadata.name).toBe('sample-backup');
    expect(backup.phase).toBe('Completed');
    expect(backup.includedNamespaces).toEqual(['test-app']);
    expect(backup.storageLocation).toBe('default');
    expect(backup.errorsCount).toBe(0);
    expect(backup.warningsCount).toBe(1);
    expect(backup.expiration).toBe('2026-09-05T12:00:00Z');
  });
});

describe('VeleroSchedule KubeObject', () => {
  it('parses schedule cron expression and status correctly', () => {
    const rawSchedule = {
      apiVersion: 'velero.io/v1',
      kind: 'Schedule',
      metadata: {
        name: 'daily-backup',
        namespace: 'velero',
        uid: '789-xyz-012',
        creationTimestamp: '2026-08-06T10:00:00Z',
      },
      spec: {
        schedule: '0 1 * * *',
        template: {
          includedNamespaces: ['test-app'],
        },
      },
      status: {
        lastBackup: '2026-08-06T10:00:00Z',
      },
    };

    const schedule = new VeleroSchedule(rawSchedule as any);

    expect(schedule.metadata.name).toBe('daily-backup');
    expect(schedule.cronSchedule).toBe('0 1 * * *');
    expect(schedule.isPaused).toBe(false);
    expect(schedule.lastBackupTimestamp).toBe('2026-08-06T10:00:00Z');
  });
});
