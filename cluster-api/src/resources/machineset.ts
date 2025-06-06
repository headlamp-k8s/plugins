import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Condition, LabelSelector, ObjectMeta } from './common';
import { MachineSpec } from './machine';

export class MachineSet extends KubeObject<ClusterApiMachineSet> {
  static readonly apiName = 'machinesets';
  static readonly apiVersion = 'cluster.x-k8s.io/v1beta1';
  static readonly isNamespaced = true;
  static readonly kind = 'MachineSet';

  static get detailsRoute() {
    return '/cluster-api/machinesets/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }
}

export interface ClusterApiMachineSet extends KubeObjectInterface {
  spec: {
    clusterName: string;
    replicas?: number;
    minReadySeconds?: number;
    deletePolicy?: 'Random' | 'Newest' | 'Oldest';
    selector: LabelSelector;
    template: MachineTemplateSpec;
    machineNamingStrategy?: {
      template?: string;
    };
  };
  status: {
    selector?: string;
    replicas?: number;
    fullyLabeledReplicas: number; // deprecated
    readyReplicas?: number;
    availableReplicas?: number;
    observedGeneration?: bigint;
    failureReason?: string; // deprecated
    failureMessage?: string; // deprecated
    conditions?: Condition[];
    v1beta2?: {
      conditions?: Condition[];
      readyReplicas?: number;
      availableReplicas?: number;
      upToDateReplicas?: number;
    };
  };
}

export interface MachineTemplateSpec {
  metadata?: ObjectMeta;
  spec: MachineSpec;
}
