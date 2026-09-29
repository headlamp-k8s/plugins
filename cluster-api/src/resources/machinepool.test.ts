vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject<T = unknown> {
    jsonData: T;

    constructor(jsonData: T) {
      this.jsonData = jsonData;
    }
  },
}));

import {
  getMachinePoolConditions,
  getMachinePoolInitialization,
  getMachinePoolUpToDateReplicas,
} from './machinepool';

describe('machine pool resource helpers', () => {
  test('normalizes v1beta1 status using v1beta2 preview fields when present', () => {
    const item: any = {
      status: {
        bootstrapReady: true,
        infrastructureReady: false,
        conditions: [{ type: 'Ready', status: 'False' }],
        v1beta2: {
          conditions: [{ type: 'Available', status: 'False' }],
          upToDateReplicas: 2,
        },
      },
    };

    expect(getMachinePoolConditions(item)).toEqual([{ type: 'Available', status: 'False' }]);
    expect(getMachinePoolUpToDateReplicas(item)).toBe(2);
    expect(getMachinePoolInitialization(item)).toEqual({
      bootstrapDataSecretCreated: true,
      infrastructureProvisioned: false,
    });
  });

  test('normalizes v1beta2 status using deprecated as the version discriminator', () => {
    const item: any = {
      status: {
        conditions: [{ type: 'Available', status: 'True' }],
        upToDateReplicas: 4,
        initialization: {
          bootstrapDataSecretCreated: true,
          infrastructureProvisioned: true,
        },
        deprecated: { v1beta1: {} },
      },
    };

    expect(getMachinePoolConditions(item)).toEqual([{ type: 'Available', status: 'True' }]);
    expect(getMachinePoolUpToDateReplicas(item)).toBe(4);
    expect(getMachinePoolInitialization(item)).toEqual({
      bootstrapDataSecretCreated: true,
      infrastructureProvisioned: true,
    });
  });
});
