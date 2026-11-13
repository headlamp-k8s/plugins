import { describe, expect, test } from 'vitest';
import {
  countBackupPhases,
  countScheduleHealth,
  countStorageHealth,
  recentFailedItems,
} from './summary';

describe('countBackupPhases', () => {
  test('buckets completed, failed, in-progress, and other', () => {
    const counts = countBackupPhases([
      { name: 'a', namespace: 'velero', phase: 'Completed' },
      { name: 'b', namespace: 'velero', phase: 'Failed' },
      { name: 'c', namespace: 'velero', phase: 'PartiallyFailed' },
      { name: 'd', namespace: 'velero', phase: 'InProgress' },
      { name: 'e', namespace: 'velero', phase: 'Weird' },
    ]);
    expect(counts).toEqual({
      total: 5,
      completed: 1,
      failed: 2,
      inProgress: 1,
      other: 1,
    });
  });
});

describe('countScheduleHealth', () => {
  test('prefers failedValidation and paused over active', () => {
    const counts = countScheduleHealth([
      {
        name: 'ok',
        namespace: 'velero',
        statusDisplay: 'Active',
        isActivelyScheduling: true,
        paused: false,
        isFailedValidation: false,
      },
      {
        name: 'paused',
        namespace: 'velero',
        statusDisplay: 'Paused',
        isActivelyScheduling: false,
        paused: true,
        isFailedValidation: false,
      },
      {
        name: 'bad',
        namespace: 'velero',
        statusDisplay: 'FailedValidation',
        isActivelyScheduling: false,
        paused: true,
        isFailedValidation: true,
      },
      {
        name: 'new',
        namespace: 'velero',
        statusDisplay: 'New',
        isActivelyScheduling: false,
        paused: false,
        isFailedValidation: false,
      },
    ]);
    expect(counts).toEqual({
      total: 4,
      active: 1,
      paused: 1,
      failedValidation: 1,
      other: 1,
    });
  });
});

describe('countStorageHealth', () => {
  test('counts Available and Unavailable', () => {
    expect(
      countStorageHealth([
        { name: 'default', namespace: 'velero', phase: 'Available' },
        { name: 'alt', namespace: 'velero', phase: 'Unavailable' },
        { name: 'new', namespace: 'velero', phase: 'New' },
      ])
    ).toEqual({ total: 3, available: 1, unavailable: 1, other: 1 });
  });
});

describe('recentFailedItems', () => {
  test('returns newest failed items first and respects limit', () => {
    const items = recentFailedItems(
      [
        {
          name: 'old',
          namespace: 'velero',
          phase: 'Failed',
          timestamp: '2026-11-01T00:00:00Z',
        },
        {
          name: 'ok',
          namespace: 'velero',
          phase: 'Completed',
          timestamp: '2026-11-10T00:00:00Z',
        },
        {
          name: 'new',
          namespace: 'velero',
          phase: 'PartiallyFailed',
          timestamp: '2026-11-09T00:00:00Z',
        },
      ],
      1
    );
    expect(items.map(i => i.name)).toEqual(['new']);
  });
});
