vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject<T = unknown> {
    jsonData: T;

    constructor(jsonData: T) {
      this.jsonData = jsonData;
    }
  },
}));

import { getMachineConditions, getMachineFailure, getMachineStatus, Machine } from './machine';

describe('machine resource helpers', () => {
  test('normalizes v1beta1 status and v1beta2 preview conditions', () => {
    const item: any = {
      status: {
        phase: 'Provisioning',
        conditions: [{ type: 'Ready', status: 'False' }],
        failureReason: 'InfrastructureFailed',
        v1beta2: { conditions: [{ type: 'Available', status: 'False' }] },
      },
    };

    expect(getMachineStatus(item)).toBe(item.status);
    expect(getMachineConditions(item)).toEqual([{ type: 'Available', status: 'False' }]);
    expect(getMachineFailure(item)).toEqual({ failureReason: 'InfrastructureFailed' });
  });

  test('normalizes v1beta2 status and deprecated failure fields', () => {
    const item: any = {
      status: {
        conditions: [{ type: 'Available', status: 'True' }],
        deprecated: { v1beta1: { failureMessage: 'legacy failure' } },
      },
    };

    expect(getMachineConditions(item)).toEqual([{ type: 'Available', status: 'True' }]);
    expect(getMachineFailure(item)).toEqual({ failureMessage: 'legacy failure' });
    expect(getMachineStatus(undefined)).toBeUndefined();
  });

  test('class accessors expose status helpers and versioned class', () => {
    const item: any = {
      spec: { clusterName: 'prod' },
      status: { phase: 'Running', conditions: [{ type: 'Ready', status: 'True' }] },
    };
    const resource = new Machine(item);
    const V1Beta2 = Machine.withApiVersion('v1beta2');

    expect(Machine.detailsRoute).toBe('/cluster-api/machines/:namespace/:name');
    expect(V1Beta2.apiVersion).toBe('cluster.x-k8s.io/v1beta2');
    expect(resource.spec).toBe(item.spec);
    expect(resource.status).toBe(item.status);
    expect(resource.conditions).toEqual([{ type: 'Ready', status: 'True' }]);
    expect(resource.failure).toBeUndefined();
  });
});
