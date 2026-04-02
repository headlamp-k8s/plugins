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

/**
 * MachinePool status (v1beta1).
 *
 * The `v1beta2` sub-object is a *preview* of coming fields backported into
 * v1beta1 (Phase 1 of the status migration). It is NOT a discriminator for the
 * API version of the object itself.
 *
 * @see https://cluster-api.sigs.k8s.io/tasks/experimental-features/machine-pools
 * @see https://pkg.go.dev/sigs.k8s.io/cluster-api/exp/api/v1beta1#MachinePoolStatus
 */
export interface MachinePoolStatusV1Beta1 {
  observedGeneration?: number;
  replicas?: number;
  /** @deprecated in v1beta2 — use readyReplicas at the top level */
  readyReplicas?: number;
  /** @deprecated in v1beta2 — use availableReplicas at the top level */
  availableReplicas?: number;
  /** @deprecated removed in v1beta2 */
  unavailableReplicas?: number;
  phase?: string;
  /** @deprecated in v1beta2 — use initialization.bootstrapDataSecretCreated */
  bootstrapReady?: boolean;
  /** @deprecated in v1beta2 — use initialization.infrastructureProvisioned */
  infrastructureReady?: boolean;
  /** @deprecated removed in v1beta2 */
  failureReason?: string;
  /** @deprecated removed in v1beta2 */
  failureMessage?: string;
  nodeRefs?: NodeReference[];
  /** ClusterV1 (custom CAPI) conditions — v1beta1 only */
  conditions?: ClusterV1Condition[];
  /**
   * Preview of v1beta2 fields backported into v1beta1 (Phase 1).
   * These are promoted to top-level in the real v1beta2 type.
   */
  v1beta2?: {
    conditions?: MetaV1Condition[];
    readyReplicas?: number;
    availableReplicas?: number;
    upToDateReplicas?: number;
  };
}
/**
 * MachinePool status (v1beta2).
 *
 * The discriminating marker is the presence of the `deprecated` key, which is
 * defined *exclusively* on v1beta2 objects (Phase 2 of the migration).
 *
 * Do NOT rely on `initialization` as a discriminator — it is optional and will
 * be absent on a freshly-created pool, making it an unreliable sentinel.
 *
 * @see https://cluster-api.sigs.k8s.io/tasks/experimental-features/machine-pools
 */
export interface MachinePoolStatusV1Beta2 {
  observedGeneration?: number;
  replicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
  upToDateReplicas?: number;
  phase?: string;
  nodeRefs?: NodeReference[];
  /** metav1.Condition list — promoted to top-level in v1beta2 */
  conditions?: MetaV1Condition[];
  initialization?: MachinePoolInitialization;
  /**
   * Deprecated fields kept for down-conversion and transition support.
   * Presence of this key is the canonical discriminator for v1beta2 objects.
   */
  deprecated?: {
    v1beta1?: {
      conditions?: ClusterV1Condition[];
      /** @deprecated terminal failures are now surfaced via conditions */
      failureReason?: string;
      /** @deprecated terminal failures are now surfaced via conditions */
      failureMessage?: string;
      readyReplicas?: number;
      availableReplicas?: number;
      unavailableReplicas?: number;
    };
  };
}

export interface MachinePoolSpec {
  /** ClusterName is the name of the Cluster this object belongs to. */
  clusterName: string;
  /** Replicas is the number of desired replicas. Defaults to 1. */
  replicas?: number;
  /** Template describes the machines that will be created. */
  template: MachineTemplateSpec;
  /** MinReadySeconds is the minimum number of seconds for which a newly created machine should be ready. Defaults to 0. */
  minReadySeconds?: number;
  /** ProviderIDList are the provider IDs of the instances in the machine pool. */
  providerIDList?: string[];
  /** FailureDomains are the failure domains of the machines in the pool. */
  failureDomains?: string[];
}

export interface ClusterApiMachinePool extends KubeObjectInterface {
  spec: MachinePoolSpec;
  status?: MachinePoolStatusV1Beta1 | MachinePoolStatusV1Beta2;
}

