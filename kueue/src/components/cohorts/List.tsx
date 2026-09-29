import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import { ResourceListView } from '@kinvolk/headlamp-plugin/lib/CommonComponents';
import { useMemo } from 'react';
import { ClusterQueue } from '../../resources/clusterQueue';
import { Cohort } from '../../resources/cohort';
import { renderRelatedCount } from '../../resources/cohortFormatters';
import {
  groupChildCohortsByParent,
  groupClusterQueuesByCohort,
} from '../../resources/cohortRelations';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';
import { renderParentCohortLink } from '../common/KueueResourceLinks';

export default function CohortList() {
  const { t } = useTranslation();
  const [clusterQueues, clusterQueuesError] = ClusterQueue.useList();
  const [cohorts, cohortsError] = Cohort.useList();

  const clusterQueuesByCohort = useMemo(
    () => groupClusterQueuesByCohort(clusterQueues),
    [clusterQueues]
  );
  const childCohortsByCohort = useMemo(() => groupChildCohortsByParent(cohorts), [cohorts]);
  const getClusterQueueCount = (cohort: Cohort) => {
    if (clusterQueuesError) {
      return t('Unavailable');
    }

    if (!clusterQueues) {
      return t('Loading');
    }

    return renderRelatedCount(clusterQueuesByCohort.get(cohort.metadata.name));
  };
  const getChildCohortCount = (cohort: Cohort) => {
    if (cohortsError) {
      return t('Unavailable');
    }

    if (!cohorts) {
      return t('Loading');
    }

    return renderRelatedCount(childCohortsByCohort.get(cohort.metadata.name));
  };

  return (
    <KueueAdminResourceAccess resourceClass={Cohort} resourceLabel={t('Cohorts')} verb="list">
      <ResourceListView
        title={t('Kueue Cohorts')}
        resourceClass={Cohort}
        columns={[
          'name',
          {
            id: 'parentCohort',
            label: t('Parent Cohort'),
            getValue: (cohort: Cohort) => cohort.parentNameDisplay,
            render: (cohort: Cohort) => renderParentCohortLink(cohort.spec.parentName),
          },
          {
            id: 'clusterQueues',
            label: t('ClusterQueues'),
            getValue: (cohort: Cohort) => getClusterQueueCount(cohort),
          },
          {
            id: 'childCohorts',
            label: t('Child Cohorts'),
            getValue: (cohort: Cohort) => getChildCohortCount(cohort),
          },
          {
            id: 'resourceGroups',
            label: t('Resource Groups'),
            getValue: (cohort: Cohort) => cohort.resourceGroupsDisplay,
          },
          {
            id: 'resourceFlavors',
            label: t('Resource Flavors'),
            getValue: (cohort: Cohort) => cohort.referencedFlavorNamesDisplay,
          },
          {
            id: 'fairSharingWeight',
            label: t('Fair Sharing Weight'),
            getValue: (cohort: Cohort) => cohort.fairSharingWeight,
          },
          {
            id: 'weightedShare',
            label: t('Weighted Share'),
            getValue: (cohort: Cohort) => cohort.weightedShare,
          },
          'age',
        ]}
      />
    </KueueAdminResourceAccess>
  );
}
