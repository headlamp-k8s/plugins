import type {
  FairSharingLike,
  FairSharingStatusLike,
  ResourceGroupLike,
} from './clusterQueueFormatters';
import {
  getUniqueFlavorNames,
  renderResourceGroupsSummary,
  renderStringList,
} from './clusterQueueFormatters';

/** Render a Cohort parent name, falling back when this Cohort is a root. */
export function renderParentName(parentName?: string) {
  return parentName || '-';
}

/** Render a Cohort parent name for detail/list views, using Root for root Cohorts. */
export function renderParentNameDisplay(parentName?: string) {
  return parentName || 'Root';
}

/** Render a Cohort resource group summary. */
export function renderCohortResourceGroupsSummary(resourceGroups: ResourceGroupLike[]) {
  return renderResourceGroupsSummary(resourceGroups);
}

/** Return unique ResourceFlavor names referenced by Cohort resource groups. */
export function getCohortUniqueFlavorNames(resourceGroups: ResourceGroupLike[]) {
  return getUniqueFlavorNames(resourceGroups);
}

/** Render ResourceFlavor references from Cohort resource groups. */
export function renderCohortFlavorNames(resourceGroups: ResourceGroupLike[]) {
  return renderStringList(getCohortUniqueFlavorNames(resourceGroups));
}

/** Render the configured fair-sharing weight for a Cohort. */
export function renderFairSharingWeight(fairSharing?: FairSharingLike) {
  return fairSharing?.weight !== undefined ? fairSharing.weight : '-';
}

/** Render the status weighted share for a Cohort. */
export function renderWeightedShare(fairSharingStatus?: FairSharingStatusLike) {
  return fairSharingStatus?.weightedShare !== undefined ? fairSharingStatus.weightedShare : '-';
}

/** Render a related-resource count while related resources are still loading. */
export function renderRelatedCount(resources?: unknown[] | null) {
  return resources?.length ?? 0;
}
