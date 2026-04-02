import { KubeObject, KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Condition, ObjectMeta, ReadinessGate } from './common';

const CLUSTER_API_GROUP = 'cluster.x-k8s.io';
const CLUSTER_CRD_NAME = 'clusters.cluster.x-k8s.io';

export class Cluster extends KubeObject<ClusterApiCluster> {
  static readonly apiName = 'clusters';
  static apiVersion = `${CLUSTER_API_GROUP}/v1beta1`;
  static readonly crdName = CLUSTER_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'Cluster';

  static get detailsRoute() {
    return '/cluster-api/capiclusters/:namespace/:name';
  }

  static withApiVersion(version: string): typeof Cluster {
    const versionedClass = class extends Cluster {} as typeof Cluster;
    versionedClass.apiVersion = `${CLUSTER_API_GROUP}/${version}`;
    return versionedClass;
  }

  get spec(): ClusterSpec | undefined {
    return this.jsonData.spec;
  }

  get status(): ClusterStatusCommon | undefined {
    return getClusterStatus(this.jsonData);
  }

  private get _normalized() {
    return normalizeClusterStatus(this.jsonData);
  }

  get conditions() {
    return this._normalized.conditions;
  }

  get failure() {
    return this._normalized.failure;
  }

  get controlPlaneStatus() {
    return this._normalized.controlPlane;
  }

  get workerStatus() {
    return this._normalized.workers;
  }

  get initialization() {
    return this._normalized.initialization;
  }
}

export interface ClusterSpec {
  paused?: boolean;
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
  controlPlaneEndpoint?: {
    host: string;
    port: number;
  };
  controlPlaneRef?: KubeObjectInterface;
  infrastructureRef?: KubeObjectInterface;
  topology?: {
    class: string;
    classNamespace?: string;
    classRef?: {
      name: string;
      namespace?: string;
    }; // v1beta2 only
    version: string;
    rolloutAfter?: Time; // deprecated
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
    workers?: {
      machineDeployments?: MachineDeploymentTopology[];
      machinePools?: MachinePoolTopology[];
    };
    variables?: ClusterVariable[];
  };
  availabilityGates?: ReadinessGate[];
}

export interface ClusterStatusCommon {
  failureDomains?: Record<string, FailureDomainSpec>;
  phase?: string;
  infrastructureReady?: boolean;
  controlPlaneReady?: boolean;
  observedGeneration?: bigint;
}

export interface ClusterInitialization {
  controlPlaneInitialized?: boolean;
  infrastructureProvisioned?: boolean;
} // v1beta2 initialization block

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

export function getClusterStatus(item: ClusterApiCluster | null | undefined) {
  return item?.status;
}

export function getClusterConditions(item: ClusterApiCluster | null | undefined) {
  return normalizeClusterStatus(item).conditions;
}

export function getClusterFailure(item: ClusterApiCluster | null | undefined) {
  return normalizeClusterStatus(item).failure;
}

export function getClusterControlPlaneStatus(item: ClusterApiCluster | null | undefined) {
  return normalizeClusterStatus(item).controlPlane;
}

export function getClusterWorkerStatus(item: ClusterApiCluster | null | undefined) {
  return normalizeClusterStatus(item).workers;
}

export function getClusterInitialization(item: ClusterApiCluster | null | undefined) {
  return normalizeClusterStatus(item).initialization;
}

export interface ClusterVariable {
  name: string;
  definitionFrom?: string; // deprecated
  value: JSON;
}

export interface FailureDomainSpec {
  controlPlane?: boolean;
  attributes?: Record<string, string>;
}

export interface MachineDeploymentTopology {
  metadata?: ObjectMeta;
  class: string;
  name: string;
  failureDomain?: string;
  replicas?: number;
  nodeDrainTimeout?: number;
  nodeVolumeDetachTimeout?: number;
  nodeDeletionTimeout?: number;
  minReadySeconds?: number;
  readinessGates?: ReadinessGate[];
  strategy?: string;
  variables?: {
    overrides?: ClusterVariable[];
  };
}

export interface MachinePoolTopology {
  metadata?: ObjectMeta;
  class: string;
  name: string;
  failureDomains?: string[];
  nodeDrainTimeout?: number;
  nodeVolumeDetachTimeout?: number;
  nodeDeletionTimeout?: number;
  minReadySeconds?: number;
  replicas?: number;
  variables?: {
    overrides?: ClusterVariable[];
  };
}

export interface ReplicasStatus {
  desiredReplicas?: number;
  replicas?: number;
  upToDateReplicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
}
