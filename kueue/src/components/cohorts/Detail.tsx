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
function getResourceGroupsSection(cohort: Cohort) {
  const rows = getResourceGroupRows(cohort.resourceGroups);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'resource-groups',
    section: (
      <SectionBox title="Resource Groups">
        <SimpleTable
          data={rows}
          columns={[
            {
              label: 'Group',
              getter: (row: ResourceGroupRow) => row.group,
            },
            {
              label: 'Covered Resources',
              getter: (row: ResourceGroupRow) => row.coveredResources,
            },
            {
              label: 'ResourceFlavor',
              getter: (row: ResourceGroupRow) =>
                row.flavor === '-' ? '-' : renderResourceFlavorLink(row.flavor),
            },
            {
              label: 'Resource',
              getter: (row: ResourceGroupRow) => row.resource,
            },
            {
              label: 'Nominal Quota',
              getter: (row: ResourceGroupRow) => row.nominalQuota,
            },
            {
              label: 'Borrowing Limit',
              getter: (row: ResourceGroupRow) => row.borrowingLimit ?? '-',
            },
            {
              label: 'Lending Limit',
              getter: (row: ResourceGroupRow) => row.lendingLimit ?? '-',
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build a linked ResourceFlavor section for all flavors referenced by the Cohort. */
function getReferencedFlavorsSection(cohort: Cohort) {
  if (!cohort.referencedFlavorNames.length) {
    return null;
  }

  const rows = cohort.referencedFlavorNames.map(flavorName => ({ name: flavorName }));

  return {
    id: 'referenced-resourceflavors',
    section: (
      <SectionBox title="Referenced ResourceFlavors">
        <SimpleTable
          data={rows}
          columns={[
            {
              label: 'Name',
              getter: (row: { name: string }) => renderResourceFlavorLink(row.name),
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build a linked table for child Cohorts. */
function getChildCohortsSection(cohort: Cohort, cohorts: Cohort[] | null, error: unknown) {
  if (error) {
    return {
      id: 'child-cohorts',
      section: (
        <SectionBox title="Child Cohorts">
          <EmptyContent color="text.secondary">Child Cohorts are unavailable.</EmptyContent>
        </SectionBox>
      ),
    };
  }

  if (!cohorts) {
    return {
      id: 'child-cohorts',
      section: <Loader title="Loading child Cohorts..." />,
    };
  }

  const rows = getChildCohorts(cohorts, cohort.metadata.name);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'child-cohorts',
    section: (
      <SectionBox title="Child Cohorts">
        <SimpleTable
          data={rows}
          columns={[
            {
              label: 'Name',
              getter: (childCohort: Cohort) => renderCohortLink(childCohort.metadata.name),
            },
            {
              label: 'Resource Groups',
              getter: (childCohort: Cohort) => childCohort.resourceGroupsDisplay,
            },
            {
              label: 'Fair Sharing Weight',
              getter: (childCohort: Cohort) => childCohort.fairSharingWeight,
            },
            {
              label: 'Weighted Share',
              getter: (childCohort: Cohort) => childCohort.weightedShare,
            },
            {
              label: 'Age',
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
  error: unknown
) {
  if (error) {
    return {
      id: 'member-clusterqueues',
      section: (
        <SectionBox title="Member ClusterQueues">
          <EmptyContent color="text.secondary">Member ClusterQueues are unavailable.</EmptyContent>
        </SectionBox>
      ),
    };
  }

  if (!clusterQueues) {
    return {
      id: 'member-clusterqueues',
      section: <Loader title="Loading member ClusterQueues..." />,
    };
  }

  const rows = getCohortClusterQueues(clusterQueues, cohort.metadata.name);

  if (rows.length === 0) {
    return null;
  }

  return {
    id: 'member-clusterqueues',
    section: (
      <SectionBox title="Member ClusterQueues">
        <SimpleTable
          data={rows}
          columns={[
            {
              label: 'Name',
              getter: (clusterQueue: ClusterQueue) =>
                renderClusterQueueLink(clusterQueue.metadata.name),
            },
            {
              label: 'Queueing Strategy',
              getter: (clusterQueue: ClusterQueue) => clusterQueue.queueingStrategy,
            },
            {
              label: 'Resource Groups',
              getter: (clusterQueue: ClusterQueue) => clusterQueue.resourceGroupsDisplay,
            },
            {
              label: 'Pending Workloads',
              getter: (clusterQueue: ClusterQueue) => clusterQueue.pendingWorkloads,
            },
            {
              label: 'Admitted Workloads',
              getter: (clusterQueue: ClusterQueue) => clusterQueue.admittedWorkloads,
            },
            {
              label: 'Status',
              getter: (clusterQueue: ClusterQueue) => clusterQueue.statusDisplay,
            },
            {
              label: 'Age',
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
  const { name } = useParams<{ name: string }>();
  const [clusterQueues, clusterQueuesError] = ClusterQueue.useList();
  const [cohorts, cohortsError] = Cohort.useList();

  return (
    <KueueAdminResourceAccess resourceClass={Cohort} resourceLabel="Cohorts" verb="get">
      <DetailsGrid
        resourceType={Cohort}
        name={name}
        withEvents
        extraInfo={cohort =>
          cohort
            ? [
                {
                  name: 'Parent Cohort',
                  value: renderParentCohortLink(cohort.spec.parentName),
                },
                {
                  name: 'Fair Sharing Weight',
                  value: cohort.fairSharingWeight,
                },
                {
                  name: 'Weighted Share',
                  value: cohort.weightedShare,
                },
                {
                  name: 'Resource Groups',
                  value: cohort.resourceGroupsDisplay,
                },
                {
                  name: 'Referenced ResourceFlavors',
                  value: cohort.referencedFlavorNamesDisplay,
                },
              ]
            : []
        }
        extraSections={cohort =>
          cohort
            ? [
                getResourceGroupsSection(cohort),
                getReferencedFlavorsSection(cohort),
                getChildCohortsSection(cohort, cohorts, cohortsError),
                getMemberClusterQueuesSection(cohort, clusterQueues, clusterQueuesError),
              ].filter(Boolean)
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
