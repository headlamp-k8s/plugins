import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ClusterV1Condition, MetaV1Condition } from './common';
import { MachineTemplateSpec } from './machineset';

const MACHINEPOOL_API_GROUP = 'cluster.x-k8s.io';
const MACHINEPOOL_CRD_NAME = 'machinepools.cluster.x-k8s.io';

export interface NodeReference {
  name: string;
  namespace?: string;
  uid?: string;
}

export interface MachinePoolInitialization {
  bootstrapDataSecretCreated?: boolean;
  infrastructureProvisioned?: boolean;
}

export interface MachinePoolStatusV1Beta1 {
  observedGeneration?: number;
  replicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
  unavailableReplicas?: number; // deprecated in v1beta2
  phase?: string;
  bootstrapReady?: boolean;
  infrastructureReady?: boolean;
  failureReason?: string; // deprecated in v1beta2
  failureMessage?: string; // deprecated in v1beta2
  nodeRefs?: NodeReference[];
  conditions?: ClusterV1Condition[];
  v1beta2?: {
    conditions?: MetaV1Condition[];
    readyReplicas?: number;
    availableReplicas?: number;
    upToDateReplicas?: number;
  };
}

export interface MachinePoolStatusV1Beta2 {
  observedGeneration?: number;
  replicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
  upToDateReplicas?: number;
  phase?: string;
  nodeRefs?: NodeReference[];
  conditions?: MetaV1Condition[];
  initialization?: MachinePoolInitialization;
  deprecated?: {
    v1beta1?: {
      conditions?: ClusterV1Condition[];
      failureReason?: string;
      failureMessage?: string;
      readyReplicas?: number;
      availableReplicas?: number;
      unavailableReplicas?: number;
    };
  };
}

export interface MachinePoolSpec {
  clusterName: string;
  replicas?: number;
  template: MachineTemplateSpec;
  minReadySeconds?: number;
  providerIDList?: string[];
  failureDomains?: string[];
}

export interface ClusterApiMachinePool extends KubeObjectInterface {
  spec: MachinePoolSpec;
  status?: MachinePoolStatusV1Beta1 | MachinePoolStatusV1Beta2;
}

function isV1Beta2Status(
  status: MachinePoolStatusV1Beta1 | MachinePoolStatusV1Beta2
): status is MachinePoolStatusV1Beta2 {
  return 'deprecated' in status || 'initialization' in status;
}

export function getMachinePoolConditions(
  item: ClusterApiMachinePool | null | undefined
): MetaV1Condition[] | ClusterV1Condition[] | undefined {
  const status = item?.status;
  if (!status) return undefined;

  if (isV1Beta2Status(status)) {
    return status.conditions;
  }
  if (status.v1beta2?.conditions?.length) {
    return status.v1beta2.conditions;
  }
  return status.conditions;
}

export function getMachinePoolUpToDateReplicas(
  item: ClusterApiMachinePool | null | undefined
): number | undefined {
  const status = item?.status;
  if (!status) return undefined;

  if (isV1Beta2Status(status)) {
    return status.upToDateReplicas;
  }
  return status.v1beta2?.upToDateReplicas;
}

export function getMachinePoolInitialization(
  item: ClusterApiMachinePool | null | undefined
): MachinePoolInitialization | undefined {
  const status = item?.status;
  if (!status) return undefined;

  if (isV1Beta2Status(status)) {
    return status.initialization; // v1beta2
  }
  return {
    bootstrapDataSecretCreated: status.bootstrapReady,
    infrastructureProvisioned: status.infrastructureReady,
  };
}

export class MachinePool extends KubeObject<ClusterApiMachinePool> {
  static readonly apiName = 'machinepools';
  static apiVersion = `${MACHINEPOOL_API_GROUP}/v1beta1`;
  static readonly crdName = MACHINEPOOL_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'MachinePool';
  static get isScalable() {
    return true;
  }

  static get detailsRoute() {
    return '/cluster-api/machinepools/:namespace/:name';
  }

  static withApiVersion(version: string): typeof MachinePool {
    const versionedClass = class extends MachinePool {} as typeof MachinePool;
    versionedClass.apiVersion = `${MACHINEPOOL_API_GROUP}/${version}`;
    return versionedClass;
  }

  get spec(): MachinePoolSpec {
    return this.jsonData.spec;
  }

  get status(): MachinePoolStatusV1Beta1 | MachinePoolStatusV1Beta2 | undefined {
    return this.jsonData.status;
  }

  get conditions(): MetaV1Condition[] | ClusterV1Condition[] | undefined {
    return getMachinePoolConditions(this.jsonData);
  }

  get upToDateReplicas(): number | undefined {
    return getMachinePoolUpToDateReplicas(this.jsonData);
  }

  get initialization(): MachinePoolInitialization | undefined {
    return getMachinePoolInitialization(this.jsonData);
  }
}
