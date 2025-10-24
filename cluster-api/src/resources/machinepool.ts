import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Condition } from './common';
import { MachineTemplateSpec } from './machineset';

export class MachinePool extends KubeObject<ClusterApiMachinePool> {
  static readonly apiName = 'machinepools';
  static readonly apiVersion = 'cluster.x-k8s.io/v1beta1';
  static readonly isNamespaced = true;
  static readonly kind = 'MachinePool';

  static get detailsRoute() {
    return '/cluster-api/machinepools/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }
}

export interface ClusterApiMachinePool extends KubeObjectInterface {
  spec: {
    clusterName: string;
    replicas?: number;
    template: MachineTemplateSpec;
    minReadySeconds?: number;
    providerIDList?: string[];
    failureDomains?: string[];
  };
  status: {
    nodeRefs?: Array<KubeObjectInterface>;
    replicas: number;
    readyReplicas?: number;
    availableReplicas?: number;
    unavailableReplicas?: number; // deprecated
    failureReason?: string; // deprecated
    failureMessage?: string; // deprecated
    phase?: string;
    bootstrapReady?: boolean;
    infrastructureReady?: boolean;
    observedGeneration?: bigint;
    conditions?: Condition[];
    v1beta2?: {
      conditions?: Condition[];
      readyReplicas?: number;
      availableReplicas?: number;
      upToDateReplicas?: number;
    };
  };
}
