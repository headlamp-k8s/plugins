vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject<T = unknown> {
    jsonData: T;

    constructor(jsonData: T) {
      this.jsonData = jsonData;
    }
  },
}));

import {
  getMachineDeploymentConditions,
  getMachineDeploymentFailure,
  getMachineDeploymentStatus,
  getMachineDeploymentUpToDateReplicas,
} from './machinedeployment';

describe('machine deployment resource helpers', () => {
  test('normalizes v1beta1 status and v1beta2 preview fields', () => {
    const item: any = {
      status: {
        replicas: 3,
        conditions: [{ type: 'Ready', status: 'False' }],
        failureReason: 'RolloutFailed',
        v1beta2: {
          conditions: [{ type: 'Available', status: 'False' }],
          upToDateReplicas: 2,
        },
      },
    };

    expect(getMachineDeploymentStatus(item)).toBe(item.status);
    expect(getMachineDeploymentConditions(item)).toEqual([{ type: 'Available', status: 'False' }]);
    expect(getMachineDeploymentFailure(item)).toEqual({ failureReason: 'RolloutFailed' });
    expect(getMachineDeploymentUpToDateReplicas(item)).toBe(2);
  });

  test('normalizes v1beta2 status and deprecated failure fields', () => {
    const item: any = {
      status: {
        conditions: [{ type: 'Available', status: 'True' }],
        upToDateReplicas: 3,
        deprecated: {
          v1beta1: {
            failureMessage: 'legacy failure',
          },
        },
      },
    };

    expect(getMachineDeploymentConditions(item)).toEqual([{ type: 'Available', status: 'True' }]);
    expect(getMachineDeploymentFailure(item)).toEqual({ failureMessage: 'legacy failure' });
    expect(getMachineDeploymentUpToDateReplicas(item)).toBe(3);
  });
});
