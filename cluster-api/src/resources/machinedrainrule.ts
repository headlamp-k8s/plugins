import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { LabelSelector } from './common';

const MACHINEDRAINRULE_API_GROUP = 'cluster.x-k8s.io';
const MACHINEDRAINRULE_CRD_NAME = 'machinedrainrules.cluster.x-k8s.io';

export class MachineDrainRule extends KubeObject<ClusterApiMachineDrainRule> {
  static readonly apiName = 'machinedrainrules';
  static apiVersion = `${MACHINEDRAINRULE_API_GROUP}/v1beta1`;
  static readonly crdName = MACHINEDRAINRULE_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'MachineDrainRule';

  static get detailsRoute() {
    return '/cluster-api/machinedrainrules/:namespace/:name';
  }

  static withApiVersion(version: string): typeof MachineDrainRule {
    const versionedClass = class extends MachineDrainRule {} as typeof MachineDrainRule;
    versionedClass.apiVersion = `${MACHINEDRAINRULE_API_GROUP}/${version}`;
    return versionedClass;
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
