import { matchCapiError } from './capiErrorDefinitions';

describe('CAPI error definitions', () => {
  test('matches known condition errors by kind, type, and message or reason', () => {
    expect(
      matchCapiError(
        { kind: 'Cluster' },
        { type: 'ControlPlaneInitialized', status: 'False', message: 'CNI plugin missing' }
      )?.id
    ).toBe('cni-not-deployed');

    expect(
      matchCapiError(
        { kind: 'KubeadmControlPlane' },
        { type: 'EtcdClusterHealthy', status: 'False', reason: 'EtcdUnhealthy' }
      )?.id
    ).toBe('etcd-unhealthy');
  });

  test('matches provider-specific and custom matcher errors', () => {
    expect(
      matchCapiError(
        {
          kind: 'MachineDeployment',
          spec: { template: { spec: { infrastructureRef: { kind: 'AWSMachineTemplate' } } } },
        },
        { type: 'Ready', status: 'False', message: 'insufficient capacity in zone' }
      )?.id
    ).toBe('aws-insufficient-capacity');

    expect(
      matchCapiError({
        kind: 'Cluster',
        metadata: { annotations: { 'cluster.x-k8s.io/paused': 'true' } },
      })?.id
    ).toBe('cluster-paused');
  });

  test('returns undefined when no definition matches', () => {
    expect(matchCapiError({ kind: 'Machine' }, { type: 'Ready', status: 'True' })).toBeUndefined();
  });
});
