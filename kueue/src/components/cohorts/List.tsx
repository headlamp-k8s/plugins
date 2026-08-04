import { Link, ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useMemo } from 'react';
import { ClusterQueue } from '../../resources/clusterQueue';
import { Cohort } from '../../resources/cohort';
import { renderRelatedCount } from '../../resources/cohortFormatters';
import { getChildCohorts, getCohortClusterQueues } from '../../resources/cohortRelations';
import { kueueRouteNames } from '../../utils/kueueRoutes';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

/** Render a Cohort parent reference as a detail-page link. */
function renderParentLink(cohort: Cohort) {
  const parentName = cohort.spec.parentName;

  if (!parentName) {
    return 'Root';
  }

  return (
    <Link routeName={kueueRouteNames.cohortDetail} params={{ name: parentName }}>
      {parentName}
    </Link>
  );
}

export default function CohortList() {
  const [clusterQueues] = ClusterQueue.useList();
  const [cohorts] = Cohort.useList();

  const clusterQueuesByCohort = useMemo(
    () =>
      new Map(
        (cohorts || []).map(cohort => [
          cohort.metadata.name,
          getCohortClusterQueues(clusterQueues, cohort.metadata.name),
        ])
      ),
    [clusterQueues, cohorts]
  );
  const childCohortsByCohort = useMemo(
    () =>
      new Map(
        (cohorts || []).map(cohort => [
          cohort.metadata.name,
          getChildCohorts(cohorts, cohort.metadata.name),
        ])
      ),
    [cohorts]
  );

  return (
    <KueueAdminResourceAccess resourceClass={Cohort} resourceLabel="Cohorts" verb="list">
      <ResourceListView
        title="Kueue Cohorts"
        resourceClass={Cohort}
        columns={[
          'name',
          {
            id: 'parentCohort',
            label: 'Parent Cohort',
            getValue: (cohort: Cohort) => cohort.parentNameDisplay,
            render: (cohort: Cohort) => renderParentLink(cohort),
          },
          {
            id: 'clusterQueues',
            label: 'ClusterQueues',
            getValue: (cohort: Cohort) =>
              renderRelatedCount(clusterQueuesByCohort.get(cohort.metadata.name)),
          },
          {
            id: 'childCohorts',
            label: 'Child Cohorts',
            getValue: (cohort: Cohort) =>
              renderRelatedCount(childCohortsByCohort.get(cohort.metadata.name)),
          },
          {
            id: 'resourceGroups',
            label: 'Resource Groups',
            getValue: (cohort: Cohort) => cohort.resourceGroupsDisplay,
          },
          {
            id: 'resourceFlavors',
            label: 'Resource Flavors',
            getValue: (cohort: Cohort) => cohort.referencedFlavorNamesDisplay,
          },
          {
            id: 'fairSharingWeight',
            label: 'Fair Sharing Weight',
            getValue: (cohort: Cohort) => cohort.fairSharingWeight,
          },
          {
            id: 'weightedShare',
            label: 'Weighted Share',
            getValue: (cohort: Cohort) => cohort.weightedShare,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
