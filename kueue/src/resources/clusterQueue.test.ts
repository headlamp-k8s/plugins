import { describe, expect, it } from 'vitest';
import {
  getResourceGroupRows,
  getUniqueFlavorNames,
  renderClusterQueueStatus,
  renderFlavorNominalQuota,
  renderLabelSelector,
  renderResourceGroupsSummary,
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

  it('renders the nominal quota one flavor gives across resource groups', () => {
    const resourceGroups = [
      {
        coveredResources: ['cpu', 'memory'],
        flavors: [
          {
            name: 'default',
            resources: [
              { name: 'cpu', nominalQuota: '8' },
              { name: 'memory', nominalQuota: '16Gi' },
            ],
          },
          { name: 'spot', resources: [{ name: 'cpu', nominalQuota: '16' }] },
        ],
      },
      {
        coveredResources: ['nvidia.com/gpu'],
        flavors: [{ name: 'default', resources: [{ name: 'nvidia.com/gpu', nominalQuota: 2 }] }],
      },
      { coveredResources: ['pods'], flavors: [{ name: 'empty' }] },
    ];

    expect(renderFlavorNominalQuota(resourceGroups, 'default')).toBe(
      'cpu: 8, memory: 16Gi, nvidia.com/gpu: 2'
    );
    expect(renderFlavorNominalQuota(resourceGroups, 'spot')).toBe('cpu: 16');
    expect(renderFlavorNominalQuota(resourceGroups, 'empty')).toBe('-');
    expect(renderFlavorNominalQuota(resourceGroups, 'missing')).toBe('-');
  });

  it('flattens resource groups for detail tables', () => {
    expect(
      getResourceGroupRows([
        {
          coveredResources: ['cpu', 'memory'],
          flavors: [
            {
              name: 'default',
              resources: [
                {
                  name: 'cpu',
                  nominalQuota: '8',
                  borrowingLimit: '4',
                  lendingLimit: '2',
                },
              ],
            },
          ],
        },
        {
          coveredResources: ['nvidia.com/gpu'],
          flavors: [{ name: 'gpu' }],
        },
      ])
    ).toEqual([
      {
        group: 'Group 1',
        coveredResources: 'cpu, memory',
        flavor: 'default',
        resource: 'cpu',
        nominalQuota: '8',
        borrowingLimit: '4',
        lendingLimit: '2',
      },
      {
        group: 'Group 2',
        coveredResources: 'nvidia.com/gpu',
        flavor: 'gpu',
        resource: '-',
        nominalQuota: '-',
      },
    ]);
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
