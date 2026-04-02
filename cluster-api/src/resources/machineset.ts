import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ClusterV1Condition, LabelSelector, MetaV1Condition, ObjectMeta } from './common';
import { MachineSpec } from './machine';

const MACHINESET_API_GROUP = 'cluster.x-k8s.io';
const MACHINESET_CRD_NAME = 'machinesets.cluster.x-k8s.io';

export interface MachineTemplateSpec {
  metadata?: ObjectMeta;
  spec: MachineSpec;
}

export interface MachineSetSpec {
  clusterName: string;
  replicas?: number;
  minReadySeconds?: number;
  selector: LabelSelector;
  template: MachineTemplateSpec;
  machineNamingStrategy?: {
    template?: string;
  };
  deletePolicy?: 'Random' | 'Newest' | 'Oldest'; // v1beta1 only — delete policy for scaling down
  deletion?: {
    // v1beta2 only — replaces deletePolicy with richer deletion config
    order?: 'Random' | 'Newest' | 'Oldest';
    nodeDrainTimeoutSeconds?: number;
    nodeVolumeDetachTimeoutSeconds?: number;
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

export interface MachineSetStatusCommon {
  selector?: string;
  replicas?: number;
  readyReplicas?: number;
  availableReplicas?: number;
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

export class MachineSet extends KubeObject<ClusterApiMachineSet> {
  static readonly apiName = 'machinesets';
  static apiVersion = `${MACHINESET_API_GROUP}/v1beta1`;
  static readonly crdName = MACHINESET_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'MachineSet';

  static get detailsRoute() {
    return '/cluster-api/machinesets/:namespace/:name';
  }

  static withApiVersion(version: string): typeof MachineSet {
    const versionedClass = class extends MachineSet {} as typeof MachineSet;
    versionedClass.apiVersion = `${MACHINESET_API_GROUP}/${version}`;
    return versionedClass;
  }

  get spec(): MachineSetSpec {
    return this.jsonData.spec;
  }

  get status(): MachineSetStatusCommon | undefined {
    return getMachineSetStatus(this.jsonData);
  }

  get conditions(): MetaV1Condition[] | ClusterV1Condition[] | undefined {
    return getMachineSetConditions(this.jsonData);
  }
  get failure(): { failureReason?: string; failureMessage?: string } | undefined {
    return getMachineSetFailure(this.jsonData);
  }
  get upToDateReplicas(): number | undefined {
    return getMachineSetUpToDateReplicas(this.jsonData);
  }

  static get isScalable() {
    return true;
  }
}
