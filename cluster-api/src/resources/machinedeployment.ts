import { KubeObject, KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import {
  ClusterV1Condition,
  LabelSelector,
  MachineDeploymentStrategy,
  MetaV1Condition,
} from './common';
import { MachineTemplateSpec } from './machineset';

const MACHINEDEPLOYMENT_API_GROUP = 'cluster.x-k8s.io';
const MACHINEDEPLOYMENT_CRD_NAME = 'machinedeployments.cluster.x-k8s.io';

export interface MachineDeploymentRollout {
  strategy?: MachineDeploymentStrategy;
}

/**
 * MachineDeployment resource specification.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#machinedeployment
 */
export interface MachineDeploymentSpec {
  /** ClusterName is the name of the Cluster this object belongs to. */
  clusterName: string;
  /** Number of desired machines. Defaults to 1. */
  replicas?: number;
  /** RolloutAfter is a field to indicate an rollout should be performed after the specified time even if no changes have been made to the MachineDeployment. */
  rolloutAfter?: Time;
  /** Label selector for machines. Existing MachineSets whose machines are selected by this will be the ones affected by this deployment. */
  selector: LabelSelector;
  /** Template describes the machines that will be created. */
  template: MachineTemplateSpec;
  /** @deprecated use rollout.strategy instead. */
  strategy?: MachineDeploymentStrategy;
  /** Rollout is the rollout strategy to use for this deployment (v1beta2). */
  rollout?: MachineDeploymentRollout;
  /** Minimum number of seconds for which a newly created machine should be ready. Defaults to 0. */
  minReadySeconds?: number;
  /** The number of old MachineSets to retain to allow rollback. Defaults to 10. */
  revisionHistoryLimit?: number;
  /** Indicates that the deployment is paused and will not be processed by the deployment controller. */
  paused?: boolean;
  /** The maximum time in seconds for a deployment to make progress before it is considered to be failed. */
  progressDeadlineSeconds?: number;
  /** @deprecated use deletion.order instead. */
  deletePolicy?: 'Random' | 'Newest' | 'Oldest';
  /** Deletion contains configuration for the deletion of machines (v1beta2). */
  deletion?: {
    /** Order defines the order in which machines should be deleted. */
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
 * Common status fields across MachineDeployment versions.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#machinedeployment
 */
export interface MachineDeploymentStatusCommon {
  /** Phase represents the current phase of machine deployment actuation. */
  phase?: string;
  /** The generation observed by the deployment controller. */
  observedGeneration?: number;
  /** Selector is the same as the match labels of the selector in the spec. */
  selector?: string;
  /** Total number of non-terminated machines targeted by this deployment. */
  replicas?: number;
  /** Total number of non-terminated machines targeted by this deployment that have the desired template spec. */
  updatedReplicas?: number;
  /** Total number of ready machines targeted by this deployment. */
  readyReplicas?: number;
  /** Total number of available machines targeted by this deployment. */
  availableReplicas?: number;
  /** Total number of unavailable machines targeted by this deployment. */
  unavailableReplicas?: number;
}

export interface MachineDeploymentStatusV1Beta2Nested {
  conditions?: MetaV1Condition[];
  readyReplicas?: number;
  upToDateReplicas?: number;
}

export interface MachineDeploymentStatusDeprecatedV1Beta1 {
  conditions?: ClusterV1Condition[];
  failureReason?: string;
  failureMessage?: string;
  unavailableReplicas?: number;
}

export interface MachineDeploymentStatusV1Beta1 extends MachineDeploymentStatusCommon {
  conditions?: ClusterV1Condition[];
  failureReason?: string;
  failureMessage?: string;
  unavailableReplicas?: number;
  v1beta2?: MachineDeploymentStatusV1Beta2Nested;
}

export interface MachineDeploymentStatusV1Beta2 extends MachineDeploymentStatusCommon {
  conditions?: MetaV1Condition[];
  upToDateReplicas?: number;
  deprecated?: {
    v1beta1?: MachineDeploymentStatusDeprecatedV1Beta1;
  };
}

export interface ClusterApiMachineDeploymentV1Beta1 extends KubeObjectInterface {
  spec?: MachineDeploymentSpec;
  status?: MachineDeploymentStatusV1Beta1;
}

export interface ClusterApiMachineDeploymentV1Beta2 extends KubeObjectInterface {
  spec?: MachineDeploymentSpec;
  status?: MachineDeploymentStatusV1Beta2;
}

export type ClusterApiMachineDeployment =
  | ClusterApiMachineDeploymentV1Beta1
  | ClusterApiMachineDeploymentV1Beta2;

function isV1Beta2Status(
  status: MachineDeploymentStatusV1Beta1 | MachineDeploymentStatusV1Beta2
): status is MachineDeploymentStatusV1Beta2 {
  return 'upToDateReplicas' in status || 'deprecated' in status;
}

function isV1Beta1Status(
  status: MachineDeploymentStatusV1Beta1 | MachineDeploymentStatusV1Beta2
): status is MachineDeploymentStatusV1Beta1 {
  return !isV1Beta2Status(status);
}

export function getMachineDeploymentStatus(
  item: ClusterApiMachineDeployment | null | undefined
): MachineDeploymentStatusCommon | undefined {
  return item?.status;
}

export function getMachineDeploymentConditions(
  item: ClusterApiMachineDeployment | null | undefined
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

export function getMachineDeploymentFailure(
  item: ClusterApiMachineDeployment | null | undefined
): { failureReason?: string; failureMessage?: string } | undefined {
  const status = item?.status;
  if (!status) return undefined;

  if (isV1Beta1Status(status)) {
    if (status.failureReason || status.failureMessage) {
      return {
        failureReason: status.failureReason,
        failureMessage: status.failureMessage,
      };
    }
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

export function getMachineDeploymentUpToDateReplicas(
  item: ClusterApiMachineDeployment | null | undefined
): number | undefined {
  const status = item?.status;
  if (!status) return undefined;

  if (isV1Beta2Status(status)) {
    return status.upToDateReplicas;
  }

  return status.v1beta2?.upToDateReplicas;
}

/**
 * MachineDeployment is the KubeObject implementation for the Cluster API MachineDeployment resource.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#machinedeployment
 */
export class MachineDeployment extends KubeObject<ClusterApiMachineDeployment> {
  static readonly apiName = 'machinedeployments';
  static apiVersion = `${MACHINEDEPLOYMENT_API_GROUP}/v1beta1`;
  static readonly crdName = MACHINEDEPLOYMENT_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'MachineDeployment';

  /**
   * Returns the route for the machine deployment details page.
   */
  static get detailsRoute() {
    return '/cluster-api/machinedeployments/:namespace/:name';
  }

  /**
   * Returns a version of the MachineDeployment class with a specific API version.
   */
  static withApiVersion(version: string): typeof MachineDeployment {
    const versionedClass = class extends MachineDeployment {} as typeof MachineDeployment;
    versionedClass.apiVersion = `${MACHINEDEPLOYMENT_API_GROUP}/${version}`;
    return versionedClass;
  }

  /**
   * Returns the machine deployment specification.
   */
  get spec(): MachineDeploymentSpec | undefined {
    return this.jsonData.spec;
  }

  /**
   * Returns the raw status object.
   */
  get status(): MachineDeploymentStatusCommon | undefined {
    return getMachineDeploymentStatus(this.jsonData);
  }

  /**
   * Returns normalized conditions for the machine deployment.
   */
  get conditions(): MetaV1Condition[] | ClusterV1Condition[] | undefined {
    return getMachineDeploymentConditions(this.jsonData);
  }

  /**
   * Returns failure information if present.
   */
  get failure(): { failureReason?: string; failureMessage?: string } | undefined {
    return getMachineDeploymentFailure(this.jsonData);
  }

  /**
   * Returns the number of updated replicas.
   */
  get upToDateReplicas(): number | undefined {
    return getMachineDeploymentUpToDateReplicas(this.jsonData);
  }

  /**
   * Indicates if the resource is scalable.
   */
  static get isScalable() {
    return true;
  }
}
