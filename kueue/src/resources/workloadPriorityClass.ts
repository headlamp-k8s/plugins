import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import { renderDescription, renderPriorityValue } from './workloadPriorityClassFormatters';

/**
 * Kubernetes WorkloadPriorityClass object returned by the Kueue API.
 *
 * @see https://kueue.sigs.k8s.io/docs/concepts/workload_priority_class/
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#workloadpriorityclass
 */
export interface KubeWorkloadPriorityClass extends KubeObjectInterface {
  /**
   * Kubernetes object metadata for the WorkloadPriorityClass.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#objectmeta-v1-meta
   */
  metadata: KubeObjectInterface['metadata'];
  /**
   * Numerical priority value. Higher value means higher priority.
   *
   * @see https://kueue.sigs.k8s.io/docs/concepts/workload_priority_class/
   */
  value?: number;
  /**
   * Human-readable description of the WorkloadPriorityClass.
   *
   * @see https://kueue.sigs.k8s.io/docs/concepts/workload_priority_class/
   */
  description?: string;
}

export class WorkloadPriorityClass extends KubeObject<KubeWorkloadPriorityClass> {
  static kind = 'WorkloadPriorityClass';
  static apiName = 'workloadpriorityclasses';
  static apiVersion = kueueApiVersions;
  static isNamespaced = false;

  static get detailsRoute() {
    return kueueRoutePaths.workloadPriorityClassDetail;
  }

  get value(): number {
    return this.jsonData.value ?? 0;
  }

  get valueDisplay() {
    return renderPriorityValue(this.jsonData.value);
  }

  get description(): string {
    return this.jsonData.description || '-';
  }

  get descriptionDisplay() {
    return renderDescription(this.jsonData.description);
  }
}
