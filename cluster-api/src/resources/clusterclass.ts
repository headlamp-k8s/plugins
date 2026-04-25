import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import {
  ClusterV1Condition,
  DeletionTimeoutsV1Beta1,
  DeletionTimeoutsV1Beta2,
  KubeReference,
  MetaV1Condition,
  ObjectMeta,
  ReadinessGate,
} from './common';

const CLUSTERCLASS_API_GROUP = 'cluster.x-k8s.io';
const CLUSTERCLASS_CRD_NAME = 'clusterclasses.cluster.x-k8s.io';

/**
 * LocalObjectTemplate is a reference to a local resource template.
 */
export interface LocalObjectTemplate extends KubeReference {
  apiVersion: string;
  kind: string;
  name: string;
  /**
   * Namespace of the referent.
   * @deprecated v1beta2 removes namespace from object references to be GitOps-friendly.
   */
  namespace?: string;
}

/**
 * TemplateRefWrapper unifies how template references are wrapped across API versions.
 * v1beta2 uses `templateRef`; v1beta1 uses `ref`.
 */
export interface TemplateRefWrapper {
  templateRef?: LocalObjectTemplate; // v1beta2
  ref?: LocalObjectTemplate; // v1beta1
}

export type TemplateOrReference = LocalObjectTemplate | TemplateRefWrapper;

export function isTemplateRefWrapper(
  value: TemplateOrReference | LocalObjectTemplate | null | undefined
): value is TemplateRefWrapper {
  return !!value && typeof value === 'object' && ('templateRef' in value || 'ref' in value);
}

export function extractTemplateRef(
  value: TemplateOrReference | LocalObjectTemplate | null | undefined
): LocalObjectTemplate | undefined {
  if (!value) return undefined;
  if (isTemplateRefWrapper(value)) return value.templateRef || value.ref;
  return value as LocalObjectTemplate;
}

/**
 * Unhealthy condition (v1beta1).
 * Duration is a human-readable string, e.g. "5m".
 */
export interface UnhealthyConditionV1Beta1 {
  type: string;
  status: string;
  timeout?: string;
}

/**
 * Unhealthy condition (v1beta2).
 * Duration is expressed in seconds — all Duration fields were renamed with the
 * `Seconds` suffix in v1beta2 per the CAPI API conventions.
 * @see https://main.cluster-api.sigs.k8s.io/developer/providers/migrations/v1.10-to-v1.11
 */
export interface UnhealthyConditionV1Beta2 {
  type: string;
  status: string;
  timeoutSeconds?: number;
}

/**
 * Health check configuration for a machine class (v1beta1).
 */
export interface MachineHealthCheckClassV1Beta1 {
  nodeStartupTimeout?: string;
  unhealthyConditions?: UnhealthyConditionV1Beta1[];
  maxUnhealthy?: string;
  unhealthyRange?: string;
  remediationTemplate?: LocalObjectTemplate;
}

/**
 * Health check configuration for a machine class (v1beta2).
 *
 * Per CAPI docs this field exists on `controlPlane` and
 * `workers.machineDeployments[]` only. It is NOT present on
 * `workers.machinePools[]` in v1beta2.
 *
 * @see https://cluster-api.sigs.k8s.io/tasks/experimental-features/cluster-class/write-clusterclass
 */
export interface HealthCheckClassV1Beta2 {
  checks?: {
    nodeStartupTimeoutSeconds?: number;
    unhealthyNodeConditions?: UnhealthyConditionV1Beta2[];
    unhealthyMachineConditions?: UnhealthyConditionV1Beta2[];
  };
  remediation?: {
    triggerIf?: {
      unhealthyLessThanOrEqualTo?: string;
      unhealthyInRange?: string;
    };
  };
}

export interface ControlPlaneClassV1Beta1 extends DeletionTimeoutsV1Beta1 {
  /** @deprecated use templateRef in v1beta2 */
  ref?: LocalObjectTemplate;
  templateRef?: LocalObjectTemplate;
  metadata?: ObjectMeta;
  /** @deprecated wrapped in TemplateRefWrapper in v1beta2 */
  machineInfrastructure?: LocalObjectTemplate;
  machineHealthCheck?: MachineHealthCheckClassV1Beta1;
  namingStrategy?: { template?: string };
  readinessGates?: ReadinessGate[];
}

export interface ControlPlaneClassV1Beta2 extends DeletionTimeoutsV1Beta2 {
  templateRef: LocalObjectTemplate;
  metadata?: ObjectMeta;
  machineInfrastructure?: TemplateRefWrapper;
  healthCheck?: HealthCheckClassV1Beta2;
  namingStrategy?: { template?: string };
  readinessGates?: ReadinessGate[];
}

