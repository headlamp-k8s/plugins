import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Condition, LabelSelector } from './common';

export interface ClusterApiMachineHealthCheck extends KubeObjectInterface {
  spec?: {
    clusterName: string;
    selector: LabelSelector;
    unhealthyConditions?: UnhealthyCondition[];
    maxUnhealthy?: string | number; // deprecated
    unhealthyRange?: string; // deprecated
    nodeStartupTimeout?: number;
    remediationTemplate?: KubeObjectInterface;
  };
  status?: {
    expectedMachines?: number;
    currentHealthy?: number;
    remediationsAllowed?: number;
    observedGeneration?: bigint;
    targets?: string[];
    conditions?: Condition[];
    v1beta2?: {
      conditions?: Condition[];
    };
  };
}

export class MachineHealthCheck extends KubeObject<ClusterApiMachineHealthCheck> {
  static readonly apiName = 'machinehealthchecks';
  static readonly apiVersion = 'cluster.x-k8s.io/v1beta1';
  static readonly isNamespaced = true;
  static readonly kind = 'MachineHealthCheck';

  static get detailsRoute() {
    return '/cluster-api/machinehealthchecks/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }
}

export interface UnhealthyCondition {
  type: 'Ready' | 'MemoryPressure' | 'DiskPressure' | 'PIDPressure' | 'NetworkUnavailable';
  status: 'True' | 'False' | 'Unknown';
  timeout: number;
}
