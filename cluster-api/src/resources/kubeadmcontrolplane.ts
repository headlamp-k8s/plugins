import { KubeObject, KubeObjectInterface, Time } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ClusterV1Condition, KubeReference, MetaV1Condition, ObjectMeta } from './common';
import { KubeadmConfigSpec } from './kubeadmconfig';
import { MachineTemplateSpec } from './machineset';

const KCP_API_GROUP = 'controlplane.cluster.x-k8s.io';
const KCP_CRD_NAME = 'kubeadmcontrolplanes.controlplane.cluster.x-k8s.io';

interface Strategy {
  type?: string;
  rollingUpdate?: {
    maxSurge?: number | string;
  };
}

export interface KCPMachineTemplateV1Beta1 {
  metadata?: ObjectMeta;
  infrastructureRef?: KubeReference;
  nodeDrainTimeout?: string;
  nodeVolumeDetachTimeout?: string;
  nodeDeletionTimeout?: string;
}
export type KCPMachineTemplateV1Beta2 = MachineTemplateSpec;
/**
 * KubeadmControlPlane resource specification.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#kcp
 */
export interface KCPSpec {
  replicas?: number;
  version: string;
  machineTemplate?: KCPMachineTemplateV1Beta1 | KCPMachineTemplateV1Beta2;
  rolloutStrategy?: Strategy;
  rollout?: {
    before?: { certificateExpiryDays?: number };
    after?: Time;
    strategy?: Strategy;
  };

  strategy?: Strategy; // v1beta1 only
  kubeadmConfigSpec?: KubeadmConfigSpec;
  remediationStrategy?: {
    maxRetry?: number;
    retryPeriod?: string | number;
    minHealthyPeriod?: string | number;
  };

  remediation?: {
    maxRetry?: number;
    retryPeriodSeconds?: number;
    minHealthyPeriodSeconds?: number;
  };

  machineNaming?: {
    template?: string;
  };
}

/**
 * Common status fields across KCP versions.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#kcp
 */
/**
 * Common status fields for KubeadmControlPlane resources.
 * Used by both v1beta1 and v1beta2 API versions.
 */
export interface KCPStatusCommon {
  selector?: string;
  replicas?: number;
  readyReplicas?: number;
  observedGeneration?: bigint;
  lastRemediation?: {
    machine: string;
    time: Time;
    retryCount: number;
  };
}

/**
 * Status fields for KubeadmControlPlane v1beta1 API version.
 */
export interface KCPStatusV1Beta1 extends KCPStatusCommon {
  conditions?: ClusterV1Condition[];
  updatedReplicas?: number;
  unavailableReplicas?: number;
  initialized?: boolean;
  ready?: boolean;
  failureReason?: string;
  failureMessage?: string;

  lastRemediationStatus?: {
    machine: string;
    lastRemediatedTime: Time;
    retryCount: number;
  };

  v1beta2?: {
    conditions?: MetaV1Condition[];
    readyReplicas?: number;
    availableReplicas?: number;
    upToDateReplicas?: number;
  };
}

/**
 * Status fields for KubeadmControlPlane v1beta2 API version.
 */
export interface KCPStatusV1Beta2 extends KCPStatusCommon {
  conditions?: MetaV1Condition[];
  upToDateReplicas?: number;
  availableReplicas?: number;
  version?: string;

  initialization?: {
    controlPlaneInitialized?: boolean;
  };

  lastRemediation?: {
    machine: string;
    time: Time;
    retryCount: number;
  };

  deprecated?: {
    v1beta1?: {
      failureReason?: string;
      failureMessage?: string;
      unavailableReplicas?: number;
    };
  };
}

/**
 * Union type for KubeadmControlPlane resources supporting both v1beta1 and v1beta2 status.
 */
export type ClusterApiKubeadmControlPlane =
  | (KubeObjectInterface & { spec?: KCPSpec; status?: KCPStatusV1Beta1 })
  | (KubeObjectInterface & { spec?: KCPSpec; status?: KCPStatusV1Beta2 });

/**
 * Normalized status fields for KubeadmControlPlane, abstracting API version differences.
 */
interface NormalizedKCPStatus {
  conditions?: ClusterV1Condition[] | MetaV1Condition[];
  failure?: { failureReason?: string; failureMessage?: string };
  initialized?: boolean;
  upToDateReplicas?: number;
  availableReplicas?: number;
  lastRemediation?: { machine: string; time: Time; retryCount: number };
}

