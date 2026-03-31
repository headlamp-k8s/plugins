import { KubeObject, KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ClusterV1Condition, MetaV1Condition, ReadinessGate } from './common';

const MACHINE_API_GROUP = 'cluster.x-k8s.io';
const MACHINE_CRD_NAME = 'machines.cluster.x-k8s.io';

export interface MachineSpec {
  clusterName: string;
  bootstrap: {
    configRef?: KubeObjectInterface;
    dataSecretName?: string;
  };
  infrastructureRef: KubeObjectInterface;
  version?: string;
  providerID?: string;
  failureDomain?: string;
  readinessGates?: ReadinessGate[];
  nodeDrainTimeout?: number; // v1beta1
  nodeVolumeDetachTimeout?: number; //v1beta1
  nodeDeletionTimeout?: number; //v1beta1
  deletion?: {
    //  v1beta2
    order?: 'Random' | 'Newest' | 'Oldest';
    nodeDrainTimeoutSeconds?: number;
    nodeVolumeDetachTimeoutSeconds?: number;
    nodeDeletionTimeoutSeconds?: number;
  };
}

export interface MachineAddress {
  type: string;
  address: string;
}

export interface MachineNodeInfo {
  machineID: string;
  systemUUID: string;
  bootID: string;
  kernelVersion: string;
  osImage: string;
  containerRuntimeVersion: string;
  kubeletVersion: string;
  kubeProxyVersion: string;
  operatingSystem: string;
  architecture: string;
  swap?: { capacity?: number };
}

export interface MachineStatusCommon {
  nodeRef?: KubeObjectInterface;
  nodeInfo?: MachineNodeInfo;
  lastUpdated?: Time;
  addresses?: MachineAddress[];
  phase?: string;
  certificateExpiryDate?: Time;
  bootstrapReady?: boolean;
  infrastructureReady?: boolean;
  observedGeneration?: number;
  deletion?: {
    nodeDrainStartTime?: Time;
    waitForNodeVolumeDetachTime?: Time;
  };
}

export interface MachineStatusV1Beta2Nested {
  conditions?: MetaV1Condition[];
}

export interface MachineStatusDeprecatedV1Beta1 {
  conditions?: ClusterV1Condition[];
  failureReason?: string;
  failureMessage?: string;
}

export interface MachineStatusV1Beta1 extends MachineStatusCommon {
  conditions?: ClusterV1Condition[];
  failureReason?: string;
  failureMessage?: string;
  v1beta2?: MachineStatusV1Beta2Nested;
}

export interface MachineStatusV1Beta2 extends MachineStatusCommon {
  conditions?: MetaV1Condition[];
  deprecated?: {
    v1beta1?: MachineStatusDeprecatedV1Beta1;
  };
}

export interface ClusterApiMachineV1Beta1 extends KubeObjectInterface {
  spec?: MachineSpec;
  status?: MachineStatusV1Beta1;
}

export interface ClusterApiMachineV1Beta2 extends KubeObjectInterface {
  spec?: MachineSpec;
  status?: MachineStatusV1Beta2;
}

export type ClusterApiMachine = ClusterApiMachineV1Beta1 | ClusterApiMachineV1Beta2;

function isV1Beta1Status(
  status: MachineStatusV1Beta1 | MachineStatusV1Beta2
): status is MachineStatusV1Beta1 {
  return !('deprecated' in status);
}

function isV1Beta2Status(
  status: MachineStatusV1Beta1 | MachineStatusV1Beta2
): status is MachineStatusV1Beta2 {
  return 'deprecated' in status;
}

export function getMachineStatus(
  item: ClusterApiMachine | null | undefined
): MachineStatusCommon | undefined {
  return item?.status ?? undefined;
}

export function getMachineConditions(
  item: ClusterApiMachine | null | undefined
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

export function getMachineFailure(
  item: ClusterApiMachine | null | undefined
): { failureReason?: string; failureMessage?: string } | undefined {
  const status = item?.status;
  if (!status) return undefined;

  if (isV1Beta1Status(status)) {
    const { failureReason, failureMessage } = status;
    if (failureReason || failureMessage) return { failureReason, failureMessage };
    return undefined;
  }

  const deprecated = status.deprecated?.v1beta1;
  if (deprecated?.failureReason || deprecated?.failureMessage) {
    return {
      failureReason: deprecated.failureReason,
      failureMessage: deprecated.failureMessage,
    };
  }

  return undefined;
}
export class Machine extends KubeObject<ClusterApiMachine> {
  static readonly apiName = 'machines';
  static apiVersion = `${MACHINE_API_GROUP}/v1beta1`;
  static readonly crdName = MACHINE_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'Machine';

  static get detailsRoute() {
    return '/cluster-api/machines/:namespace/:name';
  }

  static withApiVersion(version: string): typeof Machine {
    const versionedClass = class extends Machine {} as typeof Machine;
    versionedClass.apiVersion = `${MACHINE_API_GROUP}/${version}`;
    return versionedClass;
  }
  get spec(): MachineSpec | undefined {
    return this.jsonData.spec;
  }

  get status(): MachineStatusCommon | undefined {
    return getMachineStatus(this.jsonData);
  }
  get conditions(): MetaV1Condition[] | ClusterV1Condition[] | undefined {
    return getMachineConditions(this.jsonData);
  }
  get failure(): { failureReason?: string; failureMessage?: string } | undefined {
    return getMachineFailure(this.jsonData);
  }
}