export interface InfrastructureClassV1Beta1 {
  /** @deprecated use templateRef in v1beta2 */
  ref?: LocalObjectTemplate;
  templateRef?: LocalObjectTemplate;
}

export interface InfrastructureClassV1Beta2 {
  templateRef: LocalObjectTemplate;
}

export type InfrastructureClass = InfrastructureClassV1Beta1 | InfrastructureClassV1Beta2;
export type ControlPlaneClass = ControlPlaneClassV1Beta1 | ControlPlaneClassV1Beta2;

export interface MachineDeploymentClassV1Beta1 extends DeletionTimeoutsV1Beta1 {
  class: string;
  template: {
    metadata?: ObjectMeta;
    bootstrap?: TemplateOrReference;
    infrastructure?: TemplateOrReference;
  };
  machineHealthCheck?: MachineHealthCheckClassV1Beta1;
  failureDomain?: string;
  namingStrategy?: { template?: string };
  minReadySeconds?: number;
  readinessGates?: ReadinessGate[];
}

export interface MachineDeploymentClassV1Beta2 extends DeletionTimeoutsV1Beta2 {
  class: string;
  template?: { metadata?: ObjectMeta };
  bootstrap?: TemplateRefWrapper;
  infrastructure?: TemplateRefWrapper;
  healthCheck?: HealthCheckClassV1Beta2;
  failureDomain?: string;
  namingStrategy?: { template?: string };
  minReadySeconds?: number;
  readinessGates?: ReadinessGate[];
}

export interface MachinePoolClassV1Beta1 extends DeletionTimeoutsV1Beta1 {
  class: string;
  template: {
    metadata?: ObjectMeta;
    bootstrap?: TemplateOrReference;
    infrastructure?: TemplateOrReference;
  };
  machineHealthCheck?: MachineHealthCheckClassV1Beta1;
  failureDomains?: string[];
  namingStrategy?: { template?: string };
  minReadySeconds?: number;
}

export interface MachinePoolClassV1Beta2 extends DeletionTimeoutsV1Beta2 {
  class: string;
  template?: { metadata?: ObjectMeta };
  bootstrap?: TemplateRefWrapper;
  infrastructure?: TemplateRefWrapper;
  // healthCheck is intentionally absent — CAPI v1beta2 does not define
  // health checks for workers.machinePools[].
  failureDomains?: string[];
  namingStrategy?: { template?: string };
  minReadySeconds?: number;
}

export interface WorkersClassV1Beta1 {
  machineDeployments?: MachineDeploymentClassV1Beta1[];
  machinePools?: MachinePoolClassV1Beta1[];
}

export interface WorkersClassV1Beta2 {
  machineDeployments?: MachineDeploymentClassV1Beta2[];
  machinePools?: MachinePoolClassV1Beta2[];
}

export type MachineDeploymentClass = MachineDeploymentClassV1Beta1 | MachineDeploymentClassV1Beta2;
export type MachinePoolClass = MachinePoolClassV1Beta1 | MachinePoolClassV1Beta2;
export type WorkerClass = MachineDeploymentClass | MachinePoolClass;

export type TemplateSource =
  | WorkerClass
  | InfrastructureClassV1Beta1
  | InfrastructureClassV1Beta2
  | ControlPlaneClassV1Beta1
  | ControlPlaneClassV1Beta2;

export function getTemplateReference(
  obj: TemplateSource | TemplateOrReference | null | undefined,
  key?: string
): LocalObjectTemplate | undefined {
  if (!obj) return undefined;
  if (key) {
    const container = obj as Record<string, unknown>;
    const template = container.template as Record<string, unknown> | undefined;
    const val = container[key] || template?.[key];
    if (val) return extractTemplateRef(val as TemplateOrReference);
  } else {
    return extractTemplateRef(obj as TemplateOrReference);
  }
  return undefined;
}

export function getWorkerBootstrap(row: WorkerClass): LocalObjectTemplate | undefined {
  return getTemplateReference(row, 'bootstrap');
}

export function getWorkerInfrastructure(row: WorkerClass): LocalObjectTemplate | undefined {
  return getTemplateReference(row, 'infrastructure');
}

/**
 * Extracts normalised health check props from a worker class.
 *
 * - v1beta2 MachineDeployment: `healthCheck` (HealthCheckClassV1Beta2)
 * - v1beta1 MachineDeployment/MachinePool: `machineHealthCheck` (MachineHealthCheckClassV1Beta1)
 * - v1beta2 MachinePool: neither (not defined in the spec)
 */
