import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import { renderClusterCount, renderClusters } from './multiKueueConfigFormatters';

/**
 * Desired state of a Kueue MultiKueueConfig.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#multikueueconfigspec
 */
export interface MultiKueueConfigSpec {
  /**
   * Worker cluster names, referencing MultiKueueCluster objects, tried in priority order.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#multikueueconfigspec
   * @see https://kueue.sigs.k8s.io/docs/concepts/multikueue/
   */
  clusters: string[];
}

/**
 * Kubernetes MultiKueueConfig object returned by the Kueue API.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#multikueueconfig
 */
export interface KubeMultiKueueConfig extends KubeObjectInterface {
  /**
   * Kubernetes object metadata for the MultiKueueConfig.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#objectmeta-v1-meta
   */
  metadata: KubeObjectInterface['metadata'];
  /**
   * MultiKueueConfig desired state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#multikueueconfigspec
   */
  spec: MultiKueueConfigSpec;
}

export class MultiKueueConfig extends KubeObject<KubeMultiKueueConfig> {
  static kind = 'MultiKueueConfig';
  static apiName = 'multikueueconfigs';
  static apiVersion = kueueApiVersions;
  static isNamespaced = false;

  static get detailsRoute() {
    return kueueRoutePaths.multiKueueConfigDetail;
  }

  get spec(): MultiKueueConfigSpec {
    return this.jsonData.spec ?? ({ clusters: [] } as MultiKueueConfigSpec);
  }

  get clusters() {
    return this.spec.clusters || [];
  }

  get clustersDisplay() {
    return renderClusters(this.clusters);
  }

  get clusterCount() {
    return renderClusterCount(this.clusters);
  }
}