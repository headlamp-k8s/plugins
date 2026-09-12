import { describe, expect, it } from 'vitest';
import {
  getUniqueFlavorNames,
  renderAdmissionChecks,
  renderClusterQueueStatus,
  renderConcurrentAdmissionPolicy,
  renderConditions,
  renderFairSharing,
  renderFlavorFungibility,
  renderFlavorUsage,
  renderLabelSelector,
  renderPreemption,
  renderResourceGroups,
  renderResourceGroupsSummary,
  renderStringList,
} from './clusterQueueFormatters';

describe('ClusterQueue formatters (detail)', () => {
  it('renders ClusterQueue status', () => {
    expect(renderClusterQueueStatus()).toBe('Unknown');
    expect(renderClusterQueueStatus({ type: 'Active', status: 'True' })).toBe('Active');
    expect(renderClusterQueueStatus({ type: 'Active', status: 'False' })).toBe('Inactive');
    expect(renderClusterQueueStatus({ type: 'Active', status: 'Unknown' })).toBe('Unknown');
  });

  it('gets unique flavor names', () => {
    expect(getUniqueFlavorNames([])).toEqual([]);
    expect(
      getUniqueFlavorNames([
        { flavors: [{ name: 'b' }, { name: 'a' }] },
        { flavors: [{ name: 'a' }, { name: 'c' }] },
        {},
      ])
    ).toEqual(['a', 'b', 'c']);
  });

  it('renders resource groups summary', () => {
    expect(renderResourceGroupsSummary([])).toBe('-');
    expect(renderResourceGroupsSummary([{}])).toBe('1 group, 0 flavors');
    expect(renderResourceGroupsSummary([{ flavors: [{ name: 'default' }] }])).toBe(
      '1 group, 1 flavor'
    );
    expect(
      renderResourceGroupsSummary([
        { flavors: [{ name: 'default' }] },
        { flavors: [{ name: 'spot' }, { name: 'on-demand' }] },
      ])
    ).toBe('2 groups, 3 flavors');
  });

  it('renders label selector', () => {
    expect(renderLabelSelector()).toBe('All namespaces');
    expect(renderLabelSelector({})).toBe('All namespaces');
    expect(renderLabelSelector({ matchLabels: { env: 'prod', tier: 'backend' } })).toBe(
      'env=prod; tier=backend'
    );
    expect(
      renderLabelSelector({
        matchExpressions: [
          { key: 'region', operator: 'In', values: ['us-east', 'us-west'] },
          { key: 'gpu', operator: 'Exists' },
        ],
      })
    ).toBe('region In (us-east, us-west); gpu Exists');
    expect(
      renderLabelSelector({
        matchLabels: { app: 'test' },
        matchExpressions: [{ key: 'arch', operator: 'NotIn', values: ['arm64'] }],
      })
    ).toBe('app=test; arch NotIn (arm64)');
  });

  it('renders string lists and conditions', () => {
    expect(renderStringList(['a', 'b'])).toBe('a, b');
    expect(renderStringList([])).toBe('-');

    expect(renderConditions([])).toBe('-');
    expect(
      renderConditions([{ type: 'Active', status: 'True', reason: 'Ready', message: 'All good' }])
    ).toBe('Active=True (Ready): All good');
    expect(
      renderConditions([
        { type: 'Active', status: 'True' },
        { type: 'FlavorsReady', status: 'False', reason: 'FlavorNotFound' },
      ])
    ).toBe('Active=True\nFlavorsReady=False (FlavorNotFound)');
  });

  it('renders resourrce groups with nested flavor quotas', () => {
    expect(renderResourceGroups([])).toBe('-');
    expect(
      renderResourceGroups([
        {
          coveredResources: ['cpu', 'memory'],
          flavors: [
            {
              name: 'default',
              resources: [
                { name: 'cpu', nominalQuota: '8', borrowingLimit: '4', lendingLimit: '2' },
                { name: 'memory', nominalQuota: '16Gi' },
              ],
            },
          ],
        },
      ])
    ).toBe(
      'Group 1: resources cpu, memory; flavors default [cpu: nominal 8, borrow 4, lend 2, memory: nominal 16Gi]'
    );
    expect(
      renderResourceGroups([{ coveredResources: ['cpu'], flavors: [{ name: 'default' }] }])
    ).toBe('Group 1: resources cpu; flavors default [-]');
    expect(renderResourceGroups([{ flavors: [{ name: 'default' }] }])).toBe(
      'Group 1: resources -; flavors default [-]'
    );
    expect(
      renderResourceGroups([
        { coveredResources: ['cpu'], flavors: [] },
        { coveredResources: ['nvidia.com/gpu'] },
      ])
    ).toBe('Group 1: resources cpu; flavors -\nGroup 2: resources nvidia.com/gpu; flavors -');
  });

  it('renders preemption policies', () => {
    expect(renderPreemption()).toBe('-');
    expect(
      renderPreemption({
        reclaimWithinCohort: 'Any',
        borrowWithinCohort: { policy: 'LowerPriority', maxPriorityThreshold: 100 },
        withinClusterQueue: 'LowerPriority',
      })
    ).toBe(
      'Reclaim within cohort: Any; Borrow within cohort: policy LowerPriority, max priority 100; Within ClusterQueue: LowerPriority'
    );
    expect(renderPreemption({ borrowWithinCohort: {} })).toBe(
      'Reclaim within cohort: -; Borrow within cohort: -; Within ClusterQueue: -'
    );
    expect(renderPreemption({})).toBe(
      'Reclaim within cohort: -; Borrow within cohort: -; Within ClusterQueue: -'
    );
    expect(renderPreemption({ borrowWithinCohort: { maxPriorityThreshold: 0 } })).toBe(
      'Reclaim within cohort: -; Borrow within cohort: max priority 0; Within ClusterQueue: -'
    );
  });

  it('renders admission checks and flavor fungibility', () => {
    expect(renderAdmissionChecks()).toBe('-');
    expect(renderAdmissionChecks({ admissionChecks: [] })).toBe('-');
    expect(
      renderAdmissionChecks({
        admissionChecks: [{ name: 'prov-check', onFlavors: ['spot', 'default'] }],
      })
    ).toBe('prov-check (spot, default)');
    expect(renderAdmissionChecks({ admissionChecks: [{ name: 'global-check' }] })).toBe(
      'global-check (all flavors)'
    );
    expect(
      renderAdmissionChecks({
        admissionChecks: [{ name: 'check-a', onFlavors: ['spot'] }, { name: 'check-b' }],
      })
    ).toBe('check-a (spot); check-b (all flavors)');

    expect(renderFlavorFungibility()).toBe('-');
    expect(
      renderFlavorFungibility({
        whenCanBorrow: 'Borrow',
        whenCanPreempt: 'TryNextFlavor',
        preference: 'default',
      })
    ).toBe('When can borrow: Borrow; When can preempt: TryNextFlavor; Preference: default');
    expect(renderFlavorFungibility({ whenCanBorrow: 'Borrow' })).toBe('When can borrow: Borrow');
  });

  it('renders flavor usage and fair sharing', () => {
    expect(renderFlavorUsage()).toBe('-');
    expect(renderFlavorUsage([])).toBe('-');
    expect(
      renderFlavorUsage([
        {
          name: 'default',
          resources: [
            { name: 'cpu', total: '4', borrowed: '1' },
            { name: 'memory', total: '8Gi' },
          ],
        },
      ])
    ).toBe('default [cpu: total 4, borrowed 1, memory: total 8Gi]');
    expect(renderFlavorUsage([{ name: 'a', resources: [{ name: 'cpu', total: '1' }] }])).toBe(
      'a [cpu: total 1]'
    );
    expect(renderFlavorUsage([{ name: 'b', resources: [{ name: 'cpu', borrowed: '2' }] }])).toBe(
      'b [cpu: borrowed 2]'
    );
    expect(renderFlavorUsage([{ name: 'empty', resources: [] }])).toBe('empty [-]');

    expect(renderFairSharing()).toBe('-');
    expect(renderFairSharing({ weight: '1' })).toBe('Weight: 1');
    expect(renderFairSharing(undefined, { weightedShare: 42 })).toBe('Weighted share: 42');
    expect(renderFairSharing({ weight: '2' }, { weightedShare: 0 })).toBe(
      'Weight: 2; Weighted share: 0'
    );
  });

  it('renders concurrent admission migration policy', () => {
    expect(renderConcurrentAdmissionPolicy()).toBe('-');
    expect(renderConcurrentAdmissionPolicy({})).toBe('-');
    expect(renderConcurrentAdmissionPolicy({ migration: { mode: 'Safe' } })).toBe('Mode: Safe');
    expect(
      renderConcurrentAdmissionPolicy({
        migration: {
          mode: 'Safe',
          constraints: { lastAcceptableFlavorName: 'default' },
        },
      })
    ).toBe('Mode: Safe; Last acceptable flavor: default');
  });
});
