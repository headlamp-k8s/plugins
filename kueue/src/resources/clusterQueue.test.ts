import { describe, expect, it } from 'vitest';
import {
  getUniqueFlavorNames,
  renderAdmissionChecks,
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

  it('formats admission checks across strategy shapes and per-flavor scoping', () => {
    expect(renderAdmissionChecks()).toBe('-');
    expect(renderAdmissionChecks({ admissionChecks: [] })).toBe('-');
    expect(
      renderAdmissionChecks({
        admissionChecks: [{ name: 'prov-request' }],
      })
    ).toBe('prov-request (all flavors)');
    expect(
      renderAdmissionChecks({
        admissionChecks: [
          { name: 'prov-request', onFlavors: ['spot'] },
          { name: 'quota-check', onFlavors: ['default', 'gpu-flavor'] },
        ],
      })
    ).toBe('prov-request (spot); quota-check (default, gpu-flavor)');
  });
});