export function getWorkerHealthChecks(row: WorkerClass) {
  return {
    healthCheck:
      'healthCheck' in row ? (row as MachineDeploymentClassV1Beta2).healthCheck : undefined,
    machineHealthCheck:
      'machineHealthCheck' in row
        ? (row as MachineDeploymentClassV1Beta1).machineHealthCheck
        : undefined,
  };
}

/**
 * Extracts normalised health check props from a control plane class.
 *
 * - v1beta2: `healthCheck` (HealthCheckClassV1Beta2)
 * - v1beta1: `machineHealthCheck` (MachineHealthCheckClassV1Beta1)
 */
export function getControlPlaneHealthChecks(cp: ControlPlaneClass | null | undefined) {
  if (!cp) return { healthCheck: undefined, machineHealthCheck: undefined };
  return {
    healthCheck: 'healthCheck' in cp ? (cp as ControlPlaneClassV1Beta2).healthCheck : undefined,
    machineHealthCheck:
      'machineHealthCheck' in cp ? (cp as ControlPlaneClassV1Beta1).machineHealthCheck : undefined,
  };
}

export interface ClusterClassVariableSchema {
  openAPIV3Schema: {
    type?: string;
    default?: unknown;
    description?: string;
    [key: string]: unknown;
  };
}

export interface ClusterClassVariable {
  name: string;
  required: boolean;
  schema: ClusterClassVariableSchema;
  metadata?: {
    labels?: Record<string, string>;
    annotations?: Record<string, string>;
  };
}

export interface JSONPatch {
  op: 'add' | 'replace' | 'remove';
  path: string;
  value?: unknown;
  valueFrom?: { variable?: string; template?: string };
}

export interface PatchDefinition {
  selector: {
    apiVersion: string;
    kind: string;
    matchResources: {
      controlPlane?: boolean;
      infrastructureCluster?: boolean;
      machineDeploymentClass?: { names?: string[] };
      machinePoolClass?: { names?: string[] };
    };
  };
  jsonPatches: JSONPatch[];
}

export interface ExternalPatchDefinition {
  generateExtension?: string;
  validateExtension?: string;
  discoverVariableExtension?: string;
  settings?: Record<string, string>;
}

export interface ClusterClassPatch {
  name: string;
  description?: string;
  /** @deprecated renamed to enabledIf in v1beta2 */
  enableIf?: string;
  /** CEL expression — v1beta2 rename of enableIf */
  enabledIf?: string;
  definitions?: PatchDefinition[];
  external?: ExternalPatchDefinition[];
}

export interface ClusterClassStatusVariable {
  name: string;
  definitionsConflict: boolean;
  definitions?: Array<{
    from: string;
    required: boolean;
    schema: ClusterClassVariableSchema;
  }>;
}

/**
 * ClusterClass status (v1beta1).
 *
 * `v1beta2` sub-object is a Phase-1 preview of coming metav1.Condition fields
 * backported into v1beta1. Its presence does NOT indicate the object is v1beta2.
 */
export interface ClusterClassStatusV1Beta1 {
  observedGeneration?: number;
  variables?: ClusterClassStatusVariable[];
  conditions?: ClusterV1Condition[];
  v1beta2?: { conditions?: MetaV1Condition[] };
}

/**
 * ClusterClass status (v1beta2).
 *
 * The `deprecated` key is the canonical discriminator — identical to how
 * MachinePool and all other CAPI resources signal v1beta2 status (Phase 2).
 */
export interface ClusterClassStatusV1Beta2 {
  observedGeneration?: number;
  variables?: ClusterClassStatusVariable[];
  conditions?: MetaV1Condition[];
  /**
   * Deprecated fields kept for down-conversion.
   * Presence of this key is the canonical discriminator for v1beta2 objects.
   */
  deprecated?: { v1beta1?: { conditions?: ClusterV1Condition[] } };
}

export interface ClusterClassSpecV1Beta1 {
  availabilityGates?: ReadinessGate[];
  infrastructure?: InfrastructureClassV1Beta1;
  /** @deprecated use infrastructure.namingStrategy in v1beta2 */
  infrastructureNamingStrategy?: { template?: string };
  controlPlane?: ControlPlaneClassV1Beta1;
  workers?: WorkersClassV1Beta1;
  variables?: ClusterClassVariable[];
  patches?: ClusterClassPatch[];
}

