import { K8s } from '@kinvolk/headlamp-plugin/lib';
import type { KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import type { KueueCondition } from './clusterQueue';

const KubeObject = K8s.cluster.KubeObject;

/** KubeConfig reference defined in MultiKueueCluster spec. */
export interface MultiKueueKubeConfig {
  /** Location string, for example secret name or path. */
  location: string;
  /** Location type, for example `Secret` or `Path`. */
  locationType?: string;
}

/** ClusterProfile reference defined in MultiKueueCluster v1beta2 spec. */
export interface MultiKueueClusterProfileRef {
  /** Name of the referenced ClusterProfile. */
  name: string;
}

/** ClusterSource configuration defining how to access the remote cluster (v1beta2). */
export interface MultiKueueClusterSource {
  /** KubeConfig settings used to connect to the remote worker cluster. */
  kubeConfig?: MultiKueueKubeConfig;
  /** Reference to a ClusterProfile resource. */
  clusterProfileRef?: MultiKueueClusterProfileRef;
}

/** Desired state of a MultiKueueCluster. */
export interface MultiKueueClusterSpec {
  /** Cluster source settings (v1beta2). */
  clusterSource?: MultiKueueClusterSource;
  /** Deprecated direct KubeConfig settings (v1beta1 fallback). */
  kubeConfig?: MultiKueueKubeConfig;
}

/** Observed status of a MultiKueueCluster. */
export interface MultiKueueClusterStatus {
  /** Conditions observing remote worker cluster connectivity and readiness. */
  conditions?: KueueCondition[];
}

/** Kubernetes MultiKueueCluster object returned by the Kueue API. */
export interface KubeMultiKueueCluster extends KubeObjectInterface {
  metadata: KubeObjectInterface['metadata'];
  spec?: MultiKueueClusterSpec;
  status?: MultiKueueClusterStatus;
}

export class MultiKueueCluster extends KubeObject<KubeMultiKueueCluster> {
  static kind = 'MultiKueueCluster';
  static apiName = 'multikueueclusters';
  static apiVersion = kueueApiVersions;
  static isNamespaced = false;

  static get detailsRoute() {
    return kueueRoutePaths.multiKueueClusterDetail;
  }

  get spec(): MultiKueueClusterSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): MultiKueueClusterStatus {
    return this.jsonData.status ?? {};
  }

  get conditions(): KueueCondition[] {
    return this.status.conditions || [];
  }

  get kubeConfigLocation(): string {
    if (this.spec.clusterSource?.clusterProfileRef?.name) {
      return this.spec.clusterSource.clusterProfileRef.name;
    }
    const cfg = this.spec.clusterSource?.kubeConfig || this.spec.kubeConfig;
    return cfg?.location || '-';
  }

  get kubeConfigType(): string {
    if (this.spec.clusterSource?.clusterProfileRef?.name) {
      return 'ClusterProfile';
    }
    const cfg = this.spec.clusterSource?.kubeConfig || this.spec.kubeConfig;
    return cfg?.locationType || (cfg?.location ? 'Secret' : '-');
  }

  get activeCondition(): KueueCondition | undefined {
    return this.conditions.find(c => c.type === 'Active');
  }

  get isConnected(): boolean {
    return this.activeCondition?.status === 'True';
  }

  get connectionStatus(): 'Connected' | 'Disconnected' | 'Unknown' {
    if (!this.activeCondition) return 'Unknown';
    if (this.activeCondition.status === 'True') return 'Connected';
    if (this.activeCondition.status === 'False') return 'Disconnected';
    return 'Unknown';
  }
}
