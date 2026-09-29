vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject<T = unknown> {
    jsonData: T;

    constructor(jsonData: T) {
      this.jsonData = jsonData;
    }
  },
}));

import {
  getKCPAvailableReplicas,
  getKCPConditions,
  getKCPDeletionTimeouts,
  getKCPFailure,
  getKCPInitialized,
  getKCPLastRemediation,
  getKCPUpToDateReplicas,
} from './kubeadmcontrolplane';

describe('kubeadm control plane resource helpers', () => {
  test('normalizes v1beta1 status and deletion timeout fields', () => {
    const item: any = {
      spec: {
        machineTemplate: {
          nodeDrainTimeout: '10m',
          nodeVolumeDetachTimeout: '2m',
          nodeDeletionTimeout: '30s',
        },
      },
      status: {
        conditions: [{ type: 'Ready', status: 'False' }],
        initialized: true,
        updatedReplicas: 2,
        failureReason: 'ControlPlaneUnhealthy',
        lastRemediationStatus: {
          machine: 'cp-0',
          lastRemediatedTime: '2026-01-01T00:00:00Z',
          retryCount: 1,
        },
        v1beta2: {
          conditions: [{ type: 'Available', status: 'False' }],
          availableReplicas: 1,
        },
      },
    };

    expect(getKCPConditions(item)).toEqual([{ type: 'Available', status: 'False' }]);
    expect(getKCPFailure(item)).toEqual({ failureReason: 'ControlPlaneUnhealthy' });
    expect(getKCPInitialized(item)).toBe(true);
    expect(getKCPUpToDateReplicas(item)).toBe(2);
    expect(getKCPAvailableReplicas(item)).toBe(1);
    expect(getKCPLastRemediation(item)).toEqual({
      machine: 'cp-0',
      time: '2026-01-01T00:00:00Z',
      retryCount: 1,
    });
    expect(getKCPDeletionTimeouts(item)).toEqual({
      nodeDrain: '10m',
      nodeVolumeDetach: '2m',
      nodeDeletion: '30s',
    });
  });

  test('normalizes v1beta2 status and deletion timeout fields', () => {
    const item: any = {
      spec: {
        machineTemplate: {
          spec: {
            deletion: {
              nodeDrainTimeoutSeconds: 600,
              nodeVolumeDetachTimeoutSeconds: 120,
              nodeDeletionTimeoutSeconds: 30,
            },
          },
        },
      },
      status: {
        conditions: [{ type: 'Available', status: 'True' }],
        initialization: { controlPlaneInitialized: true },
        upToDateReplicas: 3,
        availableReplicas: 3,
        lastRemediation: {
          machine: 'cp-1',
          time: '2026-01-02T00:00:00Z',
          retryCount: 2,
        },
        deprecated: {
          v1beta1: {
            failureMessage: 'legacy failure',
          },
        },
      },
    };

    expect(getKCPConditions(item)).toEqual([{ type: 'Available', status: 'True' }]);
    expect(getKCPFailure(item)).toEqual({ failureMessage: 'legacy failure' });
    expect(getKCPInitialized(item)).toBe(true);
    expect(getKCPUpToDateReplicas(item)).toBe(3);
    expect(getKCPAvailableReplicas(item)).toBe(3);
    expect(getKCPLastRemediation(item)).toEqual({
      machine: 'cp-1',
      time: '2026-01-02T00:00:00Z',
      retryCount: 2,
    });
    expect(getKCPDeletionTimeouts(item)).toEqual({
      nodeDrain: '600s',
      nodeVolumeDetach: '120s',
      nodeDeletion: '30s',
    });
  });
});