export interface ClusterClassSpecV1Beta2 {
  availabilityGates?: ReadinessGate[];
  infrastructure?: InfrastructureClassV1Beta2;
  controlPlane?: ControlPlaneClassV1Beta2;
  workers?: WorkersClassV1Beta2;
  variables?: ClusterClassVariable[];
  patches?: ClusterClassPatch[];
}

export interface ClusterApiClusterClassV1Beta1 extends KubeObjectInterface {
  spec?: ClusterClassSpecV1Beta1;
  status?: ClusterClassStatusV1Beta1;
}

export interface ClusterApiClusterClassV1Beta2 extends KubeObjectInterface {
  spec?: ClusterClassSpecV1Beta2;
  status?: ClusterClassStatusV1Beta2;
}

export type ClusterApiClusterClass = ClusterApiClusterClassV1Beta1 | ClusterApiClusterClassV1Beta2;

/**
 * Returns true when the status belongs to a v1beta2 ClusterClass.
 *
 * Uses the `deprecated` key sentinel — same pattern applied to every CAPI
 * resource in the v1beta2 status migration.
 */
function isV1Beta2ClusterClassStatus(
  status: ClusterClassStatusV1Beta1 | ClusterClassStatusV1Beta2
): status is ClusterClassStatusV1Beta2 {
  return 'deprecated' in status;
}

/**
 * Returns normalised conditions for a ClusterClass.
 *
 * Resolution order:
 *   1. v1beta2 → status.conditions           (MetaV1Condition[])
 *   2. v1beta1 → status.v1beta2.conditions   (MetaV1Condition[], Phase-1 preview)
 *   3. v1beta1 → status.conditions           (ClusterV1Condition[])
 */
export function getClusterClassConditions(
  item: ClusterApiClusterClass | null | undefined
): MetaV1Condition[] | ClusterV1Condition[] | undefined {
  const status = item?.status;
  if (!status) return undefined;
  if (isV1Beta2ClusterClassStatus(status)) return status.conditions;
  if (status.v1beta2?.conditions?.length) return status.v1beta2.conditions;
  return status.conditions;
}

export function getClusterClassInfrastructureRef(
  item: ClusterApiClusterClass | null | undefined
): LocalObjectTemplate | undefined {
  return getTemplateReference(item?.spec?.infrastructure);
}

export function getClusterClassControlPlaneRef(
  item: ClusterApiClusterClass | null | undefined
): LocalObjectTemplate | undefined {
  return getTemplateReference(item?.spec?.controlPlane);
}

export function getClusterClassControlPlaneMachineInfraRef(
  item: ClusterApiClusterClass | null | undefined
): LocalObjectTemplate | undefined {
  return getTemplateReference(item?.spec?.controlPlane, 'machineInfrastructure');
}

/**
 * ClusterClass KubeObject implementation.
 * @see https://cluster-api.sigs.k8s.io/tasks/experimental-features/cluster-class/
 */
export class ClusterClass extends KubeObject<ClusterApiClusterClass> {
  static readonly apiName = 'clusterclasses';
  static apiVersion = `${CLUSTERCLASS_API_GROUP}/v1beta1`;
  static readonly isNamespaced = true;
  static readonly kind = 'ClusterClass';
  static readonly crdName = CLUSTERCLASS_CRD_NAME;

  static get detailsRoute() {
    return '/cluster-api/clusterclasses/:namespace/:name';
  }

  static withApiVersion(version: string): typeof ClusterClass {
    const versionedClass = class extends ClusterClass {} as typeof ClusterClass;
    versionedClass.apiVersion = `${CLUSTERCLASS_API_GROUP}/${version}`;
    return versionedClass;
  }

  get spec(): ClusterClassSpecV1Beta1 | ClusterClassSpecV1Beta2 | undefined {
    return this.jsonData.spec;
  }

  get status(): ClusterClassStatusV1Beta1 | ClusterClassStatusV1Beta2 | undefined {
    return this.jsonData.status;
  }

  get conditions(): MetaV1Condition[] | ClusterV1Condition[] | undefined {
    return getClusterClassConditions(this.jsonData);
  }

  get infrastructureRef(): LocalObjectTemplate | undefined {
    return getClusterClassInfrastructureRef(this.jsonData);
  }

  get controlPlaneRef(): LocalObjectTemplate | undefined {
    return getClusterClassControlPlaneRef(this.jsonData);
  }

  get controlPlaneMachineInfraRef(): LocalObjectTemplate | undefined {
    return getClusterClassControlPlaneMachineInfraRef(this.jsonData);
  }
}
