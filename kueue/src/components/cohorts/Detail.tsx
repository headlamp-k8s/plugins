import {
  DetailsGrid,
  Link,
  SectionBox,
  SimpleTable,
} from '@kinvolk/headlamp-plugin/lib/components/common';
import { useParams } from 'react-router-dom';
import { ClusterQueue, ResourceGroup, ResourceQuota } from '../../resources/clusterQueue';
import { Cohort } from '../../resources/cohort';
import { getChildCohorts, getCohortClusterQueues } from '../../resources/cohortRelations';
import { kueueRouteNames } from '../../utils/kueueRoutes';
import KueueAdminResourceAccess from '../common/KueueAdminResourceAccess';

/** Flattened row rendered in the Cohort resource groups table. */
interface ResourceGroupRow {
  /** Display label for the resource group index from spec.resourceGroups. */
  group: string;
  /** Comma-separated resources covered by this group, such as cpu and memory. */
  coveredResources: string;
  /** ResourceFlavor name associated with this resource quota row. */
  flavor: string;
  /** Resource name within the flavor quota, for example cpu or memory. */
  resource: string;
  /** Shared nominal quota configured for the resource and flavor pair. */
  nominalQuota: string | number;
  /** Optional quota this Cohort subtree can borrow from its parent subtree. */
  borrowingLimit?: string | number;
  /** Optional quota this Cohort subtree can lend to its parent subtree. */
  lendingLimit?: string | number;
}

/** Render a Cohort name as a Headlamp link to its detail page. */
function renderCohortLink(cohortName: string) {
  return (
    <Link routeName={kueueRouteNames.cohortDetail} params={{ name: cohortName }}>
      {cohortName}
    </Link>
  );
}

/** Render a ResourceFlavor name as a Headlamp link to its detail page. */
function renderFlavorLink(flavorName: string) {
  return (
    <Link routeName={kueueRouteNames.resourceFlavorDetail} params={{ name: flavorName }}>
      {flavorName}
    </Link>
  );
}

/** Render a ClusterQueue name as a Headlamp link to its detail page. */
function renderClusterQueueLink(clusterQueueName: string) {
  return (
    <Link routeName={kueueRouteNames.clusterQueueDetail} params={{ name: clusterQueueName }}>
      {clusterQueueName}
    </Link>
  );
}

/** Render the parent Cohort value as a link when one is configured. */
function renderParentLink(cohort: Cohort) {
  const parentName = cohort.spec.parentName;

  if (!parentName) {
    return 'Root';
  }

  return renderCohortLink(parentName);
}

/** Convert nested Cohort resource groups into table rows. */
function getResourceGroupRows(resourceGroups: ResourceGroup[]): ResourceGroupRow[] {
  return resourceGroups.flatMap((group, groupIndex): ResourceGroupRow[] => {
    const groupLabel = `Group ${groupIndex + 1}`;
    const coveredResources = group.coveredResources?.join(', ') || '-';

    if (!group.flavors?.length) {
      return [
        {
          group: groupLabel,
          coveredResources,
          flavor: '-',
          resource: '-',
          nominalQuota: '-',
        },
      ];
    }

    return group.flavors.flatMap((flavor): ResourceGroupRow[] => {
      if (!flavor.resources?.length) {
        return [
          {
            group: groupLabel,
            coveredResources,
            flavor: flavor.name,
            resource: '-',
            nominalQuota: '-',
          },
        ];
      }

      return flavor.resources.map((resource: ResourceQuota) => ({
        group: groupLabel,
        coveredResources,
        flavor: flavor.name,
        resource: resource.name,
        nominalQuota: resource.nominalQuota,
        borrowingLimit: resource.borrowingLimit,
        lendingLimit: resource.lendingLimit,
      }));
    });
  });
}

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
                row.flavor === '-' ? '-' : renderFlavorLink(row.flavor),
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
              getter: (row: { name: string }) => renderFlavorLink(row.name),
            },
          ]}
        />
      </SectionBox>
    ),
  };
}

/** Build a linked table for child Cohorts. */
function getChildCohortsSection(cohort: Cohort, cohorts: Cohort[] | null) {
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
function getMemberClusterQueuesSection(cohort: Cohort, clusterQueues: ClusterQueue[] | null) {
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
  const [clusterQueues] = ClusterQueue.useList();
  const [cohorts] = Cohort.useList();

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
                  value: renderParentLink(cohort),
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
                getChildCohortsSection(cohort, cohorts),
                getMemberClusterQueuesSection(cohort, clusterQueues),
              ].filter(Boolean)
            : []
        }
      />
    </KueueAdminResourceAccess>
  );
}
