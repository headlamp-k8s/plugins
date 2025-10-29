import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { LabelSelector } from './common';

export class MachineDrainRule extends KubeObject<ClusterApiMachineDrainRule> {
  static readonly apiName = 'machinedrainrules';
  static readonly apiVersion = 'cluster.x-k8s.io/v1beta1';
  static readonly isNamespaced = true;
  static readonly kind = 'MachineDrainRule';

  static get detailsRoute() {
    return '/cluster-api/machinedrainrules/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }
}

export interface ClusterApiMachineDrainRule extends KubeObjectInterface {
  spec: {
    drain: {
      behavior: 'Drain' | 'Skip' | 'WaitCompleted';
      order?: number;
    };
    machines?: Array<{
      selector?: LabelSelector;
      clusterSelector?: LabelSelector;
    }>;
    pods?: Array<{
      selector?: LabelSelector;
      namespaceSelector?: LabelSelector;
    }>;
  };
}
