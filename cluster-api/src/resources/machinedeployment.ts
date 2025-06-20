import { KubeObject, KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Condition, LabelSelector } from './common';
import { MachineTemplateSpec } from './machineset';

export class MachineDeployment extends KubeObject<ClusterApiMachineDeployment> {
  static readonly apiName = 'machinedeployments';
  static readonly apiVersion = 'cluster.x-k8s.io/v1beta1';
  static readonly isNamespaced = true;
  static readonly kind = 'MachineDeployment';

  static get detailsRoute() {
    return '/cluster-api/machinedeployments/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }
}

export interface ClusterApiMachineDeployment extends KubeObjectInterface {
  spec?: {
    clusterName: string;
    replicas?: number;
    rolloutAfter?: Time;
    selector: LabelSelector;
    template: MachineTemplateSpec;
    strategy: MachineDeploymentStrategy;
    minReadySeconds?: number;
    revisionHistoryLimit?: number; // deprecated
    paused?: boolean;
    progressDeadlineSeconds?: number; // deprecated
  };
  status?: {
    observedGeneration?: number;
    selector?: string;
    replicas: number;
    updatedReplicas: number;
    readyReplicas: number;
    availableReplicas: number;
    unavailableReplicas: number; // deprecated
    phase?: string;
    conditions?: Condition[];
    v1beta2: {
      conditions?: Condition[];
      readyReplicas?: number;
      availableReplicas?: number;
      upToDateReplicas?: number;
    };
  };
}

export interface MachineDeploymentStrategy {
  type: 'RollingUpdate' | 'OnDelete';
  rollingUpdate?: {
    maxUnavailable?: number | string;
    maxSurge?: number | string;
    deletePolicy?: 'Random' | 'Newest' | 'Oldest';
  };
  remediationStrategy?: {
    maxInFlight?: number | string;
  };
}
