import { describe, expect, it } from 'vitest';
import {
  getUniqueFlavorNames,
  renderClusterQueueStatus,
  renderConditions,
  renderLabelSelector,
  renderResourceGroups,
  renderResourceGroupsSummary,
  renderStringList,
} from './clusterQueueFormatters';

describe('ClusterQueue formatters', () => {
  it('summarizes resource groups and unique referenced flavors', () => {
    const resourceGroups = [
      {
        coveredResources: ['cpu', 'memory'],
        flavors: [
          { name: 'default', resources: [{ name: 'cpu', nominalQuota: '8' }] },
          { name: 'spot', resources: [{ name: 'cpu', nominalQuota: '16' }] },
        ],
      },
      {
        coveredResources: ['nvidia.com/gpu'],
        flavors: [{ name: 'default', resources: [{ name: 'nvidia.com/gpu', nominalQuota: '2' }] }],
      },
    ];

    expect(renderResourceGroupsSummary(resourceGroups)).toBe('2 groups, 3 flavors');
    expect(getUniqueFlavorNames(resourceGroups)).toEqual(['default', 'spot']);
  });

  it('safely handles undefined array parameters without throwing errors', () => {
    expect(renderResourceGroupsSummary(undefined)).toBe('-');
    expect(getUniqueFlavorNames(undefined)).toEqual([]);
    expect(renderConditions(undefined)).toBe('-');
    expect(renderResourceGroups(undefined)).toBe('-');
    expect(renderStringList(undefined)).toBe('-');
  });

  it('derives a readable status from the Active condition', () => {
    expect(renderClusterQueueStatus({ type: 'Active', status: 'True', reason: 'Ready' })).toBe(
      'Active'
    );
    expect(
      renderClusterQueueStatus({ type: 'Active', status: 'False', reason: 'FlavorNotFound' })
    ).toBe('Inactive');
    expect(renderClusterQueueStatus()).toBe('Unknown');
  });

  it('formats namespace selectors', () => {
    expect(renderLabelSelector()).toBe('All namespaces');
    expect(renderLabelSelector({})).toBe('All namespaces');
    expect(renderLabelSelector({ matchLabels: { team: 'platform' } })).toBe('team=platform');
    expect(
      renderLabelSelector({
        matchExpressions: [{ key: 'environment', operator: 'In', values: ['dev', 'prod'] }],
      })
    ).toBe('environment In (dev, prod)');
  });
});
