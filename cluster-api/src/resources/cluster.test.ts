vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject<T = unknown> {
    jsonData: T;

    constructor(jsonData: T) {
      this.jsonData = jsonData;
    }
  },
}));

import {
  getClusterConditions,
  getClusterControlPlaneStatus,
  getClusterFailure,
  getClusterInitialization,
  getClusterWorkerStatus,
} from './cluster';

describe('cluster resource helpers', () => {
  test('normalizes v1beta1 status and prefers v1beta2 preview conditions', () => {
    const item: any = {
      status: {
        conditions: [{ type: 'Ready', status: 'False' }],
        failureReason: 'InfrastructureFailed',
        failureMessage: 'infra failed',
        v1beta2: {
          conditions: [{ type: 'Available', status: 'False' }],
          controlPlane: { readyReplicas: 1 },
          workers: { readyReplicas: 2 },
          initialization: { infrastructureProvisioned: true },
        },
      },
    };

    expect(getClusterConditions(item)).toEqual([{ type: 'Available', status: 'False' }]);
    expect(getClusterFailure(item)).toEqual({
      failureReason: 'InfrastructureFailed',
      failureMessage: 'infra failed',
    });
    expect(getClusterControlPlaneStatus(item)).toEqual({ readyReplicas: 1 });
    expect(getClusterWorkerStatus(item)).toEqual({ readyReplicas: 2 });
    expect(getClusterInitialization(item)).toEqual({ infrastructureProvisioned: true });
  });

  test('normalizes v1beta2 status and reads deprecated failure fields', () => {
    const item: any = {
      status: {
        conditions: [{ type: 'Available', status: 'True' }],
        controlPlane: { readyReplicas: 3 },
        workers: { readyReplicas: 5 },
        initialization: { controlPlaneInitialized: true },
        deprecated: {
          v1beta1: {
            failureReason: 'LegacyFailure',
          },
        },
      },
    };

    expect(getClusterConditions(item)).toEqual([{ type: 'Available', status: 'True' }]);
    expect(getClusterFailure(item)).toEqual({ failureReason: 'LegacyFailure' });
    expect(getClusterControlPlaneStatus(item)).toEqual({ readyReplicas: 3 });
    expect(getClusterWorkerStatus(item)).toEqual({ readyReplicas: 5 });
    expect(getClusterInitialization(item)).toEqual({ controlPlaneInitialized: true });
  });
});
