vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject<T = unknown> {
    jsonData: T;

    constructor(jsonData: T) {
      this.jsonData = jsonData;
    }
  },
}));

import {
  getMachineSetConditions,
  getMachineSetFailure,
  getMachineSetStatus,
  getMachineSetUpToDateReplicas,
} from './machineset';

describe('machine set resource helpers', () => {
  test('normalizes v1beta1 status and v1beta2 preview fields', () => {
    const item: any = {
      status: {
        replicas: 3,
        conditions: [{ type: 'Ready', status: 'False' }],
        failureReason: 'ScaleFailed',
        v1beta2: {
          conditions: [{ type: 'Available', status: 'False' }],
          upToDateReplicas: 2,
        },
      },
    };

    expect(getMachineSetStatus(item)).toBe(item.status);
    expect(getMachineSetConditions(item)).toEqual([{ type: 'Available', status: 'False' }]);
    expect(getMachineSetFailure(item)).toEqual({ failureReason: 'ScaleFailed' });
    expect(getMachineSetUpToDateReplicas(item)).toBe(2);
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

    expect(getMachineSetConditions(item)).toEqual([{ type: 'Available', status: 'True' }]);
    expect(getMachineSetFailure(item)).toEqual({ failureMessage: 'legacy failure' });
    expect(getMachineSetUpToDateReplicas(item)).toBe(3);
  });
});