/**
 * Type guard to check if status is v1beta2.
 * @param status KCPStatusV1Beta1 or KCPStatusV1Beta2
 * @returns True if status is v1beta2
 */
function isV1Beta2(status: KCPStatusV1Beta1 | KCPStatusV1Beta2): status is KCPStatusV1Beta2 {
  return !!status && ('deprecated' in status || 'initialization' in status);
}

/**
 * Normalizes KCP status fields across v1beta1 and v1beta2 API versions.
 *
 * @param item - The raw KCP resource interface.
 * @returns A normalized status object.
 */
/**
 * Normalizes KCP status fields across v1beta1 and v1beta2 API versions.
 * @param item The raw KCP resource interface.
 * @returns A normalized status object.
 */
function normalizeKCPStatus(
  item: ClusterApiKubeadmControlPlane | null | undefined
): NormalizedKCPStatus {
  const status = item?.status;
  if (!status) {
    return {};
  }

  if (isV1Beta2(status)) {
    const deprecated = status.deprecated?.v1beta1;
    const failure =
      deprecated?.failureReason || deprecated?.failureMessage
        ? {
            failureReason: deprecated?.failureReason,
            failureMessage: deprecated?.failureMessage,
          }
        : undefined;

    const normalized: NormalizedKCPStatus = {
      conditions: status.conditions,
      failure,
      initialized: status.initialization?.controlPlaneInitialized,
      upToDateReplicas: status.upToDateReplicas,
      availableReplicas: status.availableReplicas,
      lastRemediation: status.lastRemediation,
    };

    return normalized;
  }

  const failure =
    status.failureReason || status.failureMessage
      ? {
          failureReason: status.failureReason,
          failureMessage: status.failureMessage,
        }
      : undefined;

  const normalized: NormalizedKCPStatus = {
    conditions: status.v1beta2?.conditions?.length ? status.v1beta2.conditions : status.conditions,
    failure,
    initialized: status.initialized,
    upToDateReplicas: status.updatedReplicas,
    availableReplicas: status.v1beta2?.availableReplicas,
    lastRemediation: status.lastRemediationStatus
      ? {
          machine: status.lastRemediationStatus.machine,
          time: status.lastRemediationStatus.lastRemediatedTime,
          retryCount: status.lastRemediationStatus.retryCount,
        }
      : undefined,
  };

  return normalized;
}

/**
 * Returns the raw status object from a KCP resource.
 *
 * @param item - The KCP resource.
 */
export function getKCPStatus(item: ClusterApiKubeadmControlPlane | null | undefined) {
  return item?.status;
}

/**
 * Returns normalized conditions for a KCP resource.
 *
 * @param item - The KCP resource.
 */
export function getKCPConditions(item: ClusterApiKubeadmControlPlane | null | undefined) {
  const normalized = normalizeKCPStatus(item);
  return normalized.conditions;
}

/**
 * Returns failure information for a KCP resource.
 *
 * @param item - The KCP resource.
 */
export function getKCPFailure(item: ClusterApiKubeadmControlPlane | null | undefined) {
  const normalized = normalizeKCPStatus(item);
  return normalized.failure;
}

/**
 * Returns initialization status for a KCP resource.
 *
 * @param item - The KCP resource.
 */
export function getKCPInitialized(item: ClusterApiKubeadmControlPlane | null | undefined) {
  const normalized = normalizeKCPStatus(item);
  return normalized.initialized;
}

/**
 * Returns up-to-date replicas for a KCP resource.
 * @param item The KCP resource.
 * @returns Number of up-to-date replicas or undefined.
 */
export function getKCPUpToDateReplicas(item: ClusterApiKubeadmControlPlane | null | undefined) {
  const normalized = normalizeKCPStatus(item);
  return normalized.upToDateReplicas;
}

/**
 * Returns available replicas for a KCP resource.
 * @param item The KCP resource.
 * @returns Number of available replicas or undefined.
 */
export function getKCPAvailableReplicas(item: ClusterApiKubeadmControlPlane | null | undefined) {
  const normalized = normalizeKCPStatus(item);
  return normalized.availableReplicas;
}

