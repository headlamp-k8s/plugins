import { describe, expect, it } from 'vitest';
import {
  getClusterQueueInactiveCauses,
  getResourceGroupRows,
  getUniqueFlavorNames,
  renderClusterQueueStatus,
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

  it('explains an inactive ClusterQueue from its spec and the existing resources', () => {
    const groups = [
      { flavors: [{ name: 'default' }, { name: 'missing-flavor' }] },
      { flavors: [{ name: 'default' }] },
    ];
    const strategy = {
      admissionChecks: [{ name: 'prov' }, { name: 'missing-check' }, { name: 'down' }],
    };
    const condition = {
      type: 'Active',
      status: 'False' as const,
      reason: 'Stopped',
      message:
        "Can't admit new workloads: is stopped, references missing ResourceFlavor(s): missing-flavor.",
    };

    expect(
      getClusterQueueInactiveCauses(
        condition,
        groups,
        strategy,
        ['default'],
        [
          { name: 'prov', active: true },
          { name: 'down', active: false },
        ]
      )
    ).toEqual({
      reason: 'Stopped',
      explanation:
        'The ClusterQueue has a stopPolicy set, so Kueue does not admit new Workloads from it. With HoldAndDrain, admitted Workloads are evicted too.',
      message: condition.message,
      missingFlavors: ['missing-flavor'],
      missingAdmissionChecks: ['missing-check'],
      inactiveAdmissionChecks: ['down'],
    });

    // Lists that are not loaded (or not readable) report nothing missing.
    expect(
      getClusterQueueInactiveCauses({ ...condition, reason: 'Novel' }, groups, strategy)
    ).toMatchObject({ explanation: undefined, missingFlavors: [], missingAdmissionChecks: [] });

    expect(
      getClusterQueueInactiveCauses({ type: 'Active', status: 'True' }, groups, strategy)
    ).toBeNull();
    expect(getClusterQueueInactiveCauses(undefined, groups, strategy)).toBeNull();
  });
});
