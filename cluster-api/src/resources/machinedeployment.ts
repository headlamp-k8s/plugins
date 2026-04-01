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

export interface MachineDeploymentSpec {
  clusterName: string;
  replicas?: number;
  rolloutAfter?: Time;
  selector: LabelSelector;
  template: MachineTemplateSpec;
  strategy?: MachineDeploymentStrategy; // v1beta1
  rollout?: MachineDeploymentRollout; // v1beta2
  minReadySeconds?: number;
  revisionHistoryLimit?: number;
  paused?: boolean;
  progressDeadlineSeconds?: number;
  deletePolicy?: 'Random' | 'Newest' | 'Oldest'; // v1beta1
  deletion?: {
    order?: 'Random' | 'Newest' | 'Oldest'; // v1beta2
    nodeDrainTimeoutSeconds?: number;
    nodeVolumeDetachTimeoutSeconds?: number;
    nodeDeletionTimeoutSeconds?: number;
  };
}

export interface MachineDeploymentStatusCommon {
  phase?: string;
  observedGeneration?: number;
  selector?: string;
  replicas?: number;
  updatedReplicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
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

export class MachineDeployment extends KubeObject<ClusterApiMachineDeployment> {
  static readonly apiName = 'machinedeployments';
  static apiVersion = `${MACHINEDEPLOYMENT_API_GROUP}/v1beta1`;
  static readonly crdName = MACHINEDEPLOYMENT_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'MachineDeployment';

  static get detailsRoute() {
    return '/cluster-api/machinedeployments/:namespace/:name';
  }

  static withApiVersion(version: string): typeof MachineDeployment {
    const versionedClass = class extends MachineDeployment {} as typeof MachineDeployment;
    versionedClass.apiVersion = `${MACHINEDEPLOYMENT_API_GROUP}/${version}`;
    return versionedClass;
  }

  get spec(): MachineDeploymentSpec | undefined {
    return this.jsonData.spec;
  }

  get status(): MachineDeploymentStatusCommon | undefined {
    return getMachineDeploymentStatus(this.jsonData);
  }

  get conditions(): MetaV1Condition[] | ClusterV1Condition[] | undefined {
    return getMachineDeploymentConditions(this.jsonData);
  }

  get failure(): { failureReason?: string; failureMessage?: string } | undefined {
    return getMachineDeploymentFailure(this.jsonData);
  }

  get upToDateReplicas(): number | undefined {
    return getMachineDeploymentUpToDateReplicas(this.jsonData);
  }

  static get isScalable() {
    return true;
  }
}
