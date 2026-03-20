import { KubeObject, KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Condition, ReadinessGate } from './common';

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
  nodeDrainTimeout?: number;
  nodeVolumeDetachTimeout?: number;
  nodeDeletionTimeout?: number;
}

export interface MachineStatusV1Beta2 {
  conditions?: Condition[];
  nodeRef?: KubeObjectInterface;
  nodeInfo?: {
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
  };
  lastUpdated?: Time;
  addresses?: Array<{ type: string; address: string }>;
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

export interface MachineStatusV1Beta1Raw extends MachineStatusV1Beta2 {
  failureReason?: string;
  failureMessage?: string;
  v1beta2?: MachineStatusV1Beta2;
}

export interface ClusterApiMachineV1Beta1 extends KubeObjectInterface {
  spec?: MachineSpec;
  status?: MachineStatusV1Beta1Raw;
}

export interface ClusterApiMachineV1Beta2 extends KubeObjectInterface {
  spec?: MachineSpec;
  status?: MachineStatusV1Beta2;
}

export type ClusterApiMachine = ClusterApiMachineV1Beta1 | ClusterApiMachineV1Beta2;

export function getMachineStatus(
  item: ClusterApiMachine | null | undefined
): MachineStatusV1Beta2 | undefined {
  if (!item?.status) return undefined;
  const raw = item.status as MachineStatusV1Beta1Raw;
  return raw.v1beta2 ?? (item.status as MachineStatusV1Beta2);
}

export function getMachineRawStatus(
  item: ClusterApiMachine | null | undefined
): MachineStatusV1Beta1Raw | undefined {
  if (!item?.status) return undefined;
  const maybeV1beta1 = item.status as MachineStatusV1Beta1Raw;
  if (maybeV1beta1.v1beta2 !== undefined || maybeV1beta1.failureReason !== undefined) {
    return maybeV1beta1;
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
  get spec() {
    return this.jsonData.spec;
  }

  get status(): MachineStatusV1Beta2 | undefined {
    return getMachineStatus(this.jsonData);
  }
}
