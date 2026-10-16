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
   * Fair sharing status summarizing weighted share allocation across the Cohort.
   *
   * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#cohortstatus
   */
  fairSharing?: FairSharingStatus;
}

/**
 * Raw JSON interface for a cluster-scoped Kueue Cohort resource.
 *
 * @see https://kueue.sigs.k8s.io/docs/reference/kueue.v1beta2/#cohort
 */
export interface KubeCohort extends KubeObjectInterface {
  /** Desired specification of the Cohort. */
  spec?: CohortSpec;
  /** Observed status of the Cohort. */
  status?: CohortStatus;
}

export { buildCohortTrees, type CohortMember, type CohortTree } from './cohortRelations';

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

  get parentName(): string {
    return renderParentName(this.spec.parentName);
  }

  get parentNameDisplay(): string {
    return renderParentNameDisplay(this.spec.parentName);
  }

  get resourceGroups(): ResourceGroup[] {
    return this.spec.resourceGroups ?? [];
  }

  get resourceGroupsDisplay(): string {
    return renderCohortResourceGroupsSummary(this.resourceGroups);
  }

  get referencedFlavorNames(): string[] {
    return getCohortUniqueFlavorNames(this.resourceGroups);
  }

  get referencedFlavorNamesDisplay(): string {
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
