import { KubeObject, KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Condition, ObjectMeta, ReadinessGate } from './common';

const CLUSTER_API_GROUP = 'cluster.x-k8s.io';
const CLUSTER_CRD_NAME = 'clusters.cluster.x-k8s.io';

/**
 * Cluster is the KubeObject implementation for the Cluster API Cluster resource.
 * It provides helper methods to access spec and normalized status across API versions.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#cluster
 */
export class Cluster extends KubeObject<ClusterApiCluster> {
  static readonly apiName = 'clusters';
  static apiVersion = `${CLUSTER_API_GROUP}/v1beta1`;
  static readonly crdName = CLUSTER_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'Cluster';

  /**
   * Returns the route for the cluster details page.
   */
  static get detailsRoute() {
    return '/cluster-api/capiclusters/:namespace/:name';
  }

  /**
   * Returns a version of the Cluster class with a specific API version.
   *
   * @param version - The API version string (e.g., 'v1beta2').
   * @returns A Cluster class subclass with the updated apiVersion.
   */
  static withApiVersion(version: string): typeof Cluster {
    const versionedClass = class extends Cluster {} as typeof Cluster;
    versionedClass.apiVersion = `${CLUSTER_API_GROUP}/${version}`;
    return versionedClass;
  }

  /**
   * Returns the cluster specification.
   */
  get spec(): ClusterSpec | undefined {
    return this.jsonData.spec;
  }

  /**
   * Returns the raw status object.
   */
  get status(): ClusterStatusCommon | undefined {
    return getClusterStatus(this.jsonData);
  }

  /**
   * Returns internal normalized status for consistent access across v1beta1/v1beta2.
   */
  private get _normalized() {
    return normalizeClusterStatus(this.jsonData);
  }

  /**
   * Returns the cluster conditions.
   */
  get conditions() {
    return this._normalized.conditions;
  }

  /**
   * Returns the cluster failure information if present.
   */
  get failure() {
    return this._normalized.failure;
  }

  /**
   * Returns normalized control plane status.
   */
  get controlPlaneStatus() {
    return this._normalized.controlPlane;
  }

  /**
   * Returns normalized worker status.
   */
  get workerStatus() {
    return this._normalized.workers;
  }

  /**
   * Returns cluster initialization status (v1beta2).
   */
  get initialization() {
    return this._normalized.initialization;
  }
}

/**
 * Cluster resource specification.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#cluster
 */
export interface ClusterSpec {
  /** Paused can be used to prevent controllers from processing the Cluster and all its associated objects. */
  paused?: boolean;
  /** Cluster network configuration. */
  clusterNetwork?: {
    apiServerPort?: number;
    services?: {
      cidrBlocks: string[];
    };
    pods?: {
      cidrBlocks: string[];
    };
    serviceDomain?: string;
  };
  /** ControlPlaneEndpoint represents the endpoint used to communicate with the control plane. */
  controlPlaneEndpoint?: {
    host: string;
    port: number;
  };
  /** ControlPlaneRef is an optional reference to a control plane resource. */
  controlPlaneRef?: KubeObjectInterface;
  /** InfrastructureRef is a reference to a resource which manages the underlying infrastructure. */
  infrastructureRef?: KubeObjectInterface;
  /** Topology describes a cluster topology. */
  topology?: {
    /** The name of the {@link ClusterClass} object to derive the topology from. */
    class: string;
    /** The namespace of the {@link ClusterClass} object. */
    classNamespace?: string;
    /** Reference to the {@link ClusterClass} object (v1beta2 only). */
    classRef?: {
      name: string;
      namespace?: string;
    };
    /** Version of the Kubernetes configuration to use. */
    version: string;
    /** @deprecated use rolloutAfter in controlPlane/workers instead. */
    rolloutAfter?: Time;
    /** Control plane topology configuration. */
    controlPlane?: {
      metadata?: ObjectMeta;
      replicas?: number;
      nodeDrainTimeout?: number;
      nodeVolumeDetachTimeout?: number;
      nodeDeletionTimeout?: number;
      readinessGates?: ReadinessGate[];
      variables?: {
        overrides?: ClusterVariable[];
      };
    };
    /** Worker topology configuration. */
    workers?: {
      machineDeployments?: MachineDeploymentTopology[];
      machinePools?: MachinePoolTopology[];
    };
    /** Cluster-wide variables. */
    variables?: ClusterVariable[];
  };
  /** AvailabilityGates are additional conditions for cluster availability. */
  availabilityGates?: ReadinessGate[];
}

