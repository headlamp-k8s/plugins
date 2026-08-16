import { describe, expect, it } from 'vitest';
import {
  getUniqueFlavorNames,
  renderAdmissionChecks,
  renderClusterQueueStatus,
  renderLabelSelector,
  renderResourceGroupsSummary,
  resolveAndRenderAdmissionChecks,
  resolveCohortName,
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

  it('resolves cohort name from v1beta2 cohortName with fallback to v1beta1 cohort', () => {
    // v1beta2: cohortName is set
    expect(resolveCohortName({ cohortName: 'research' })).toBe('research');

    // v1beta1: only cohort is set
    expect(resolveCohortName({ cohort: 'research' })).toBe('research');

    // v1beta2 takes priority when both are present
    expect(resolveCohortName({ cohortName: 'v2-name', cohort: 'v1-name' })).toBe('v2-name');

    // Neither set
    expect(resolveCohortName({})).toBeUndefined();
    expect(resolveCohortName()).toBeUndefined();
  });

  it('resolves admission checks from v1beta2 strategy with fallback to v1beta1 flat list', () => {
    // v1beta2: admissionChecksStrategy is set
    expect(
      resolveAndRenderAdmissionChecks({
        admissionChecksStrategy: {
          admissionChecks: [{ name: 'prov-request', onFlavors: ['spot'] }],
        },
      })
    ).toBe('prov-request (spot)');

    // v1beta1: admissionChecks is a flat string array (no per-flavor scoping)
    expect(
      resolveAndRenderAdmissionChecks({
        admissionChecks: ['prov-request'],
      })
    ).toBe('prov-request (all flavors)');

    // v1beta1: multiple admission checks
    expect(
      resolveAndRenderAdmissionChecks({
        admissionChecks: ['prov-request', 'quota-check'],
      })
    ).toBe('prov-request (all flavors); quota-check (all flavors)');

    // v1beta2 strategy takes priority when both are present
    expect(
      resolveAndRenderAdmissionChecks({
        admissionChecksStrategy: {
          admissionChecks: [{ name: 'v2-check' }],
        },
        admissionChecks: ['v1-check'],
      })
    ).toBe('v2-check (all flavors)');

    // Neither set
    expect(resolveAndRenderAdmissionChecks({})).toBe('-');
    expect(resolveAndRenderAdmissionChecks()).toBe('-');

    // Empty v1beta1 array
    expect(resolveAndRenderAdmissionChecks({ admissionChecks: [] })).toBe('-');
  });
});
