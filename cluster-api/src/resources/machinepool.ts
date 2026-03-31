import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Condition } from './common';
import { MachineTemplateSpec } from './machineset';

const MACHINEPOOL_API_GROUP = 'cluster.x-k8s.io';
const MACHINEPOOL_CRD_NAME = 'machinepools.cluster.x-k8s.io';

export class MachinePool extends KubeObject<ClusterApiMachinePool> {
  static readonly apiName = 'machinepools';
  static apiVersion = `${MACHINEPOOL_API_GROUP}/v1beta1`;
  static readonly crdName = MACHINEPOOL_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'MachinePool';

  static get detailsRoute() {
    return '/cluster-api/machinepools/:namespace/:name';
  }

  static withApiVersion(version: string): typeof MachinePool {
    const versionedClass = class extends MachinePool {} as typeof MachinePool;
    versionedClass.apiVersion = `${MACHINEPOOL_API_GROUP}/${version}`;
    return versionedClass;
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }

  get conditions() {
    return getMachinePoolConditions(this.jsonData);
  }

  get upToDateReplicas() {
    return getMachinePoolUpToDateReplicas(this.jsonData);
  }

  static get isScalable() {
    return true;
  }
}

export function getMachinePoolConditions(item: ClusterApiMachinePool | null | undefined) {
  const status = item?.status;
  if (!status) return undefined;

  if (status.v1beta2?.conditions?.length) {
    return status.v1beta2.conditions;
  }

  return status.conditions;
}

export function getMachinePoolUpToDateReplicas(item: ClusterApiMachinePool | null | undefined) {
  const status = item?.status;
  if (!status) return undefined;

  return status.v1beta2?.upToDateReplicas;
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
