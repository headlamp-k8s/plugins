import {
  getDisplayableErrorConditions,
  getPriorityErrorForCluster,
  isClusterHealthy,
  isNegativeConditionType,
  severityScore,
} from './clusterHealth';

describe('cluster health helpers', () => {
  test('filters displayable conditions and prepends terminal failures', () => {
    const item = {
      status: {
        failureReason: 'InfrastructureProvisioningFailed',
        failureMessage: 'network failed',
        conditions: [
          { type: 'Ready', status: 'False', reason: 'NotReady' },
          { type: 'ScalingUp', status: 'True', reason: 'Scaling' },
          { type: 'Available', status: 'True', reason: 'Available' },
        ],
      },
    };

    expect(getDisplayableErrorConditions(item)).toEqual([
      {
        type: 'Failure',
        status: 'False',
        reason: 'InfrastructureProvisioningFailed',
        message: 'network failed',
      },
      { type: 'Ready', status: 'False', reason: 'NotReady' },
    ]);
  });

  test('scores severities and identifies negative condition types', () => {
    expect(severityScore('critical')).toBeLessThan(severityScore('warning'));
    expect(severityScore('warning')).toBeLessThan(severityScore('info'));
    expect(isNegativeConditionType('ScalingUp')).toBe(true);
    expect(isNegativeConditionType('Ready')).toBe(false);
  });

  test('finds a priority error for resources belonging to the cluster', () => {
    const cluster: any = { metadata: { name: 'prod', uid: 'cluster-uid' } };
    const machine: any = {
      kind: 'Machine',
      metadata: {
        name: 'prod-cp-0',
        labels: { 'cluster.x-k8s.io/cluster-name': 'prod' },
      },
      status: {
        conditions: [
          {
            type: 'InfrastructureReady',
            status: 'False',
            reason: 'ProvisioningFailed',
            message: 'infrastructure provisioning failed',
          },
        ],
      },
    };

    const priorityError = getPriorityErrorForCluster(cluster, [
      { className: 'Machine', items: [machine] },
    ]);

    expect(priorityError?.resource).toBe(machine);
    expect(priorityError?.conditionType).toBe('InfrastructureReady');
    expect(isClusterHealthy(cluster, [{ className: 'Machine', items: [machine] }])).toBe(false);
  });
});
