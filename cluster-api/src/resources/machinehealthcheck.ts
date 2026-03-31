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

const MACHINEHEALTHCHECK_API_GROUP = 'cluster.x-k8s.io';
const MACHINEHEALTHCHECK_CRD_NAME = 'machinehealthchecks.cluster.x-k8s.io';

export class MachineHealthCheck extends KubeObject<ClusterApiMachineHealthCheck> {
  static readonly apiName = 'machinehealthchecks';
  static apiVersion = `${MACHINEHEALTHCHECK_API_GROUP}/v1beta1`;
  static readonly crdName = MACHINEHEALTHCHECK_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'MachineHealthCheck';

  static get detailsRoute() {
    return '/cluster-api/machinehealthchecks/:namespace/:name';
  }

  static withApiVersion(version: string): typeof MachineHealthCheck {
    const versionedClass = class extends MachineHealthCheck {} as typeof MachineHealthCheck;
    versionedClass.apiVersion = `${MACHINEHEALTHCHECK_API_GROUP}/${version}`;
    return versionedClass;
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get conditions() {
    return getMachineHealthCheckConditions(this.jsonData);
  }
}

export function getMachineHealthCheckConditions(
  item: ClusterApiMachineHealthCheck | null | undefined
) {
  const status = item?.status;
  if (!status) return undefined;

  if (status.v1beta2?.conditions?.length) {
    return status.v1beta2.conditions;
  }

  return status.conditions;
}

export interface UnhealthyCondition {
  type: 'Ready' | 'MemoryPressure' | 'DiskPressure' | 'PIDPressure' | 'NetworkUnavailable';
  status: 'True' | 'False' | 'Unknown';
  timeout: number;
}
