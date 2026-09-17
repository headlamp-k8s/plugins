import { describe, expect, it } from 'vitest';
import type { JobPhase } from '../resources/job';
import type { PodGroupPhase } from '../resources/podgroup';
import type { QueueState } from '../resources/queue';
import {
  getJobFlowStatusColor,
  getJobStatusColor,
  getPodGroupStatusColor,
  getQueueStatusColor,
} from './status';

/**
 * Phase values are taken from the upstream Volcano API types rather than from
 * the local unions, so that a phase added upstream shows up here as a gap.
 *
 * @see https://github.com/volcano-sh/apis/blob/master/pkg/apis/batch/v1alpha1/job.go
 * @see https://github.com/volcano-sh/apis/blob/master/pkg/apis/scheduling/v1beta1/types.go
 * @see https://github.com/volcano-sh/apis/blob/master/pkg/apis/flow/v1alpha1/jobflow_types.go
 */

describe('getJobStatusColor', () => {
  const cases: Array<[JobPhase, string]> = [
    ['Running', 'success'],
    ['Completing', 'success'],
    ['Completed', 'success'],
    ['Pending', 'warning'],
    ['Restarting', 'warning'],
    ['Aborting', 'warning'],
    ['Terminating', 'warning'],
    ['Failed', 'error'],
    ['Aborted', 'error'],
    ['Terminated', 'error'],
  ];

  it.each(cases)('maps %s to %s', (phase, expected) => {
    expect(getJobStatusColor(phase)).toBe(expected);
  });

  it('covers every phase the upstream API can emit', () => {
    // JobPhase in job.go declares exactly these ten.
    expect(cases).toHaveLength(10);
  });

  it('returns undefined for a phase it does not know', () => {
    // The signature says this cannot happen, but the value arrives from the
    // API as a string, so an upstream addition would land here.
    expect(getJobStatusColor('SomethingNew' as JobPhase)).toBeUndefined();
  });
});

describe('getQueueStatusColor', () => {
  const cases: Array<[QueueState, string]> = [
    ['Open', 'success'],
    ['Closing', 'warning'],
    ['Unknown', 'warning'],
    ['Closed', 'error'],
  ];

  it.each(cases)('maps %s to %s', (state, expected) => {
    expect(getQueueStatusColor(state)).toBe(expected);
  });

  it('returns undefined for a state it does not know', () => {
    expect(getQueueStatusColor('Draining' as QueueState)).toBeUndefined();
  });
});

describe('getPodGroupStatusColor', () => {
  const cases: Array<[PodGroupPhase, string]> = [
    ['Running', 'success'],
    ['Completed', 'success'],
    ['Pending', 'warning'],
    ['Inqueue', 'warning'],
    ['Unknown', 'warning'],
  ];

  it.each(cases)('maps %s to %s', (phase, expected) => {
    expect(getPodGroupStatusColor(phase)).toBe(expected);
  });

  it('returns undefined for a phase it does not know', () => {
    expect(getPodGroupStatusColor('Scheduling' as PodGroupPhase)).toBeUndefined();
  });
});

describe('getJobFlowStatusColor', () => {
  // jobflow_types.go validates the enum as Succeed;Terminating;Failed;Running;Pending.
  const cases: Array<[string, string]> = [
    ['Running', 'success'],
    ['Succeed', 'success'],
    ['Pending', 'warning'],
    ['Terminating', 'warning'],
    ['Failed', 'error'],
  ];

  it.each(cases)('maps %s to %s', (phase, expected) => {
    expect(getJobFlowStatusColor(phase)).toBe(expected);
  });

  it('falls back to warning for a phase it does not know', () => {
    expect(getJobFlowStatusColor('SomethingNew')).toBe('warning');
  });

  it('is the only one of the four that falls back rather than returning undefined', () => {
    expect(getJobFlowStatusColor('SomethingNew')).toBe('warning');
    expect(getJobStatusColor('SomethingNew' as JobPhase)).toBeUndefined();
    expect(getQueueStatusColor('SomethingNew' as QueueState)).toBeUndefined();
    expect(getPodGroupStatusColor('SomethingNew' as PodGroupPhase)).toBeUndefined();
  });
});
