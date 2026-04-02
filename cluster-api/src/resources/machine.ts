import { KubeObject, KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ClusterV1Condition, MetaV1Condition, ReadinessGate } from './common';

const MACHINE_API_GROUP = 'cluster.x-k8s.io';
const MACHINE_CRD_NAME = 'machines.cluster.x-k8s.io';

/**
 * Machine resource specification.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#machine
 */
export interface MachineSpec {
  /** ClusterName is the name of the Cluster this object belongs to. */
  clusterName: string;
  /** Bootstrap is a reference to a local struct which contains information about the bootstrap configuration for this machine. */
  bootstrap: {
    /** ConfigRef is a reference to a bootstrap provider-specific resource that holds configuration details. */
    configRef?: KubeObjectInterface;
    /** DataSecretName is the name of the secret that contains the bootstrapped data. */
    dataSecretName?: string;
  };
  /** InfrastructureRef is a required reference to a custom resource offered by an infrastructure provider. */
  infrastructureRef: KubeObjectInterface;
  /** Version defines the desired Kubernetes version. */
  version?: string;
  /** ProviderID is the identification ID of the machine provided by the infrastructure provider. */
  providerID?: string;
  /** FailureDomain is the failure domain the machine should be placed in. */
  failureDomain?: string;
  /** ReadinessGates contains the list of additional conditions to be evaluated for Machine readiness. */
  readinessGates?: ReadinessGate[];
  /** @deprecated use deletion.nodeDrainTimeoutSeconds instead. */
  nodeDrainTimeout?: number;
  /** @deprecated use deletion.nodeVolumeDetachTimeoutSeconds instead. */
  nodeVolumeDetachTimeout?: number;
  /** @deprecated use deletion.nodeDeletionTimeoutSeconds instead. */
  nodeDeletionTimeout?: number;
  /** Deletion contains configuration for the deletion of the machine (v1beta2). */
  deletion?: {
    /** Order defines the order in which the machine should be deleted. */
    order?: 'Random' | 'Newest' | 'Oldest';
    /** NodeDrainTimeoutSeconds is the timeout for draining the node. */
    nodeDrainTimeoutSeconds?: number;
    /** NodeVolumeDetachTimeoutSeconds is the timeout for detaching volumes from the node. */
    nodeVolumeDetachTimeoutSeconds?: number;
    /** NodeDeletionTimeoutSeconds is the timeout for deleting the node. */
    nodeDeletionTimeoutSeconds?: number;
  };
}

/**
 * MachineAddress contains information about the address of a machine.
 */
export interface MachineAddress {
  /** Type is the type of the address (e.g. InternalIP, ExternalIP, etc). */
  type: string;
  /** Address is the address. */
  address: string;
}

/**
 * MachineNodeInfo contains information about the node.
 */
export interface MachineNodeInfo {
  /** MachineID is the machine ID as reported by the node. */
  machineID: string;
  /** SystemUUID is the system UUID as reported by the node. */
  systemUUID: string;
  /** BootID is the boot ID as reported by the node. */
  bootID: string;
  /** KernelVersion is the kernel version as reported by the node. */
  kernelVersion: string;
  /** OsImage is the OS image as reported by the node. */
  osImage: string;
  /** ContainerRuntimeVersion is the container runtime version as reported by the node. */
  containerRuntimeVersion: string;
  /** KubeletVersion is the kubelet version as reported by the node. */
  kubeletVersion: string;
  /** KubeProxyVersion is the kube-proxy version as reported by the node. */
  kubeProxyVersion: string;
  /** OperatingSystem is the operating system as reported by the node. */
  operatingSystem: string;
  /** Architecture is the architecture as reported by the node. */
  architecture: string;
  /** Swap contains information about swap memory (v1beta2). */
  swap?: { capacity?: number };
}

/**
 * Common status fields across Machine versions.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#machine
 */
export interface MachineStatusCommon {
  /** NodeRef is a reference to the corresponding Node. */
  nodeRef?: KubeObjectInterface;
  /** NodeInfo is a set of useful (node) information from the node. */
  nodeInfo?: MachineNodeInfo;
  /** LastUpdated identifies when the phase of the machine last transitioned. */
  lastUpdated?: Time;
  /** Addresses is a list of addresses assigned to the machine. */
  addresses?: MachineAddress[];
  /** Phase represents the current phase of machine actuation. */
  phase?: string;
  /** CertificateExpiryDate is the expiry date of the certificates on this machine. */
  certificateExpiryDate?: Time;
  /** BootstrapReady defines if the bootstrap data is ready. */
  bootstrapReady?: boolean;
  /** InfrastructureReady defines if the infrastructure is ready. */
  infrastructureReady?: boolean;
  /** ObservedGeneration is the latest generation as observed by the controller. */
  observedGeneration?: number;
  /** Deletion information (v1beta2). */
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

/**
 * Returns the raw status object from a Machine resource.
 *
 * @param item - The raw Machine resource.
 */
export function getMachineStatus(
  item: ClusterApiMachine | null | undefined
): MachineStatusCommon | undefined {
  return item?.status ?? undefined;
}

/**
 * Returns normalized conditions for a Machine resource across v1beta1/v1beta2.
 *
 * @param item - The raw Machine resource.
 */
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

/**
 * Returns failure reason and message for a Machine resource.
 *
 * @param item - The raw Machine resource.
 */
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
/**
 * Machine is the KubeObject implementation for the Cluster API Machine resource.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#machine
 */
export class Machine extends KubeObject<ClusterApiMachine> {
  static readonly apiName = 'machines';
  static apiVersion = `${MACHINE_API_GROUP}/v1beta1`;
  static readonly crdName = MACHINE_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'Machine';

  /**
   * Returns the route for the machine details page.
   */
  static get detailsRoute() {
    return '/cluster-api/machines/:namespace/:name';
  }

  /**
   * Returns a version of the Machine class with a specific API version.
   */
  static withApiVersion(version: string): typeof Machine {
    const versionedClass = class extends Machine {} as typeof Machine;
    versionedClass.apiVersion = `${MACHINE_API_GROUP}/${version}`;
    return versionedClass;
  }

  /**
   * Returns the machine specification.
   */
  get spec(): MachineSpec | undefined {
    return this.jsonData.spec;
  }

  /**
   * Returns the raw status object.
   */
  get status(): MachineStatusCommon | undefined {
    return getMachineStatus(this.jsonData);
  }

  /**
   * Returns normalized conditions for the machine.
   */
  get conditions(): MetaV1Condition[] | ClusterV1Condition[] | undefined {
    return getMachineConditions(this.jsonData);
  }

  /**
   * Returns failure information if present.
   */
  get failure(): { failureReason?: string; failureMessage?: string } | undefined {
    return getMachineFailure(this.jsonData);
  }
}
