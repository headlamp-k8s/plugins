import { KubeObject, KubeObjectInterface } from '@kinvolk/headlamp-plugin/lib/k8s/cluster';
import { kueueApiVersions } from '../utils/kueueApi';
import { kueueRoutePaths } from '../utils/kueueRoutes';
import type { FairSharing, FairSharingStatus, ResourceGroup } from './clusterQueue';
import { renderFairSharing } from './clusterQueueFormatters';
import {
  getCohortUniqueFlavorNames,
  renderCohortFlavorNames,
  renderCohortResourceGroupsSummary,
  renderFairSharingWeight,
  renderParentName,
  renderParentNameDisplay,
  renderWeightedShare,
} from './cohortFormatters';

const COHORT_API_DOCS = 'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#cohort';
const COHORT_SPEC_DOCS = 'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#cohortspec';
const COHORT_STATUS_DOCS = 'https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#cohortstatus';

/**
 * Desired state of a Kueue Cohort.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#cohortspec
 */
export interface CohortSpec {
  /**
   * Parent Cohort name. Empty means this Cohort is a root.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#cohortspec
   */
  parentName?: string;
  /**
   * Resource groups with resources and ResourceFlavors that provide shared Cohort quota.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#cohortspec
   */
  resourceGroups?: ResourceGroup[];
  /**
   * FairSharing settings used when Kueue fair sharing is enabled.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#cohortspec
   */
  fairSharing?: FairSharing;
}

/**
 * Observed state of a Kueue Cohort.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#cohortstatus
 */
export interface CohortStatus {
  /**
   * Current FairSharing state reported by Kueue.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#cohortstatus
   */
  fairSharing?: FairSharingStatus;
}

/**
 * Kubernetes Cohort object returned by the Kueue API.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#cohort
 */
export interface KubeCohort extends KubeObjectInterface {
  /**
   * Kubernetes object metadata for the Cohort.
   *
   * @see https://kubernetes.io/docs/reference/generated/kubernetes-api/v1.30/#objectmeta-v1-meta
   */
  metadata: KubeObjectInterface['metadata'];
  /**
   * Cohort desired state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#cohortspec
   */
  spec?: CohortSpec;
  /**
   * Cohort observed state.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#cohortstatus
   */
  status?: CohortStatus;
}

export class Cohort extends KubeObject<KubeCohort> {
  static kind = 'Cohort';
  static apiName = 'cohorts';
  static apiVersion = kueueApiVersions;
  static isNamespaced = false;

  static get detailsRoute() {
    return kueueRoutePaths.cohortDetail;
  }

  get spec(): CohortSpec {
    return this.jsonData.spec ?? {};
  }

  get status(): CohortStatus {
    return this.jsonData.status ?? {};
  }

  get parentName() {
    return renderParentName(this.spec.parentName);
  }

  get parentNameDisplay() {
    return renderParentNameDisplay(this.spec.parentName);
  }

  get resourceGroups() {
    return this.spec.resourceGroups || [];
  }

  get resourceGroupsDisplay() {
    return renderCohortResourceGroupsSummary(this.resourceGroups);
  }

  get referencedFlavorNames() {
    return getCohortUniqueFlavorNames(this.resourceGroups);
  }

  get referencedFlavorNamesDisplay() {
    return renderCohortFlavorNames(this.resourceGroups);
  }

  get fairSharingWeight() {
    return renderFairSharingWeight(this.spec.fairSharing);
  }

  get fairSharingDisplay() {
    return renderFairSharing(this.spec.fairSharing, this.status.fairSharing);
  }

  get weightedShare() {
    return renderWeightedShare(this.status.fairSharing);
  }
}

export { COHORT_API_DOCS, COHORT_SPEC_DOCS, COHORT_STATUS_DOCS };
