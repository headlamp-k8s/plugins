import { describe, expect, it } from 'vitest';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import {
  getLocalQueueDetailRouteParams,
  renderClusterQueueName,
  renderLocalQueueStatus,
  renderStopPolicy,
  renderWorkloadCount,
} from './localQueueFormatters';

describe('LocalQueue formatters', () => {
  it('formats cluster queue and stop policy values', () => {
    expect(renderClusterQueueName('team-a')).toBe('team-a');
    expect(renderClusterQueueName()).toBe('-');
    expect(renderStopPolicy('Hold')).toBe('Hold');
    expect(renderStopPolicy()).toBe('-');
  });

  it('preserves explicit zero workload counts', () => {
    expect(renderWorkloadCount(0)).toBe(0);
    expect(renderWorkloadCount(3)).toBe(3);
    expect(renderWorkloadCount()).toBe(0);
  });

  it('derives a readable status from the Active condition', () => {
    expect(renderLocalQueueStatus({ type: 'Active', status: 'True' })).toBe('Active');
    expect(renderLocalQueueStatus({ type: 'Active', status: 'False' })).toBe('Inactive');
    expect(renderLocalQueueStatus({ type: 'Active', status: 'Unknown' })).toBe('Unknown');
    expect(renderLocalQueueStatus()).toBe('Unknown');
  });

  it('builds namespaced detail route params', () => {
    expect(kueueRoutePaths.localQueueDetail).toBe('/kueue/localqueues/:namespace/:name');
    expect(getLocalQueueDetailRouteParams('team-a', 'team-a-queue')).toEqual({
      namespace: 'team-a',
      name: 'team-a-queue',
    });
  });

  it('handles missing values without producing undefined display output', () => {
    expect(renderClusterQueueName(undefined)).toBe('-');
    expect(renderStopPolicy(undefined)).toBe('-');
    expect(renderWorkloadCount(undefined)).toBe(0);
    expect(renderLocalQueueStatus(undefined)).toBe('Unknown');
    expect(getLocalQueueDetailRouteParams(undefined, undefined)).toEqual({
      namespace: '',
      name: '',
    });
  });
});
