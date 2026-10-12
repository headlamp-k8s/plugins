import {
  getBootstrapKind,
  getClusterNameForResource,
  getInfrastructureProvider,
  getReadinessPercent,
  getStatusLabelStateForSeverity,
  isResourceReadyByKind,
} from './capiUtils';

describe('overview CAPI utilities', () => {
  test('maps severity and readiness values', () => {
    expect(getStatusLabelStateForSeverity('critical')).toBe('error');
    expect(getStatusLabelStateForSeverity('warning')).toBe('warning');
    expect(getStatusLabelStateForSeverity('info')).toBe('');
    expect(getReadinessPercent(2, 4)).toBe(50);
    expect(getReadinessPercent(1, 0)).toBe(0);
  });

  test('detects readiness by resource kind', () => {
    expect(isResourceReadyByKind({ status: { phase: 'Running' } }, 'Machine')).toBe(true);
    expect(
      isResourceReadyByKind({ spec: { replicas: 3 }, status: { readyReplicas: 3 } }, 'MachineSet')
    ).toBe(true);
    expect(
      isResourceReadyByKind(
        { spec: { replicas: 0 }, status: { conditions: [{ type: 'Ready', status: 'True' }] } },
        'KubeadmControlPlane'
      )
    ).toBe(true);
    expect(isResourceReadyByKind({ conditions: [{ type: 'Ready', status: 'False' }] }, 'Foo')).toBe(
      false
    );
  });

  test('extracts provider, cluster name, and bootstrap kind', () => {
    const cluster: any = {
      metadata: { name: 'prod', uid: 'cluster-uid' },
      spec: {
        infrastructureRef: { kind: 'DockerCluster' },
        topology: {
          controlPlane: {
            machineTemplate: {
              bootstrap: { configRef: { kind: 'KubeadmConfigTemplate' } },
            },
          },
        },
      },
    };

    expect(getInfrastructureProvider(cluster)).toBe('Docker');
    expect(
      getClusterNameForResource({
        metadata: { labels: { 'cluster.x-k8s.io/cluster-name': 'prod' }, name: 'fallback' },
      })
    ).toBe('prod');
    expect(getBootstrapKind(cluster, [], [])).toBe('Kubeadm');
    expect(getBootstrapKind({ metadata: { name: 'prod' }, spec: {} }, [], [])).toBe('-');
  });
});
