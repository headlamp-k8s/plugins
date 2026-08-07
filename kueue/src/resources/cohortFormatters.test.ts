import { describe, expect, it } from 'vitest';
import {
  getCohortUniqueFlavorNames,
  renderCohortFlavorNames,
  renderCohortResourceGroupsSummary,
  renderFairSharingWeight,
  renderParentName,
  renderParentNameDisplay,
  renderRelatedCount,
  renderWeightedShare,
} from './cohortFormatters';

describe('Cohort formatters', () => {
  it('formats an empty parent name as a root fallback', () => {
    expect(renderParentName()).toBe('-');
    expect(renderParentName('')).toBe('-');
    expect(renderParentNameDisplay()).toBe('Root');
  });

  it('formats empty resource groups safely', () => {
    expect(renderCohortResourceGroupsSummary([])).toBe('-');
    expect(renderCohortFlavorNames([])).toBe('-');
  });

  it('summarizes resource groups', () => {
    expect(
      renderCohortResourceGroupsSummary([
        {
          coveredResources: ['cpu', 'memory'],
          flavors: [
            { name: 'default', resources: [{ name: 'cpu', nominalQuota: '8' }] },
            { name: 'spot', resources: [{ name: 'cpu', nominalQuota: '16' }] },
          ],
        },
        {
          coveredResources: ['nvidia.com/gpu'],
          flavors: [{ name: 'gpu', resources: [{ name: 'nvidia.com/gpu', nominalQuota: '2' }] }],
        },
      ])
    ).toBe('2 groups, 3 flavors');
  });

  it('extracts unique ResourceFlavor names', () => {
    expect(
      getCohortUniqueFlavorNames([
        {
          flavors: [{ name: 'spot' }, { name: 'default' }],
        },
        {
          flavors: [{ name: 'spot' }, { name: '' }],
        },
      ])
    ).toEqual(['default', 'spot']);
  });

  it('formats missing fair-sharing values', () => {
    expect(renderFairSharingWeight()).toBe('-');
    expect(renderWeightedShare()).toBe('-');
  });

  it('formats configured fair-sharing weight', () => {
    expect(renderFairSharingWeight({ weight: '0.75' })).toBe('0.75');
    expect(renderFairSharingWeight({ weight: 2 })).toBe(2);
  });

  it('formats status weighted share', () => {
    expect(renderWeightedShare({ weightedShare: 12 })).toBe(12);
    expect(renderWeightedShare({ weightedShare: 0 })).toBe(0);
  });

  it('renders related resource counts without loading data', () => {
    expect(renderRelatedCount(null)).toBe(0);
    expect(renderRelatedCount([{ name: 'one' }, { name: 'two' }])).toBe(2);
  });
});
