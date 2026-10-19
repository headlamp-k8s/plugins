import { describe, expect, it } from 'vitest';
import { getKueueActivityId } from './kueueActivity';

describe('getKueueActivityId', () => {
  it('keeps the kind prefix', () => {
    expect(getKueueActivityId('localqueue', 'prod', 'team-a', 'queue')).toMatch(
      /^kueue-localqueue-/
    );
  });

  it('distinguishes namespace/name pairs that join to the same hyphenated string', () => {
    expect(getKueueActivityId('localqueue', 'prod', 'team-a', 'queue')).not.toBe(
      getKueueActivityId('localqueue', 'prod', 'team', 'a-queue')
    );
    expect(getKueueActivityId('workload', 'prod', 'team-a', 'job')).not.toBe(
      getKueueActivityId('workload', 'prod', 'team', 'a-job')
    );
  });

  it('distinguishes cluster/name pairs that join to the same hyphenated string', () => {
    expect(getKueueActivityId('clusterqueue', 'prod-east', 'queue')).not.toBe(
      getKueueActivityId('clusterqueue', 'prod', 'east-queue')
    );
    expect(getKueueActivityId('resourceflavor', 'prod-east', 'gpu')).not.toBe(
      getKueueActivityId('resourceflavor', 'prod', 'east-gpu')
    );
  });

  it('distinguishes the same resource in different kinds', () => {
    expect(getKueueActivityId('clusterqueue', 'prod', 'default')).not.toBe(
      getKueueActivityId('resourceflavor', 'prod', 'default')
    );
  });

  it('treats a missing cluster as an empty cluster name', () => {
    expect(getKueueActivityId('clusterqueue', undefined, 'queue')).toBe(
      getKueueActivityId('clusterqueue', '', 'queue')
    );
  });

  it('returns the same ID for the same resource', () => {
    expect(getKueueActivityId('workload', 'prod', 'team-a', 'job')).toBe(
      getKueueActivityId('workload', 'prod', 'team-a', 'job')
    );
  });
});
