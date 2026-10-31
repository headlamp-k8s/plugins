import { useTranslation } from '@kinvolk/headlamp-plugin/lib';
import {
  DetailsGrid,
  EmptyContent,
  Loader,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { ClusterQueue } from '../../resources/clusterQueue';
import { getResourceGroupRows, ResourceGroupRow } from '../../resources/clusterQueueFormatters';
import { Cohort } from '../../resources/cohort';
import { getChildCohorts, getCohortClusterQueues } from '../../resources/cohortRelations';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';
import {
  renderClusterQueueLink,
  renderCohortLink,
  renderParentCohortLink,
  renderResourceFlavorLink,
} from '../common/KueueResourceLinks';

/** Build the detail section that shows spec.resourceGroups as a table. */
function getResourceGroupsSection(cohort: Cohort, t: (key: string) => string) {
  const rows = getResourceGroupRows(cohort.resourceGroups);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'resource-groups',
    section: (
      <SectionBox title={t('Resource Groups')}>
        <SimpleTable
          data={rows}
          columns={[
            {
              label: t('Group'),
              getter: (row: ResourceGroupRow) => row.group,
            },
            {
              label: t('Covered Resources'),
              getter: (row: ResourceGroupRow) => row.coveredResources,
            },
            {
              label: t('ResourceFlavor'),
              getter: (row: ResourceGroupRow) =>
                row.flavor === '-' ? '-' : renderResourceFlavorLink(row.flavor),
            },
            {
              label: t('Resource'),
              getter: (row: ResourceGroupRow) => row.resource,
            },
            {
              label: t('Nominal Quota'),
              getter: (row: ResourceGroupRow) => row.nominalQuota,
            },
            {
              label: t('Borrowing Limit'),
              getter: (row: ResourceGroupRow) => row.borrowingLimit ?? '-',
            },
            {
              label: t('Lending Limit'),
              getter: (row: ResourceGroupRow) => row.lendingLimit ?? '-',
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build a linked ResourceFlavor section for all flavors referenced by the Cohort. */
function getReferencedFlavorsSection(cohort: Cohort, t: (key: string) => string) {
  if (!cohort.referencedFlavorNames.length) {
    return null;
  }

  const rows = cohort.referencedFlavorNames.map(flavorName => ({ name: flavorName }));

  return {
    id: 'referenced-resourceflavors',
    section: (
      <SectionBox title={t('Referenced ResourceFlavors')}>
        <SimpleTable
          data={rows}
          columns={[
            {
              label: t('Name'),
              getter: (row: { name: string }) => renderResourceFlavorLink(row.name),
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build a linked table for child Cohorts. */
function getChildCohortsSection(
  cohort: Cohort,
  cohorts: Cohort[] | null,
  error: unknown,
  t: (key: string) => string
) {
  if (error) {
    return {
      id: 'child-cohorts',
      section: (
        <SectionBox title={t('Child Cohorts')}>
          <EmptyContent color="text.secondary">{t('Child Cohorts are unavailable.')}</EmptyContent>
        </SectionBox>
      ),
    };
  }

  if (!cohorts) {
    return {
      id: 'child-cohorts',
      section: <Loader title={t('Loading child Cohorts...')} />,
    };
  }

  const rows = getChildCohorts(cohorts, cohort.metadata.name);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'child-cohorts',
    section: (
      <SectionBox title={t('Child Cohorts')}>
        <SimpleTable
          data={rows}
          columns={[
            {
              label: t('Name'),
              getter: (childCohort: Cohort) => renderCohortLink(childCohort.metadata.name),
            },
            {
              label: t('Resource Groups'),
              getter: (childCohort: Cohort) => childCohort.resourceGroupsDisplay,
            },
            {
              label: t('Fair Sharing Weight'),
              getter: (childCohort: Cohort) => childCohort.fairSharingWeight,
            },
            {
              label: t('Weighted Share'),
              getter: (childCohort: Cohort) => childCohort.weightedShare,
            },
            {
              label: t('Age'),
              getter: (childCohort: Cohort) => childCohort.getAge(),
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build a linked table for ClusterQueues that belong to the Cohort. */
function getMemberClusterQueuesSection(
  cohort: Cohort,
  clusterQueues: ClusterQueue[] | null,
  error: unknown,
  t: (key: string) => string
) {
  if (error) {
    return {
      id: 'member-clusterqueues',
      section: (
        <SectionBox title={t('Member ClusterQueues')}>
          <EmptyContent color="text.secondary">
            {t('Member ClusterQueues are unavailable.')}
          </EmptyContent>
        </SectionBox>
      ),
    };
  }

  if (!clusterQueues) {
    return {
      id: 'member-clusterqueues',
      section: <Loader title={t('Loading member ClusterQueues...')} />,
    };
  }

  const rows = getCohortClusterQueues(clusterQueues, cohort.metadata.name);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'member-clusterqueues',
    section: (
      <SectionBox title={t('Member ClusterQueues')}>
        <SimpleTable
          data={rows}
          columns={[
            {
              label: t('Name'),
              getter: (clusterQueue: ClusterQueue) =>
                renderClusterQueueLink(clusterQueue.metadata.name),
            },
            {
              label: t('Queueing Strategy'),
              getter: (clusterQueue: ClusterQueue) => clusterQueue.queueingStrategy,
            },
            {
              label: t('Resource Groups'),
              getter: (clusterQueue: ClusterQueue) => clusterQueue.resourceGroupsDisplay,
            },
            {
              label: t('Pending Workloads'),
              getter: (clusterQueue: ClusterQueue) => clusterQueue.pendingWorkloads,
            },
            {
              label: t('Admitted Workloads'),
              getter: (clusterQueue: ClusterQueue) => clusterQueue.admittedWorkloads,
            },
            {
              label: t('Status'),
              getter: (clusterQueue: ClusterQueue) => clusterQueue.statusDisplay,
            },
            {
              label: t('Age'),
              getter: (clusterQueue: ClusterQueue) => clusterQueue.getAge(),
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Detail view for a cluster-scoped Kueue Cohort resource. */
export default function CohortDetail() {
  const { t } = useTranslation();
  const { name } = useParams<{ name: string }>();
  const [clusterQueues, clusterQueuesError] = ClusterQueue.useList();
  const [cohorts, cohortsError] = Cohort.useList();

  return (
    <KueueAdminResourceAccess resourceClass={Cohort} resourceLabel={t('Cohorts')} verb="get">
      <DetailsGrid
        resourceType={Cohort}
        name={name}
        withEvents
        extraInfo={cohort =>
          cohort
            ? [
                {
                  name: t('Parent Cohort'),
                  value: renderParentCohortLink(cohort.spec.parentName),
                },
                {
                  name: t('Fair Sharing Weight'),
                  value: cohort.fairSharingWeight,
                },
                {
                  name: t('Weighted Share'),
                  value: cohort.weightedShare,
                },
                {
                  name: t('Resource Groups'),
                  value: cohort.resourceGroupsDisplay,
                },
                {
                  name: t('Referenced ResourceFlavors'),
                  value: cohort.referencedFlavorNamesDisplay,
                },
              ]
            : []
        }
        extraSections={cohort =>
          cohort
            ? [
                getResourceGroupsSection(cohort, t),
                getReferencedFlavorsSection(cohort, t),
                getChildCohortsSection(cohort, cohorts, cohortsError, t),
                getMemberClusterQueuesSection(cohort, clusterQueues, clusterQueuesError, t),
              ].filter(Boolean)
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