/**
 * Cluster resource status.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#cluster
 */
export interface ClusterStatusCommon {
  /** FailureDomains is a slice of failure domain objects for the cluster. */
  failureDomains?: Record<string, FailureDomainSpec>;
  /** Phase represents the current phase of cluster actuation. */
  phase?: string;
  /** InfrastructureReady is the state of the infrastructure as a whole. */
  infrastructureReady?: boolean;
  /** ControlPlaneReady defines if the control plane is ready. */
  controlPlaneReady?: boolean;
  /** ObservedGeneration is the latest generation as observed by the controller. */
  observedGeneration?: bigint;
}

/**
 * ClusterInitialization status introduced in v1beta2.
 */
export interface ClusterInitialization {
  /** ControlPlaneInitialized defines if the control plane is initialized. */
  controlPlaneInitialized?: boolean;
  /** InfrastructureProvisioned defines if the infrastructure is provisioned. */
  infrastructureProvisioned?: boolean;
}

export interface ClusterStatusV1Beta1 extends ClusterStatusCommon {
  conditions?: Condition[];
  failureReason?: string;
  failureMessage?: string;
  v1beta2?: ClusterStatusV1Beta2Nested;
}

export interface ClusterStatusV1Beta2 extends ClusterStatusCommon {
  conditions?: Condition[];
  controlPlane?: ReplicasStatus;
  workers?: ReplicasStatus;
  initialization?: ClusterInitialization; // v1beta2 only
  deprecated?: {
    v1beta1?: {
      failureReason?: string;
      failureMessage?: string;
    };
  };
}

export interface ClusterStatusV1Beta2Nested {
  conditions?: Condition[];
  controlPlane?: ReplicasStatus;
  workers?: ReplicasStatus;
  initialization?: ClusterInitialization;
}

export type ClusterApiCluster =
  | (KubeObjectInterface & { spec?: ClusterSpec; status?: ClusterStatusV1Beta1 })
  | (KubeObjectInterface & { spec?: ClusterSpec; status?: ClusterStatusV1Beta2 });

interface NormalizedClusterStatus {
  conditions?: Condition[];
  failure?: { failureReason?: string; failureMessage?: string };
  controlPlane?: ReplicasStatus;
  workers?: ReplicasStatus;
  initialization?: ClusterInitialization;
}

function isV1Beta2Status(
  status: ClusterStatusV1Beta1 | ClusterStatusV1Beta2
): status is ClusterStatusV1Beta2 {
  return !!status && ('controlPlane' in status || 'workers' in status || 'deprecated' in status);
}

/**
 * Normalizes Cluster status fields across v1beta1 and v1beta2 API versions.
 *
 * @param item - The raw Cluster resource interface.
 * @returns A normalized status object.
 */
function normalizeClusterStatus(
  item: ClusterApiCluster | null | undefined
): NormalizedClusterStatus {
  const status = item?.status;
  if (!status) {
    return {};
  }

  if (isV1Beta2Status(status)) {
    const deprecated = status.deprecated?.v1beta1;
    return {
      conditions: status.conditions,
      failure:
        deprecated?.failureReason || deprecated?.failureMessage
          ? {
              failureReason: deprecated?.failureReason,
              failureMessage: deprecated?.failureMessage,
            }
          : undefined,
      controlPlane: status.controlPlane,
      workers: status.workers,
      initialization: status.initialization,
    };
  }

  return {
    conditions: status.v1beta2?.conditions?.length ? status.v1beta2.conditions : status.conditions,
    failure:
      status.failureReason || status.failureMessage
        ? {
            failureReason: status.failureReason,
            failureMessage: status.failureMessage,
          }
        : undefined,
    controlPlane: status.v1beta2?.controlPlane,
    workers: status.v1beta2?.workers,
    initialization: status.v1beta2?.initialization,
  };
}

/**
 * Returns the raw status object from a Cluster resource.
 *
 * @param item - The Cluster resource.
 */
export function getClusterStatus(item: ClusterApiCluster | null | undefined) {
  return item?.status;
}

/**
 * Returns normalized conditions for a Cluster resource.
 *
 * @param item - The Cluster resource.
 */
export function getClusterConditions(item: ClusterApiCluster | null | undefined) {
  return normalizeClusterStatus(item).conditions;
}

/**
 * Returns the cluster failure information if present.
 *
 * @param item - The Cluster resource.
 */
