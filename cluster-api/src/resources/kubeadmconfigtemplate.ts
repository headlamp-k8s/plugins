import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { ClusterV1Condition, MetaV1Condition, ObjectMeta } from './common';
import { KubeadmConfigSpec } from './kubeadmconfig';

const KCT_API_GROUP = 'bootstrap.cluster.x-k8s.io';
const KCT_CRD_NAME = 'kubeadmconfigtemplates.bootstrap.cluster.x-k8s.io';

/**
 * KubeadmConfigTemplate resource specification.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#bootstrap-template
 */
export interface KubeadmConfigTemplateResource {
  /** Metadata is the metadata of the resource. */
  metadata?: ObjectMeta;
  /** Spec is the specification of the KubeadmConfig. */
  spec?: KubeadmConfigSpec;
}

/**
 * KubeadmConfigTemplate resource specification.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#bootstrap-template
 */
export interface KCTSpec {
  /** Template is the resource template. */
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

/**
 * Internal helper to normalize KubeadmConfigTemplate status across v1beta1/v1beta2.
 */
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

/**
 * KubeadmConfigTemplate is the KubeObject implementation for the Cluster API KubeadmConfigTemplate resource.
 * @see https://cluster-api.sigs.k8s.io/reference/glossary.html#bootstrap-template
 */
export class KubeadmConfigTemplate extends KubeObject<ClusterApiKubeadmConfigTemplate> {
  static readonly apiName = 'kubeadmconfigtemplates';
  static apiVersion = `${KCT_API_GROUP}/v1beta1`;
  static readonly crdName = KCT_CRD_NAME;
  static readonly isNamespaced = true;
  static readonly kind = 'KubeadmConfigTemplate';

  /**
   * Returns the route for the kubeadm config template details page.
   */
  static get detailsRoute() {
    return '/cluster-api/kubeadmconfigtemplates/:namespace/:name';
  }

  /**
   * Returns a version of the KubeadmConfigTemplate class with a specific API version.
   */
  static withApiVersion(version: string): typeof KubeadmConfigTemplate {
    const versionedClass = class extends KubeadmConfigTemplate {} as typeof KubeadmConfigTemplate;
    versionedClass.apiVersion = `${KCT_API_GROUP}/${version}`;
    return versionedClass;
  }

  /**
   * Returns the kubeadm config template specification.
   */
  get spec(): KCTSpec | undefined {
    return this.jsonData.spec;
  }

  /**
   * Returns normalized conditions for the template.
   */
  get conditions() {
    return getKCTConditions(this.jsonData);
  }

  /**
   * Returns failure information if present.
   */
  get failureStatus() {
    return getKCTFailure(this.jsonData);
  }

  /**
   * Returns the generation observed by the controller.
   */
  get observedGeneration() {
    return getKCTObservedGeneration(this.jsonData);
  }

  /**
   * Returns the underlying kubeadm config specification from the template.
   */
  get configSpec(): KubeadmConfigSpec | undefined {
    return getKCTConfigSpec(this.jsonData);
  }
}
