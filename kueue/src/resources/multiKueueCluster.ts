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
  /** Location type, for example `Secret`. */
  locationType?: string;
}

/** Desired state of a MultiKueueCluster. */
export interface MultiKueueClusterSpec {
  /** KubeConfig settings used to connect to the remote worker cluster. */
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
    return this.spec.kubeConfig?.location || '-';
  }

  get kubeConfigType(): string {
    return this.spec.kubeConfig?.locationType || 'Secret';
  }

  get activeCondition(): KueueCondition | undefined {
    return this.conditions.find(c => c.type === 'Active');
  }

  get isConnected(): boolean {
    return this.activeCondition?.status === 'True';
  }

  get connectionStatus(): 'Connected' | 'Disconnected' | 'Unknown' {
    if (!this.activeCondition) return 'Unknown';
    return this.activeCondition.status === 'True' ? 'Connected' : 'Disconnected';
  }
}