/**
 * Returns true when the status object belongs to a v1beta2 MachinePool.
 *
 * The ONLY reliable discriminator is the `deprecated` key — it is present on
 * every v1beta2 status object (even if the inner struct is empty) and is never
 * present on a v1beta1 object.
 *
 * `'initialization' in status` is intentionally NOT used here because
 * `initialization` is optional and will be absent on a freshly-created pool,
 * giving a false-negative result.
 */
function isV1Beta2Status(
  status: MachinePoolStatusV1Beta1 | MachinePoolStatusV1Beta2
): status is MachinePoolStatusV1Beta2 {
  return 'deprecated' in status;
}

/**
 * Returns normalised conditions for a MachinePool, preferring
 * metav1.Condition (v1beta2) over ClusterV1Condition (v1beta1).
 *
 * Resolution order:
 *   1. v1beta2 → status.conditions            (MetaV1Condition[])
 *   2. v1beta1 → status.v1beta2.conditions    (MetaV1Condition[], Phase-1 preview)
 *   3. v1beta1 → status.conditions            (ClusterV1Condition[])
 */
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

/**
 * Returns the number of up-to-date replicas for a MachinePool.
 *
 * Resolution order:
 *   1. v1beta2 → status.upToDateReplicas
 *   2. v1beta1 → status.v1beta2.upToDateReplicas  (Phase-1 preview)
 */
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

/**
 * Returns the normalised initialisation status for a MachinePool.
 *
 * - v1beta2: reads the dedicated `initialization` struct.
 * - v1beta1: synthesises the same shape from the legacy boolean fields
 *   `bootstrapReady` / `infrastructureReady`.
 */
export function getMachinePoolInitialization(
  item: ClusterApiMachinePool | null | undefined
): MachinePoolInitialization | undefined {
  const status = item?.status;
  if (!status) return undefined;

  if (isV1Beta2Status(status)) {
    return status.initialization;
  }
  return {
    bootstrapDataSecretCreated: status.bootstrapReady,
    infrastructureProvisioned: status.infrastructureReady,
  };
}

/**
 * MachinePool is the KubeObject implementation for the Cluster API MachinePool resource.
 * @see https://cluster-api.sigs.k8s.io/tasks/experimental-features/machine-pools
 */
export class MachinePool extends KubeObject<ClusterApiMachinePool> {
  static readonly apiName = 'machinepools';
  static apiVersion = `${MACHINEPOOL_API_GROUP}/v1beta1`;
  static readonly crdName = MACHINEPOOL_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'MachinePool';

  /** Indicates if the resource is scalable. */
  static get isScalable() {
    return true;
  }

  /** Returns the route for the machine pool details page. */
  static get detailsRoute() {
    return '/cluster-api/machinepools/:namespace/:name';
  }

  /** Returns a version of the MachinePool class with a specific API version. */
  static withApiVersion(version: string): typeof MachinePool {
    const versionedClass = class extends MachinePool {} as typeof MachinePool;
    versionedClass.apiVersion = `${MACHINEPOOL_API_GROUP}/${version}`;
    return versionedClass;
  }

  /** Returns the machine pool specification. */
  get spec(): MachinePoolSpec {
    return this.jsonData.spec;
  }

  /** Returns the raw status object. */
  get status(): MachinePoolStatusV1Beta1 | MachinePoolStatusV1Beta2 | undefined {
    return this.jsonData.status;
  }

  /** Returns normalised conditions for the machine pool. */
  get conditions(): MetaV1Condition[] | ClusterV1Condition[] | undefined {
    return getMachinePoolConditions(this.jsonData);
  }

  /** Returns the number of up-to-date replicas. */
  get upToDateReplicas(): number | undefined {
    return getMachinePoolUpToDateReplicas(this.jsonData);
  }

  /** Returns the initialisation status. */
  get initialization(): MachinePoolInitialization | undefined {
    return getMachinePoolInitialization(this.jsonData);
  }
}