export function getClusterFailure(item: ClusterApiCluster | null | undefined) {
  return normalizeClusterStatus(item).failure;
}

/**
 * Returns normalized control plane replica status for a Cluster resource.
 *
 * @param item - The Cluster resource.
 */
export function getClusterControlPlaneStatus(item: ClusterApiCluster | null | undefined) {
  return normalizeClusterStatus(item).controlPlane;
}

/**
 * Returns normalized worker replica status for a Cluster resource.
 *
 * @param item - The Cluster resource.
 */
export function getClusterWorkerStatus(item: ClusterApiCluster | null | undefined) {
  return normalizeClusterStatus(item).workers;
}

/**
 * Returns cluster initialization status for a Cluster resource.
 *
 * @param item - The Cluster resource.
 */
export function getClusterInitialization(item: ClusterApiCluster | null | undefined) {
  return normalizeClusterStatus(item).initialization;
}

/**
 * ClusterVariable represents a variable value in a Cluster.
 */
export interface ClusterVariable {
  /** Name of the variable. */
  name: string;
  /** @deprecated use ClusterClass.spec.variables instead. */
  definitionFrom?: string;
  /** Value of the variable in JSON format. */
  value: JSON;
}

/**
 * FailureDomainSpec is the specification of a failure domain.
 */
export interface FailureDomainSpec {
  /** ControlPlane defines whether the control plane machines will be created in this failure domain. */
  controlPlane?: boolean;
  /** Attributes is a set of attributes for this failure domain. */
  attributes?: Record<string, string>;
}

/**
 * MachineDeploymentTopology defines a machine deployment in a topology.
 */
export interface MachineDeploymentTopology {
  /** Metadata is the metadata of the machine deployment. */
  metadata?: ObjectMeta;
  /** Class is the name of the MachineDeploymentClass. */
  class: string;
  /** Name is the name of the machine deployment. */
  name: string;
  /** FailureDomain is the failure domain of the machines in the deployment. */
  failureDomain?: string;
  /** Replicas is the number of desired replicas. */
  replicas?: number;
  /** NodeDrainTimeout is the maximum duration for a node to drain. */
  nodeDrainTimeout?: number;
  /** NodeVolumeDetachTimeout is the maximum duration for a volume to detach. */
  nodeVolumeDetachTimeout?: number;
  /** NodeDeletionTimeout is the maximum duration for a node to be deleted. */
  nodeDeletionTimeout?: number;
  /** MinReadySeconds is the minimum number of seconds for which a newly created machine should be ready. */
  minReadySeconds?: number;
  /** ReadinessGates are additional conditions for machine availability. */
  readinessGates?: ReadinessGate[];
  /** Strategy describes how to replace existing machines with new ones. */
  strategy?: string;
  /** Variables are the variables used in the template. */
  variables?: {
    overrides?: ClusterVariable[];
  };
}

/**
 * MachinePoolTopology defines a machine pool in a topology.
 */
export interface MachinePoolTopology {
  /** Metadata is the metadata of the machine pool. */
  metadata?: ObjectMeta;
  /** Class is the name of the MachinePoolClass. */
  class: string;
  /** Name is the name of the machine pool. */
  name: string;
  /** FailureDomains are the failure domains of the machines in the pool. */
  failureDomains?: string[];
  /** NodeDrainTimeout is the maximum duration for a node to drain. */
  nodeDrainTimeout?: number;
  /** NodeVolumeDetachTimeout is the maximum duration for a volume to detach. */
  nodeVolumeDetachTimeout?: number;
  /** NodeDeletionTimeout is the maximum duration for a node to be deleted. */
  nodeDeletionTimeout?: number;
  /** MinReadySeconds is the minimum number of seconds for which a newly created machine should be ready. */
  minReadySeconds?: number;
  /** Replicas is the number of desired replicas. */
  replicas?: number;
  /** Variables are the variables used in the template. */
  variables?: {
    overrides?: ClusterVariable[];
  };
}

/**
 * ReplicasStatus represents the replica status of a resource.
 */
export interface ReplicasStatus {
  /** DesiredReplicas is the total number of desired machines. */
  desiredReplicas?: number;
  /** Replicas is the total number of non-terminated machines. */
  replicas?: number;
  /** UpToDateReplicas is the total number of non-terminated machines that have the desired specification. */
  upToDateReplicas?: number;
  /** ReadyReplicas is the total number of ready machines. */
  readyReplicas?: number;
  /** AvailableReplicas is the total number of available machines. */
  availableReplicas?: number;
}
