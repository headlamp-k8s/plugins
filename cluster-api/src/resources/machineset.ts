import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ClusterV1Condition, LabelSelector, MetaV1Condition, ObjectMeta } from './common';
import { MachineSpec } from './machine';

const MACHINESET_API_GROUP = 'cluster.x-k8s.io';
const MACHINESET_CRD_NAME = 'machinesets.cluster.x-k8s.io';

export interface MachineTemplateSpec {
  metadata?: ObjectMeta;
  spec: MachineSpec;
}

/**
 * MachineSet resource specification.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#machineset
 */
export interface MachineSetSpec {
  /** ClusterName is the name of the Cluster this object belongs to. */
  clusterName: string;
  /** Replicas is the number of desired replicas. Defaults to 1. */
  replicas?: number;
  /** MinReadySeconds is the minimum number of seconds for which a newly created machine should be ready. Defaults to 0. */
  minReadySeconds?: number;
  /** Selector is a label query over machines that should match the replica count. */
  selector: LabelSelector;
  /** Template is the object that describes the machine that will be created. */
  template: MachineTemplateSpec;
  /** MachineNamingStrategy allows to configure how machines are named. */
  machineNamingStrategy?: {
    template?: string;
  };
  /** @deprecated use deletion.order instead. */
  deletePolicy?: 'Random' | 'Newest' | 'Oldest';
  /** Deletion configuration (v1beta2). */
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

export interface MachineSetStatusV1Beta2Nested {
  conditions?: MetaV1Condition[];
  readyReplicas?: number;
  upToDateReplicas?: number;
}

export interface MachineSetStatusDeprecatedV1Beta1 {
  conditions?: ClusterV1Condition[];
  failureReason?: string;
  failureMessage?: string;
}

/**
 * Common status fields across MachineSet versions.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#machineset
 */
export interface MachineSetStatusCommon {
  /** Selector is the same as the match labels of the selector in the spec. */
  selector?: string;
  /** Total number of non-terminated machines targeted by this MachineSet. */
  replicas?: number;
  /** Total number of ready machines targeted by this MachineSet. */
  readyReplicas?: number;
  /** Total number of available machines targeted by this MachineSet. */
  availableReplicas?: number;
  /** The generation observed by the MachineSet controller. */
  observedGeneration?: number;
}

export interface MachineSetStatusV1Beta1 extends MachineSetStatusCommon {
  // v1beta1 MachineSet status
  conditions?: ClusterV1Condition[];
  fullyLabeledReplicas?: number;
  failureReason?: string;
  failureMessage?: string;
  v1beta2?: MachineSetStatusV1Beta2Nested;
}

export interface MachineSetStatusV1Beta2 extends MachineSetStatusCommon {
  conditions?: MetaV1Condition[];
  upToDateReplicas?: number;
  deprecated?: {
    v1beta1?: MachineSetStatusDeprecatedV1Beta1;
  };
}

export interface ClusterApiMachineSetV1Beta1 extends KubeObjectInterface {
  spec: MachineSetSpec;
  status?: MachineSetStatusV1Beta1;
}

export interface ClusterApiMachineSetV1Beta2 extends KubeObjectInterface {
  spec: MachineSetSpec;
  status?: MachineSetStatusV1Beta2;
}

export type ClusterApiMachineSet = ClusterApiMachineSetV1Beta1 | ClusterApiMachineSetV1Beta2;

function isV1Beta2Status(
  status: MachineSetStatusV1Beta1 | MachineSetStatusV1Beta2
): status is MachineSetStatusV1Beta2 {
  return 'upToDateReplicas' in status || 'deprecated' in status;
}

function isV1Beta1Status(
  status: MachineSetStatusV1Beta1 | MachineSetStatusV1Beta2
): status is MachineSetStatusV1Beta1 {
  return !isV1Beta2Status(status);
}

export function getMachineSetStatus(
  item: ClusterApiMachineSet | null | undefined
): MachineSetStatusCommon | undefined {
  return item?.status ?? undefined;
}

export function getMachineSetConditions(
  item: ClusterApiMachineSet | null | undefined
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

export function getMachineSetFailure(
  item: ClusterApiMachineSet | null | undefined
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

export function getMachineSetUpToDateReplicas(
  item: ClusterApiMachineSet | null | undefined
): number | undefined {
  const status = item?.status;
  if (!status) return undefined;

  if (isV1Beta2Status(status)) {
    return status.upToDateReplicas;
  }

  return status.v1beta2?.upToDateReplicas;
}

/**
 * MachineSet is the KubeObject implementation for the Cluster API MachineSet resource.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#machineset
 */
export class MachineSet extends KubeObject<ClusterApiMachineSet> {
  static readonly apiName = 'machinesets';
  static apiVersion = `${MACHINESET_API_GROUP}/v1beta1`;
  static readonly crdName = MACHINESET_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'MachineSet';

  /**
   * Returns the route for the machine set details page.
   */
  static get detailsRoute() {
    return '/cluster-api/machinesets/:namespace/:name';
  }

  /**
   * Returns a version of the MachineSet class with a specific API version.
   */
  static withApiVersion(version: string): typeof MachineSet {
    const versionedClass = class extends MachineSet {} as typeof MachineSet;
    versionedClass.apiVersion = `${MACHINESET_API_GROUP}/${version}`;
    return versionedClass;
  }

  /**
   * Returns the machine set specification.
   */
  get spec(): MachineSetSpec {
    return this.jsonData.spec;
  }

  /**
   * Returns the raw status object.
   */
  get status(): MachineSetStatusCommon | undefined {
    return getMachineSetStatus(this.jsonData);
  }

  /**
   * Returns normalized conditions for the machine set.
   */
  get conditions(): MetaV1Condition[] | ClusterV1Condition[] | undefined {
    return getMachineSetConditions(this.jsonData);
  }

  /**
   * Returns failure information if present.
   */
  get failure(): { failureReason?: string; failureMessage?: string } | undefined {
    return getMachineSetFailure(this.jsonData);
  }

  /**
   * Returns the number of updated replicas.
   */
  get upToDateReplicas(): number | undefined {
    return getMachineSetUpToDateReplicas(this.jsonData);
  }

  /**
   * Indicates if the resource is scalable.
   */
  static get isScalable() {
    return true;
  }
}
