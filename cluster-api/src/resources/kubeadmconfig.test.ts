vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject<T = unknown> {
    jsonData: T;

    constructor(jsonData: T) {
      this.jsonData = jsonData;
    }
  },
}));

import { getKCConditions, getKCFailure, KubeadmConfig } from './kubeadmconfig';

describe('kubeadm config resource helpers', () => {
  test('normalizes v1beta1 status and v1beta2 preview conditions', () => {
    const item: any = {
      status: {
        conditions: [{ type: 'Ready', status: 'False' }],
        failureReason: 'BootstrapFailed',
        failureMessage: 'bootstrap failed',
        v1beta2: { conditions: [{ type: 'Available', status: 'False' }] },
      },
    };

    expect(getKCConditions(item)).toEqual([{ type: 'Available', status: 'False' }]);
    expect(getKCFailure(item)).toEqual({
      failureReason: 'BootstrapFailed',
      failureMessage: 'bootstrap failed',
    });
  });

  test('normalizes v1beta2 status and deprecated failure fields', () => {
    const item: any = {
      status: {
        conditions: [{ type: 'Available', status: 'True' }],
        deprecated: { v1beta1: { failureMessage: 'legacy failure' } },
      },
    };

    expect(getKCConditions(item)).toEqual([{ type: 'Available', status: 'True' }]);
    expect(getKCFailure(item)).toEqual({ failureMessage: 'legacy failure' });
    expect(getKCConditions(undefined)).toBeUndefined();
  });

  test('class accessors expose status helpers and versioned class', () => {
    const item: any = {
      spec: { format: 'cloud-config' },
      status: { conditions: [{ type: 'Ready', status: 'True' }] },
    };
    const resource = new KubeadmConfig(item);
    const V1Beta2 = KubeadmConfig.withApiVersion('v1beta2');

    expect(KubeadmConfig.detailsRoute).toBe('/cluster-api/kubeadmconfigs/:namespace/:name');
    expect(V1Beta2.apiVersion).toBe('bootstrap.cluster.x-k8s.io/v1beta2');
    expect(resource.spec).toBe(item.spec);
    expect(resource.status).toBe(item.status);
    expect(resource.conditions).toEqual([{ type: 'Ready', status: 'True' }]);
    expect(resource.failure).toBeUndefined();
  });
});