/**
 * Returns last remediation info for a KCP resource.
 * @param item The KCP resource.
 * @returns Last remediation object or undefined.
 */
export function getKCPLastRemediation(item: ClusterApiKubeadmControlPlane | null | undefined) {
  const normalized = normalizeKCPStatus(item);
  return normalized.lastRemediation;
}

/**
 * Returns formatted deletion timeouts for a KCP resource.
 * Handles differences between v1beta1 (string) and v1beta2 (integer seconds).
 *
 * @param item - The KCP resource.
 */
/**
 * Returns formatted deletion timeouts for a KCP resource.
 * Handles differences between v1beta1 (string) and v1beta2 (integer seconds).
 * @param item The KCP resource.
 * @returns Object with nodeDrain, nodeVolumeDetach, and nodeDeletion timeouts, or undefined.
 */
export function getKCPDeletionTimeouts(item: ClusterApiKubeadmControlPlane | null | undefined) {
  const mt = item?.spec?.machineTemplate;
  if (!mt) return undefined;

  const mtV2 = mt as KCPMachineTemplateV1Beta2;
  if (mtV2.spec?.deletion) {
    const d = mtV2.spec.deletion;
    return {
      nodeDrain:
        d.nodeDrainTimeoutSeconds !== undefined ? `${d.nodeDrainTimeoutSeconds}s` : undefined,
      nodeVolumeDetach:
        d.nodeVolumeDetachTimeoutSeconds !== undefined
          ? `${d.nodeVolumeDetachTimeoutSeconds}s`
          : undefined,
      nodeDeletion:
        d.nodeDeletionTimeoutSeconds !== undefined ? `${d.nodeDeletionTimeoutSeconds}s` : undefined,
    };
  }
  if (
    mtV2.spec?.nodeDrainTimeout !== undefined ||
    mtV2.spec?.nodeVolumeDetachTimeout !== undefined
  ) {
    return {
      nodeDrain: mtV2.spec?.nodeDrainTimeout?.toString(),
      nodeVolumeDetach: mtV2.spec?.nodeVolumeDetachTimeout?.toString(),
      nodeDeletion: mtV2.spec?.nodeDeletionTimeout?.toString(),
    };
  }

  const mtV1 = mt as KCPMachineTemplateV1Beta1;
  if (mtV1.nodeDrainTimeout || mtV1.nodeVolumeDetachTimeout || mtV1.nodeDeletionTimeout) {
    return {
      nodeDrain: mtV1.nodeDrainTimeout,
      nodeVolumeDetach: mtV1.nodeVolumeDetachTimeout,
      nodeDeletion: mtV1.nodeDeletionTimeout,
    };
  }
  return undefined;
}

/**
 * KubeObject wrapper for KubeadmControlPlane resources.
 * Provides typed accessors and static helpers.
 */
export class KubeadmControlPlane extends KubeObject<ClusterApiKubeadmControlPlane> {
  static readonly apiName = 'kubeadmcontrolplanes';
  static apiVersion = `${KCP_API_GROUP}/v1beta1`;
  static readonly crdName = KCP_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'KubeadmControlPlane';

  static get detailsRoute() {
    return '/cluster-api/kubeadmcontrolplanes/:namespace/:name';
  }

  static withApiVersion(version: string): typeof KubeadmControlPlane {
    const versionedClass = class extends KubeadmControlPlane {} as typeof KubeadmControlPlane;
    versionedClass.apiVersion = `${KCP_API_GROUP}/${version}`;
    return versionedClass;
  }

  get spec(): KCPSpec | undefined {
    return this.jsonData.spec;
  }

  get status(): KCPStatusCommon | undefined {
    return getKCPStatus(this.jsonData);
  }

  private get _normalized() {
    return normalizeKCPStatus(this.jsonData);
  }

  get conditions() {
    return this._normalized.conditions;
  }

  get failure() {
    return this._normalized.failure;
  }

  get initialized() {
    return this._normalized.initialized;
  }

  get upToDateReplicas() {
    return this._normalized.upToDateReplicas;
  }

  get availableReplicas() {
    return this._normalized.availableReplicas;
  }

  get lastRemediation() {
    return this._normalized.lastRemediation;
  }

  get deletionTimeouts() {
    return getKCPDeletionTimeouts(this.jsonData);
  }

  static get isScalable() {
    return true;
  }
}
