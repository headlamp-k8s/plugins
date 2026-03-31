import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ClusterV1Condition, MetaV1Condition, ObjectMeta } from './common';
import { KubeadmConfigSpec } from './kubeadmconfig';

const KCT_API_GROUP = 'bootstrap.cluster.x-k8s.io';
const KCT_CRD_NAME = 'kubeadmconfigtemplates.bootstrap.cluster.x-k8s.io';

export interface KubeadmConfigTemplateResource {
  metadata?: ObjectMeta;
  spec?: KubeadmConfigSpec;
}

export interface KCTSpec {
  template: KubeadmConfigTemplateResource;
}

export interface KCTStatus {
  conditions?: ClusterV1Condition[] | MetaV1Condition[];
  observedGeneration?: number;

  // v1beta1
  failureReason?: string;
  failureMessage?: string;

  // v1beta2
  deprecated?: {
    v1beta1?: {
      failureReason?: string;
      failureMessage?: string;
    };
  };
}

export interface ClusterApiKubeadmConfigTemplate extends KubeObjectInterface {
  spec?: KCTSpec;
  status?: KCTStatus;
}

interface NormalizedKCTStatus {
  conditions?: ClusterV1Condition[] | MetaV1Condition[];
  failure?: { failureReason?: string; failureMessage?: string };
  observedGeneration?: number;
}

function normalizeKCTStatus(
  item: ClusterApiKubeadmConfigTemplate | null | undefined
): NormalizedKCTStatus {
  const status = item?.status;
  if (!status) return {};

  const failure =
    status.failureReason || status.failureMessage
      ? {
          failureReason: status.failureReason,
          failureMessage: status.failureMessage,
        }
      : status.deprecated?.v1beta1
      ? {
          failureReason: status.deprecated.v1beta1.failureReason,
          failureMessage: status.deprecated.v1beta1.failureMessage,
        }
      : undefined;

  return {
    conditions: status.conditions,
    failure,
    observedGeneration: status.observedGeneration,
  };
}

export function getKCTConditions(item: ClusterApiKubeadmConfigTemplate | null | undefined) {
  return normalizeKCTStatus(item).conditions;
}

export function getKCTFailure(item: ClusterApiKubeadmConfigTemplate | null | undefined) {
  return normalizeKCTStatus(item).failure;
}

export function getKCTObservedGeneration(item: ClusterApiKubeadmConfigTemplate | null | undefined) {
  return normalizeKCTStatus(item).observedGeneration;
}

export function getKCTConfigSpec(
  item: ClusterApiKubeadmConfigTemplate | null | undefined
): KubeadmConfigSpec | undefined {
  return item?.spec?.template?.spec;
}

export class KubeadmConfigTemplate extends KubeObject<ClusterApiKubeadmConfigTemplate> {
  static readonly apiName = 'kubeadmconfigtemplates';
  static apiVersion = `${KCT_API_GROUP}/v1beta1`;
  static readonly crdName = KCT_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'KubeadmConfigTemplate';

  static get detailsRoute() {
    return '/cluster-api/kubeadmconfigtemplates/:namespace/:name';
  }

  static withApiVersion(version: string): typeof KubeadmConfigTemplate {
    const versionedClass = class extends KubeadmConfigTemplate {} as typeof KubeadmConfigTemplate;
    versionedClass.apiVersion = `${KCT_API_GROUP}/${version}`;
    return versionedClass;
  }

  get spec(): KCTSpec | undefined {
    return this.jsonData.spec;
  }

  get conditions() {
    return getKCTConditions(this.jsonData);
  }

  get failureStatus() {
    return getKCTFailure(this.jsonData);
  }

  get observedGeneration() {
    return getKCTObservedGeneration(this.jsonData);
  }

  get configSpec(): KubeadmConfigSpec | undefined {
    return getKCTConfigSpec(this.jsonData);
  }
}
