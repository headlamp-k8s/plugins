vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject<T = unknown> {
    jsonData: T;

    constructor(jsonData: T) {
      this.jsonData = jsonData;
    }
  },
}));

import { KubeadmControlPlaneTemplate } from './kubeadmcontrolplanetemplate';

describe('kubeadm control plane template resource', () => {
  test('exposes static metadata, versioned class, and spec accessor', () => {
    const spec = {
      template: {
        spec: {
          kubeadmConfigSpec: { format: 'cloud-config' },
          rolloutStrategy: { type: 'RollingUpdate' },
        },
      },
    };
    const resource = new KubeadmControlPlaneTemplate({ spec } as any);
    const V1Beta2 = KubeadmControlPlaneTemplate.withApiVersion('v1beta2');

    expect(KubeadmControlPlaneTemplate.apiName).toBe('kubeadmcontrolplanetemplates');
    expect(KubeadmControlPlaneTemplate.detailsRoute).toBe(
      '/cluster-api/kubeadmcontrolplanetemplates/:namespace/:name'
    );
    expect(V1Beta2.apiVersion).toBe('controlplane.cluster.x-k8s.io/v1beta2');
    expect(resource.spec).toBe(spec);
  });
});
