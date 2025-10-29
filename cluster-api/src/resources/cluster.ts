import { KubeObject, KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { MachineHealthCheckClass } from './clusterclass';
import { Condition, ObjectMeta, ReadinessGate } from './common';

export class Cluster extends KubeObject<ClusterApiCluster> {
  static readonly apiName = 'clusters';
  static readonly apiVersion = 'cluster.x-k8s.io/v1beta1';
  static readonly isNamespaced = true;
  static readonly kind = 'Cluster';

  static get detailsRoute() {
    return '/cluster-api/capiclusters/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }
}

export interface ClusterApiCluster extends KubeObjectInterface {
  spec?: {
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
      version: string;
      rolloutAfter?: Time; // deprecated
      controlPlane?: {
        metadata?: ObjectMeta;
        replicas?: number;
        machineHealthCheck?: MachineHealthCheckTopology;
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
  };
  status?: {
    failureDomains?: Record<string, FailureDomainSpec>;
    failureReason?: string; // deprecated
    failureMessage?: string; // deprecated
    phase?: string;
    infrastructureReady: boolean;
    controlPlaneReady: boolean;
    conditions?: Condition[];
    observedGeneration?: bigint;
    v1beta2?: ClusterV1Beta2Status;
  };
}

export interface ClusterV1Beta2Status {
  conditions?: Condition[];
  controlPlane?: ReplicasStatus;
  workers?: ReplicasStatus;
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
  machineHealthCheck?: MachineHealthCheckTopology;
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

export interface MachineHealthCheckTopology extends MachineHealthCheckClass {
  enabled?: boolean;
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
