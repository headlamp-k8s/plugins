import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import type { KueueCondition } from './clusterQueue';
import {
  renderAdmissionCheckStatus,
  renderControllerName,
  renderParameters,
  type AdmissionCheckParametersLike,
} from './admissionCheckFormatters';

/**
 * Reference to the parameters object configuring an AdmissionCheck.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckparametersreference
 */
export interface AdmissionCheckParametersReference extends AdmissionCheckParametersLike {
  /**
   * API group of the referenced parameters object.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckparametersreference
   */
  apiGroup?: string;
  /**
   * Kind of the referenced parameters object.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckparametersreference
   */
  kind?: string;
  /**
   * Name of the referenced parameters object.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckparametersreference
   */
  name?: string;
}

/**
 * Desired state of a Kueue AdmissionCheck.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckspec
 */
export interface AdmissionCheckSpec {
  /**
   * Identifies the controller that processes this AdmissionCheck. Cannot be empty.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckspec
   */
  controllerName: string;
  /**
   * Reference to a configuration object with additional parameters for the check.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckspec
   */
  parameters?: AdmissionCheckParametersReference;
  /**
   * Deprecated: how long to keep a workload suspended after a failed check.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckspec
   */
  retryDelayMinutes?: number;
}

/**
 * Observed state of a Kueue AdmissionCheck.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#admissioncheckstatus
 */
export interface AdmissionCheckStatus {
  /**
   * Latest observations of AdmissionCheck state, including an `Active` condition.
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
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#objectmeta-v1-meta
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
    return this.jsonData.spec ?? ({} as AdmissionCheckSpec);
  }

  get status(): AdmissionCheckStatus {
    return this.jsonData.status ?? {};
  }

  get controllerName() {
    return renderControllerName(this.spec.controllerName);
  }

  get parameters() {
    return this.spec.parameters;
  }

  get parametersDisplay() {
    return renderParameters(this.parameters);
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