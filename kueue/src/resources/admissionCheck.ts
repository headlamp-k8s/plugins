import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import { renderAdmissionCheckStatus, renderParametersReference } from './admissionCheckFormatters';
import type { KueueCondition } from './clusterQueue';

/**
 * Reference to a controller-specific parameters object for an AdmissionCheck.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckparametersreference
 */
export interface AdmissionCheckParametersReference {
  /**
   * API group of the referenced parameters resource; empty for the core API group.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckparametersreference
   */
  apiGroup: string;
  /**
   * Kind of the referenced parameters resource.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckparametersreference
   */
  kind: string;
  /**
   * Name of the referenced parameters resource.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckparametersreference
   */
  name: string;
}

/**
 * Desired state of a Kueue AdmissionCheck.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckspec
 */
export interface AdmissionCheckSpec {
  /**
   * Name of the controller that processes this AdmissionCheck.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckspec
   */
  controllerName: string;
  /**
   * Deprecated and unused; retry delay is now controlled by the controller.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckspec
   */
  retryDelayMinutes?: number;
  /**
   * Reference to controller-specific parameters for this AdmissionCheck.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckspec
   */
  parameters?: AdmissionCheckParametersReference;
}

/**
 * Observed state of a Kueue AdmissionCheck.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckstatus
 */
export interface AdmissionCheckStatus {
  /**
   * Conditions reported for this AdmissionCheck; includes the `Active` type.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckstatus
   */
  conditions?: KueueCondition[];
}

/**
 * Kubernetes AdmissionCheck object returned by the Kueue API.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheck
 */
export interface KubeAdmissionCheck extends KubeObjectInterface {
  /**
   * Kubernetes object metadata for the AdmissionCheck.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.28/#objectmeta-v1-meta
   */
  metadata: KubeObjectInterface['metadata'];
  /**
   * AdmissionCheck desired state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckspec
   */
  spec: AdmissionCheckSpec;
  /**
   * AdmissionCheck observed state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckstatus
   */
  status?: AdmissionCheckStatus;
}

export class AdmissionCheck extends KubeObject<KubeAdmissionCheck> {
  static kind = 'AdmissionCheck';
  static apiName = 'admissionchecks';
  static apiVersion = kueueApiVersions;
  static isNamespaced = false;

  static get detailsRoute() {
    return kueueRoutePaths.admissionCheckDetail;
  }

  get spec(): AdmissionCheckSpec {
    return this.jsonData.spec;
  }

  get status(): AdmissionCheckStatus {
    return this.jsonData.status ?? {};
  }

  get controllerName() {
    return this.spec.controllerName || '-';
  }

  get parametersDisplay() {
    return renderParametersReference(this.spec.parameters);
  }

  get retryDelayMinutes() {
    return this.spec.retryDelayMinutes ?? '-';
  }

  get conditions() {
    return this.status.conditions || [];
  }

  get activeCondition() {
    return this.conditions.find(condition => condition.type === 'Active');
  }

  get statusDisplay() {
    return renderAdmissionCheckStatus(this.activeCondition);
  }
}
