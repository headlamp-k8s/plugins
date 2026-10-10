vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject<T = unknown> {
    jsonData: T;

    constructor(jsonData: T) {
      this.jsonData = jsonData;
    }
  },
}));

import { getMachineHealthCheckConditions, MachineHealthCheck } from './machinehealthcheck';

describe('machine health check resource helpers', () => {
  test('prefers v1beta2 preview conditions over legacy conditions', () => {
    const item: any = {
      status: {
        conditions: [{ type: 'Ready', status: 'False' }],
        v1beta2: { conditions: [{ type: 'Available', status: 'True' }] },
      },
    };

    expect(getMachineHealthCheckConditions(item)).toEqual([{ type: 'Available', status: 'True' }]);
    expect(getMachineHealthCheckConditions(undefined)).toBeUndefined();
  });

  test('class accessors expose status helpers and versioned class', () => {
    const item: any = {
      spec: { clusterName: 'prod' },
      status: { conditions: [{ type: 'Ready', status: 'True' }] },
    };
    const resource = new MachineHealthCheck(item);
    const V1Beta2 = MachineHealthCheck.withApiVersion('v1beta2');

    expect(MachineHealthCheck.detailsRoute).toBe(
      '/cluster-api/machinehealthchecks/:namespace/:name'
    );
    expect(V1Beta2.apiVersion).toBe('cluster.x-k8s.io/v1beta2');
    expect(resource.spec).toBe(item.spec);
    expect(resource.status).toBe(item.status);
    expect(resource.conditions).toEqual([{ type: 'Ready', status: 'True' }]);
  });
});
