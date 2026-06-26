import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';

/**
 * Node label selector values associated with a Kueue ResourceFlavor.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceflavorspec
 */
export type NodeLabels = Record<string, string>;

/**
 * Node taint declared on nodes associated with a ResourceFlavor.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceflavorspec
 * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#taint-v1-core
 */
export interface ResourceFlavorTaint {
  /**
   * Taint key applied to matching nodes.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#taint-v1-core
   */
  key: string;
  /**
   * Optional taint value.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#taint-v1-core
   */
  value?: string;
  /**
   * Taint effect; Kueue evaluates `NoSchedule` and `NoExecute`.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceflavorspec
   */
  effect: string;
  /**
   * Time when the taint was added, when present.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#taint-v1-core
   */
  timeAdded?: string;
}

/**
 * Extra pod toleration added to workloads admitted with a ResourceFlavor.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceflavorspec
 * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#toleration-v1-core
 */
export interface ResourceFlavorToleration {
  /**
   * Toleration key. Empty key with `Exists` matches all taint keys.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#toleration-v1-core
   */
  key?: string;
  /**
   * Relationship between the key and value, such as `Equal` or `Exists`.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#toleration-v1-core
   */
  operator?: string;
  /**
   * Toleration value matched against the taint value.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#toleration-v1-core
   */
  value?: string;
  /**
   * Taint effect tolerated by this entry.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#toleration-v1-core
   */
  effect?: string;
  /**
   * Time period in seconds for which a `NoExecute` taint is tolerated.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#toleration-v1-core
   */
  tolerationSeconds?: number;
}

/**
 * Desired state of a Kueue ResourceFlavor.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceflavorspec
 */
export interface ResourceFlavorSpec {
  /**
   * Labels that associate the ResourceFlavor with nodes having the same labels.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceflavorspec
   */
  nodeLabels?: NodeLabels;
  /**
   * Taints on nodes associated with this ResourceFlavor.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceflavorspec
   */
  nodeTaints?: ResourceFlavorTaint[];
  /**
   * Extra tolerations added to pods admitted with this ResourceFlavor.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceflavorspec
   */
  tolerations?: ResourceFlavorToleration[];
  /**
   * Topology name used by topology-aware scheduling for this ResourceFlavor.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceflavorspec
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#topologyreference
   */
  topologyName?: string;
}

/**
 * Kubernetes ResourceFlavor object returned by the Kueue API.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceflavor
 */
export interface KubeResourceFlavor extends KubeObjectInterface {
  /**
   * Kubernetes object metadata for the ResourceFlavor.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#objectmeta-v1-meta
   */
  metadata: KubeObjectInterface['metadata'];
  /**
   * ResourceFlavor desired state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#resourceflavorspec
   */
  spec?: ResourceFlavorSpec;
}

export class ResourceFlavor extends KubeObject<KubeResourceFlavor> {
  static kind = 'ResourceFlavor';
  static apiName = 'resourceflavors';
  static apiVersion = kueueApiVersions;
  static isNamespaced = false;

  static get detailsRoute() {
    return kueueRoutePaths.resourceFlavorDetail;
  }

  get spec(): ResourceFlavorSpec {
    return this.jsonData.spec ?? ({} as ResourceFlavorSpec);
  }

  get nodeLabels() {
    return this.spec.nodeLabels || {};
  }

  get nodeLabelsDisplay() {
    const labels = Object.entries(this.nodeLabels);

    if (labels.length === 0) {
      return '-';
    }

    return labels.map(([key, value]) => `${key}=${value}`).join(', ');
  }

  get nodeTaints() {
    return this.spec.nodeTaints || [];
  }

  get nodeTaintsDisplay() {
    return renderTaints(this.nodeTaints);
  }

  get tolerations() {
    return this.spec.tolerations || [];
  }

  get tolerationsDisplay() {
    return renderTolerations(this.tolerations);
  }

  get topologyName() {
    return this.spec.topologyName || '-';
  }
}

function renderTaints(taints: ResourceFlavorTaint[]) {
  if (taints.length === 0) {
    return '-';
  }

  return taints.map(renderTaint).join(', ');
}

function renderTaint(taint: ResourceFlavorTaint) {
  const value = taint.value ? `=${taint.value}` : '';

  return `${taint.key}${value}:${taint.effect}`;
}

function renderTolerations(tolerations: ResourceFlavorToleration[]) {
  if (tolerations.length === 0) {
    return '-';
  }

  return tolerations.map(renderToleration).join(', ');
}

function renderToleration(toleration: ResourceFlavorToleration) {
  const key = toleration.key || '*';
  const value =
    toleration.operator === 'Exists' || toleration.value === undefined
      ? ''
      : `=${toleration.value}`;
  const effect = toleration.effect ? `:${toleration.effect}` : '';
  const seconds =
    toleration.tolerationSeconds === undefined ? '' : ` (${toleration.tolerationSeconds}s)`;

  return `${key}${value}${effect}${seconds}`;
}
