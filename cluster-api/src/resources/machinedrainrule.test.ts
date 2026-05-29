vi.mock('@kinvolk/headlamp-plugin/lib/k8s/cluster', () => ({
  KubeObject: class KubeObject<T = unknown> {
    jsonData: T;

    constructor(jsonData: T) {
      this.jsonData = jsonData;
    }
  },
}));

import { MachineDrainRule } from './machinedrainrule';

describe('machine drain rule resource', () => {
  test('exposes static metadata, versioned class, and spec accessor', () => {
    const spec = {
      drain: { behavior: 'WaitCompleted', order: 10 },
      machines: [{ selector: { matchLabels: { role: 'worker' } } }],
    };
    const resource = new MachineDrainRule({ spec } as any);
    const V1Beta2 = MachineDrainRule.withApiVersion('v1beta2');

    expect(MachineDrainRule.apiName).toBe('machinedrainrules');
    expect(MachineDrainRule.detailsRoute).toBe('/cluster-api/machinedrainrules/:namespace/:name');
    expect(V1Beta2.apiVersion).toBe('cluster.x-k8s.io/v1beta2');
    expect(resource.spec).toBe(spec);
  });
});
