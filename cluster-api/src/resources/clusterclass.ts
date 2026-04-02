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

export interface LocalObjectTemplate extends KubeReference {
  apiVersion: string;
  kind: string;
  name: string;
  namespace?: string; // v1beta1 only
}

export interface TemplateRefWrapper {
  templateRef?: LocalObjectTemplate; // v1beta2 only — wraps all template refs
  ref?: LocalObjectTemplate; // v1beta1 style — occasionally used as a wrapper
}

export function isTemplateRefWrapper(
  value: TemplateOrReference | LocalObjectTemplate | null | undefined
): value is TemplateRefWrapper {
  return !!value && typeof value === 'object' && ('templateRef' in value || 'ref' in value);
}

export function extractTemplateRef(
  value: TemplateOrReference | LocalObjectTemplate | null | undefined
): LocalObjectTemplate | undefined {
  if (!value) return undefined;
  if (isTemplateRefWrapper(value)) {
    return value.templateRef || value.ref;
  }
  return value as LocalObjectTemplate;
}

export type TemplateOrReference = LocalObjectTemplate | TemplateRefWrapper;

export interface UnhealthyConditionV1Beta1 {
  type: string;
  status: string;
  timeout?: string; // v1beta1 only
}

export interface UnhealthyConditionV1Beta2 {
  type: string;
  status: string;
  timeoutSeconds?: number; // v1beta2 only — replaces timeout (string) from v1beta1
}

export interface MachineHealthCheckClassV1Beta1 {
  nodeStartupTimeout?: string; // v1beta1 only — duration string; replaced by nodeStartupTimeoutSeconds in v1beta2
  unhealthyConditions?: UnhealthyConditionV1Beta1[];
  maxUnhealthy?: string; // v1beta1 only — percentage or count string; removed in v1beta2
  unhealthyRange?: string; // v1beta1 only — range string e.g. "[0-2]"; removed in v1beta2
  remediationTemplate?: LocalObjectTemplate; // v1beta1 only — removed in v1beta2
}

export interface HealthCheckClassV1Beta2 {
  // v1beta2 only
  checks?: {
    nodeStartupTimeoutSeconds?: number; // v1beta2 only
    unhealthyNodeConditions?: UnhealthyConditionV1Beta2[];
    unhealthyMachineConditions?: UnhealthyConditionV1Beta2[]; // v1beta2 only
  };
  remediation?: {
    triggerIf?: {
      unhealthyLessThanOrEqualTo?: string; // v1beta2 only
      unhealthyInRange?: string; // v1beta2 only
    };
  };
}

// ─── Control plane class types ────────────────────────────────────────────────

export interface ControlPlaneClassV1Beta1 extends DeletionTimeoutsV1Beta1 {
  ref?: LocalObjectTemplate; // v1beta1 only
  templateRef?: LocalObjectTemplate; // v1beta1 only
  metadata?: ObjectMeta;
  machineInfrastructure?: LocalObjectTemplate; // v1beta1 only
  machineHealthCheck?: MachineHealthCheckClassV1Beta1; // v1beta1 only
  namingStrategy?: { template?: string };
  readinessGates?: ReadinessGate[];
}

export interface ControlPlaneClassV1Beta2 extends DeletionTimeoutsV1Beta2 {
  templateRef: LocalObjectTemplate; // v1beta2 only
  metadata?: ObjectMeta;
  machineInfrastructure?: TemplateRefWrapper; // v1beta2 only
  healthCheck?: HealthCheckClassV1Beta2; // v1beta2 only
  namingStrategy?: { template?: string };
  readinessGates?: ReadinessGate[];
}

export interface InfrastructureClassV1Beta1 {
  ref?: LocalObjectTemplate; // v1beta1 only
  templateRef?: LocalObjectTemplate; // v1beta1 only
}

export interface InfrastructureClassV1Beta2 {
  templateRef: LocalObjectTemplate; // v1beta2 only
}

export type InfrastructureClass = InfrastructureClassV1Beta1 | InfrastructureClassV1Beta2;
export type ControlPlaneClass = ControlPlaneClassV1Beta1 | ControlPlaneClassV1Beta2;

