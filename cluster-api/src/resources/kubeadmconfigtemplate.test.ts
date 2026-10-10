vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject<T = unknown> {
    jsonData: T;

    constructor(jsonData: T) {
      this.jsonData = jsonData;
    }
  },
}));

import {
  getKCTConditions,
  getKCTConfigSpec,
  getKCTFailure,
  getKCTObservedGeneration,
  KubeadmConfigTemplate,
} from './kubeadmconfigtemplate';

describe('kubeadm config template resource helpers', () => {
  test('normalizes status fields and config spec', () => {
    const configSpec = { format: 'cloud-config', users: [{ name: 'capi' }] };
    const item: any = {
      spec: { template: { spec: configSpec } },
      status: {
        observedGeneration: 3,
        conditions: [{ type: 'Ready', status: 'False' }],
        failureReason: 'TemplateInvalid',
      },
    };

    expect(getKCTConditions(item)).toEqual([{ type: 'Ready', status: 'False' }]);
    expect(getKCTFailure(item)).toEqual({ failureReason: 'TemplateInvalid' });
    expect(getKCTObservedGeneration(item)).toBe(3);
    expect(getKCTConfigSpec(item)).toBe(configSpec);
  });

  test('reads deprecated v1beta1 failure from v1beta2 status', () => {
    expect(
      getKCTFailure({
        status: { deprecated: { v1beta1: { failureMessage: 'legacy failure' } } },
      } as any)
    ).toEqual({ failureMessage: 'legacy failure' });
    expect(getKCTFailure(undefined)).toBeUndefined();
    expect(getKCTConfigSpec(undefined)).toBeUndefined();
  });

  test('class accessors expose normalized fields and versioned class', () => {
    const item: any = {
      spec: { template: { spec: { ntp: { enabled: true } } } },
      status: { observedGeneration: 1 },
    };
    const resource = new KubeadmConfigTemplate(item);
    const V1Beta2 = KubeadmConfigTemplate.withApiVersion('v1beta2');

    expect(KubeadmConfigTemplate.detailsRoute).toBe(
      '/cluster-api/kubeadmconfigtemplates/:namespace/:name'
    );
    expect(V1Beta2.apiVersion).toBe('bootstrap.cluster.x-k8s.io/v1beta2');
    expect(resource.spec).toBe(item.spec);
    expect(resource.observedGeneration).toBe(1);
    expect(resource.configSpec).toEqual({ ntp: { enabled: true } });
  });
});
