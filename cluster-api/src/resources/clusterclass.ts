import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { Condition, ObjectMeta, ReadinessGate } from './common';
import { MachineDeploymentStrategy } from './machinedeployment';
import { UnhealthyCondition } from './machinehealthcheck';

export class ClusterClass extends KubeObject<ClusterApiClusterClass> {
  static readonly apiName = 'clusterclasses';
  static readonly apiVersion = 'cluster.x-k8s.io/v1beta1';
  static readonly isNamespaced = true;
  static readonly kind = 'ClusterClass';

  static get detailsRoute() {
    return '/cluster-api/clusterclasses/:namespace/:name';
  }

  get spec() {
    return this.jsonData.spec;
  }

  get status() {
    return this.jsonData.status;
  }
}

export interface ClusterApiClusterClass extends KubeObjectInterface {
  spec?: {
    availabilityGates?: ReadinessGate[];
    infrastructure?: {
      ref: KubeObjectInterface;
    };
    infrastructureNamingStrategy?: {
      template?: string;
    };
    controlPlane?: ControlPlaneClass;
    workers?: WorkersClass;
    variables?: ClusterClassVariable[];
    patches?: ClusterClassPatch[];
  };
  status?: {
    variables?: ClusterClassStatusVariable[];
    conditions?: Condition[];
    observedGeneration?: bigint;
    v1beta2?: {
      conditions?: Condition[];
    };
  };
}

export interface ClusterClassPatch {
  name: string;
  description?: string;
  enableIf?: string;
  definitions?: PatchDefinition[];
  external?: ExternalPatchDefinition[];
}

export interface ClusterClassStatusVariable {
  name: string;
  definitionsConflict: boolean;
  definitions?: ClusterClassStatusVariableDefinition[];
}

export interface ClusterClassStatusVariableDefinition {
  from: string;
  required: boolean;
  metadata?: ClusterClassVariableMetadata;
  schema: JSON;
}

export interface ClusterClassVariable {
  name: string;
  required: boolean;
  metadata?: ClusterClassVariableMetadata; // deprecated
  schema: JSON;
}

export interface ClusterClassVariableMetadata {
  // deprecated
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
}

export interface ControlPlaneClass extends LocalObjectTemplate {
  metadata?: ObjectMeta;
  machineInfrastructure?: LocalObjectTemplate;
  machineHealthCheck?: MachineHealthCheckClass;
  namingStrategy?: {
    template?: string;
  };
  nodeDrainTimeout?: number;
  nodeVolumeDetachTimeout?: number;
  nodeDeletionTimeout?: number;
  readinessGates?: ReadinessGate[];
}

export interface ExternalPatchDefinition {
  generateExtension?: string;
  validateExtension?: string;
  discoverVariableExtension?: string;
  settings?: Record<string, string>;
}

export interface JSONPatch {
  op: 'add' | 'replace' | 'remove';
  path: string;
  value?: JSON;
  valueFrom?: {
    variable?: string;
    template?: string;
  };
}

export interface LocalObjectTemplate {
  kind: string;
  apiVersion: string;
  metadata?: ObjectMeta;
}

export interface MachineDeploymentClass extends LocalObjectTemplate {
  class: string;
  template: {
    metadata?: ObjectMeta;
    bootstrap?: LocalObjectTemplate;
    infrastructure?: LocalObjectTemplate;
  };
  machineHealthCheck?: MachineHealthCheckClass;
  failureDomain?: string;
  namingStrategy?: {
    template?: string;
  };
  nodeDrainTimeout?: number;
  nodeVolumeDetachTimeout?: number;
  nodeDeletionTimeout?: number;
  minReadySeconds?: number;
  readinessGates?: ReadinessGate[];
  strategy?: MachineDeploymentStrategy;
}

export interface MachineHealthCheckClass {
  unhealthyConditions?: UnhealthyCondition[];
}

export interface MachinePoolClassTemplate {
  metadata?: ObjectMeta;
  boostrap?: LocalObjectTemplate;
  infrastructure?: LocalObjectTemplate;
}

export interface MachinePoolClass {
  class: string;
  template: MachinePoolClassTemplate;
  failureDomains?: string[];
  namingStrategy?: {
    template?: string;
  };
  nodeDrainTimeout?: number;
  nodeVolumeDetachTimeout?: number;
  nodeDeletionTimeout?: number;
  minReadySeconds?: number;
}

export interface PatchDefinition {
  selector: {
    apiVersion: string;
    kind: string;
    matchResources: {
      controlPlane?: boolean;
      infrastructureCluster?: boolean;
      machineDeploymentClass?: {
        names?: string[];
      };
      machinePoolClass?: {
        names?: string[];
      };
    };
  };
  jsonPatches: JSONPatch[];
}

export interface WorkersClass extends LocalObjectTemplate {
  metadata?: ObjectMeta;
  machineDeployments: MachineDeploymentClass[];
  machinePools?: MachinePoolClass[];
}