export interface MachineDeploymentClassV1Beta1 extends DeletionTimeoutsV1Beta1 {
  class: string;
  template: {
    // v1beta1 only
    metadata?: ObjectMeta;
    bootstrap?: TemplateOrReference;
    infrastructure?: TemplateOrReference;
  };
  machineHealthCheck?: MachineHealthCheckClassV1Beta1; // v1beta1
  failureDomain?: string;
  namingStrategy?: { template?: string };
  minReadySeconds?: number;
  readinessGates?: ReadinessGate[];
}

export interface MachineDeploymentClassV1Beta2 extends DeletionTimeoutsV1Beta2 {
  class: string;
  template?: { metadata?: ObjectMeta }; // v1beta2 only
  bootstrap?: TemplateRefWrapper; // v1beta2 only
  infrastructure?: TemplateRefWrapper; // v1beta2 only
  healthCheck?: HealthCheckClassV1Beta2; // v1beta2 only
  failureDomain?: string;
  namingStrategy?: { template?: string };
  minReadySeconds?: number;
  readinessGates?: ReadinessGate[];
}

export interface MachinePoolClassV1Beta1 extends DeletionTimeoutsV1Beta1 {
  class: string;
  template: {
    // v1beta1 only
    metadata?: ObjectMeta;
    bootstrap?: TemplateOrReference;
    infrastructure?: TemplateOrReference;
  };
  machineHealthCheck?: MachineHealthCheckClassV1Beta1; // v1beta1
  failureDomains?: string[];
  namingStrategy?: { template?: string };
  minReadySeconds?: number;
}

export interface MachinePoolClassV1Beta2 extends DeletionTimeoutsV1Beta2 {
  class: string;
  template?: { metadata?: ObjectMeta }; // v1beta2 only
  bootstrap?: TemplateRefWrapper; // v1beta2 only
  infrastructure?: TemplateRefWrapper; // v1beta2 only
  // Note: per CAPI docs, healthCheck is only defined for controlPlane and machineDeployments in v1beta2
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

export function getWorkerHealthChecks(row: WorkerClass) {
  return {
    // v1beta2
    healthCheck:
      'healthCheck' in row ? (row as MachineDeploymentClassV1Beta2).healthCheck : undefined,
    // v1beta1
    machineHealthCheck:
      'machineHealthCheck' in row
        ? (row as MachineDeploymentClassV1Beta1).machineHealthCheck
        : undefined,
  };
}

export function getControlPlaneHealthChecks(cp: ControlPlaneClass | null | undefined) {
  if (!cp) return { healthCheck: undefined, machineHealthCheck: undefined };
  return {
    // v1beta2
    healthCheck: 'healthCheck' in cp ? (cp as ControlPlaneClassV1Beta2).healthCheck : undefined,
    // v1beta1
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
  valueFrom?: {
    variable?: string;
    template?: string;
  };
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
  enableIf?: string; // v1beta1 only
  enabledIf?: string; // v1beta2 only
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

export interface ClusterClassSpecV1Beta1 {
  availabilityGates?: ReadinessGate[];
  infrastructure?: InfrastructureClassV1Beta1;
  infrastructureNamingStrategy?: { template?: string }; // v1beta1 only
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

export interface ClusterClassStatusV1Beta2Nested {
  conditions?: MetaV1Condition[];
}

export interface ClusterClassStatusDeprecatedV1Beta1 {
  conditions?: ClusterV1Condition[];
}

export interface ClusterClassStatusV1Beta1 {
  observedGeneration?: number;
  variables?: ClusterClassStatusVariable[];
  conditions?: ClusterV1Condition[]; // v1beta1 only
  v1beta2?: ClusterClassStatusV1Beta2Nested; // v1beta1 only
}

export interface ClusterClassStatusV1Beta2 {
  observedGeneration?: number;
  variables?: ClusterClassStatusVariable[];
  conditions?: MetaV1Condition[]; // v1beta2 only
  deprecated?: {
    v1beta1?: ClusterClassStatusDeprecatedV1Beta1; // v1beta2 only
  };
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

function isV1Beta2Status(
  status: ClusterClassStatusV1Beta1 | ClusterClassStatusV1Beta2
): status is ClusterClassStatusV1Beta2 {
  return 'deprecated' in status;
}

export function getClusterClassConditions(
  item: ClusterApiClusterClass | null | undefined
): MetaV1Condition[] | ClusterV1Condition[] | undefined {
  const status = item?.status;
  if (!status) return undefined;
  if (isV1Beta2Status(status)) return status.conditions;
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
