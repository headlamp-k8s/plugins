import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import {
  renderManagedResources,
  renderPodSetMergePolicy,
  renderProvisioningClassName,
  renderRetryStrategy,
  type RetryStrategyLike,
} from './provisioningRequestConfigFormatters';

/**
 * Retry strategy for a ProvisioningRequest created from this config.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#retrystrategy
 */
export interface RetryStrategy extends RetryStrategyLike {
  /**
   * Number of times a failed ProvisioningRequest is retried. Defaults to 3.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#retrystrategy
   */
  backoffLimitCount?: number;
  /**
   * Base, in seconds, used to calculate the backoff time before a retry.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#retrystrategy
   */
  backoffBaseSeconds?: number;
  /**
   * Maximum backoff time, in seconds, before a retry.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#retrystrategy
   */
  backoffMaxSeconds?: number;
}

/**
 * Desired state of a Kueue ProvisioningRequestConfig.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#provisioningrequestconfigspec
 */
export interface ProvisioningRequestConfigSpec {
  /**
   * ProvisioningClass describing the mode used to provision resources.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#provisioningrequestconfigspec
   */
  provisioningClassName: string;
  /**
   * Resources managed by the autoscaling; if empty, all resources are managed.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#provisioningrequestconfigspec
   */
  managedResources?: string[];
  /**
   * Strategy for retrying a failed ProvisioningRequest.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#provisioningrequestconfigspec
   */
  retryStrategy?: RetryStrategy;
  /**
   * Policy for merging pod sets into the ProvisioningRequest.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#provisioningrequestconfigspec
   */
  podSetMergePolicy?: string;
}

/**
 * Kubernetes ProvisioningRequestConfig object returned by the Kueue API.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#provisioningrequestconfig
 */
export interface KubeProvisioningRequestConfig extends KubeObjectInterface {
  /**
   * Kubernetes object metadata for the ProvisioningRequestConfig.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#objectmeta-v1-meta
   */
  metadata: KubeObjectInterface['metadata'];
  /**
   * ProvisioningRequestConfig desired state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#provisioningrequestconfigspec
   */
  spec: ProvisioningRequestConfigSpec;
}

export class ProvisioningRequestConfig extends KubeObject<KubeProvisioningRequestConfig> {
  static kind = 'ProvisioningRequestConfig';
  static apiName = 'provisioningrequestconfigs';
  static apiVersion = kueueApiVersions;
  static isNamespaced = false;

  static get detailsRoute() {
    return kueueRoutePaths.provisioningRequestConfigDetail;
  }

  get spec(): ProvisioningRequestConfigSpec {
    return this.jsonData.spec ?? ({} as ProvisioningRequestConfigSpec);
  }

  get provisioningClassName() {
    return renderProvisioningClassName(this.spec.provisioningClassName);
  }

  get managedResources() {
    return this.spec.managedResources || [];
  }

  get managedResourcesDisplay() {
    return renderManagedResources(this.managedResources);
  }

  get retryStrategyDisplay() {
    return renderRetryStrategy(this.spec.retryStrategy);
  }

  get podSetMergePolicyDisplay() {
    return renderPodSetMergePolicy(this.spec.podSetMergePolicy);
  }
}